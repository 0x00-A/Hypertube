import torrentStream from 'torrent-stream';
import type { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import { MovieRepository } from '../repositories/movie.repository';
import { SubtitleService } from './SubtitleService';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { NotFoundError, BadRequestError } from '../core/errors/customErrors';
import { IMovieDocument } from '../models/movie.model.types';
import { ITorrent } from '../interfaces/movie.interface';

// ============================================================================
// Types
// ============================================================================

interface ActiveEngine {
  engine: ReturnType<typeof torrentStream>;
  movieId: string;
  file: {
    name: string;
    path: string;
    length: number;
    createReadStream: (opts?: { start?: number; end?: number }) => Readable;
  } | null;
  ready: boolean;
  readyPromise: Promise<void>;
}

export interface StreamableFile {
  /** Absolute path to the file on disk (for already-downloaded movies) */
  filePath?: string;
  /** Total size in bytes */
  fileSize: number;
  /** MIME type - video/mp4, video/webm, video/x-matroska */
  mimeType: string;
  /** Whether the file needs ffmpeg transcoding for browser playback */
  needsTranscoding: boolean;
  /** If not fully downloaded, a function to create a readable stream from the torrent */
  createTorrentStream?: (start?: number, end?: number) => Readable;
  /** The movie document */
  movie: IMovieDocument;
}

// Map of file extensions to MIME types
const VIDEO_MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.m4v': 'video/mp4',
};

// Extensions that browsers can play natively (no transcoding needed)
const BROWSER_PLAYABLE = new Set(['.mp4', '.webm', '.m4v']);

// ============================================================================
// Streaming Service
// ============================================================================

export class StreamingService {
  private _movieRepository: MovieRepository;
  private _subtitleService: SubtitleService;
  private _activeEngines: Map<string, ActiveEngine> = new Map();
  private _downloadsDir: string;
  /** Tracks in-flight subtitle fetches to prevent duplicate concurrent calls */
  private _subtitleFetchesInFlight: Set<string> = new Set();

  constructor(movieRepository: MovieRepository, subtitleService: SubtitleService) {
    this._movieRepository = movieRepository;
    this._subtitleService = subtitleService;
    this._downloadsDir = path.resolve(env.DOWNLOADS_DIR);

    // Ensure downloads directory exists
    if (!fs.existsSync(this._downloadsDir)) {
      fs.mkdirSync(this._downloadsDir, { recursive: true });
    }
  }

  /**
   * Get a streamable file for a movie. This is the main entry point.
   *
   * 1. If movie is already downloaded, return the local file path.
   * 2. If movie is currently downloading (engine active), return the torrent stream.
   * 3. If movie is not downloaded, start a new torrent engine and return the stream.
   */
  async getStreamableFile(movieId: string, language: string = 'en'): Promise<StreamableFile> {
    const movie = await this._movieRepository.findById(movieId);
    if (!movie) {
      throw new NotFoundError('Movie not found');
    }

    if (!movie.torrents || movie.torrents.length === 0) {
      throw new BadRequestError('No torrents available for this movie');
    }

    // Case 1: Already fully downloaded — serve from disk
    if (movie.downloadStatus === 'downloaded' && movie.localPath) {
      const filePath = path.resolve(movie.localPath);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);

        // Sanity check: a real movie file should be at least 10 MB.
        // If it's smaller, the file was probably marked complete prematurely.
        const MIN_MOVIE_SIZE = 10 * 1024 * 1024; // 10 MB
        if (stats.size < MIN_MOVIE_SIZE) {
          logger.warn(
            { movieId, filePath, fileSize: stats.size },
            'Downloaded file is suspiciously small — re-downloading',
          );
          movie.downloadStatus = 'not_downloaded';
          movie.localPath = undefined;
          await movie.save();
        } else {
          const ext = path.extname(filePath).toLowerCase();
          const mimeType = VIDEO_MIME_TYPES[ext] || 'application/octet-stream';
          const needsTranscoding = !BROWSER_PLAYABLE.has(ext);

          // Update lastWatched
          movie.lastWatched = new Date();
          await movie.save();

          // Ensure subtitles for user's current language (non-blocking)
          const torrent = this.selectTorrent(movie);
          this.fetchSubtitlesInBackground(movie, torrent, language);

          logger.info(
            { movieId, filePath, ext, fileSize: stats.size },
            'Serving already-downloaded movie',
          );
          return { filePath, fileSize: stats.size, mimeType, needsTranscoding, movie };
        }
      } else {
        // File is gone — reset status and re-download
        logger.warn({ movieId }, 'Local file missing, re-downloading');
        movie.downloadStatus = 'not_downloaded';
        movie.localPath = undefined;
        await movie.save();
      }
    }

    // Case 2 & 3: Use torrent engine (active or new)
    const activeEngine = await this.getOrCreateEngine(movie, language);

    if (!activeEngine.file) {
      throw new BadRequestError('No suitable video file found in torrent');
    }

    const ext = path.extname(activeEngine.file.name).toLowerCase();
    const mimeType = VIDEO_MIME_TYPES[ext] || 'video/mp4';
    const needsTranscoding = !BROWSER_PLAYABLE.has(ext);

    // Update lastWatched
    movie.lastWatched = new Date();
    await movie.save();

    return {
      fileSize: activeEngine.file.length,
      mimeType,
      needsTranscoding,
      createTorrentStream: (start?: number, end?: number) => {
        const opts: { start?: number; end?: number } = {};
        if (start !== undefined) opts.start = start;
        if (end !== undefined) opts.end = end;
        return activeEngine.file!.createReadStream(opts);
      },
      movie,
    };
  }

  /**
   * Create a transcoding stream through ffmpeg for non-browser-playable formats.
   * Converts to MP4 (H.264/AAC) on-the-fly.
   */
  createTranscodingStream(inputStream: Readable): Readable {
    const passthrough = new PassThrough();

    ffmpeg(inputStream)
      .outputFormat('mp4')
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset ultrafast', // Fastest encoding for real-time
        '-tune zerolatency', // Minimize latency
        '-movflags frag_keyframe+empty_moov+faststart', // Fragmented MP4 for streaming
        '-crf 23', // Reasonable quality
      ])
      .on('error', (err: Error) => {
        logger.error({ err }, 'FFmpeg transcoding error');
        passthrough.destroy(err);
      })
      .on('end', () => {
        logger.info('FFmpeg transcoding complete');
      })
      .pipe(passthrough, { end: true });

    return passthrough;
  }

  /**
   * Get the status of a movie's streaming readiness.
   * Optionally triggers subtitle fetch for the given language if not already available.
   */
  async getStatus(
    movieId: string,
    language?: string,
  ): Promise<{
    downloadStatus: string;
    hasActiveEngine: boolean;
    subtitles: Record<string, { language: string; label: string; url: string }[]>;
  }> {
    const movie = await this._movieRepository.findById(movieId);
    if (!movie) {
      throw new NotFoundError('Movie not found');
    }

    // If a language is requested and subs for it don't exist yet, trigger fetch
    if (language && movie.torrents && movie.torrents.length > 0) {
      const hasLang = movie.subtitles?.has(language) ?? false;
      if (!hasLang) {
        const torrent = this.selectTorrent(movie);
        this.fetchSubtitlesInBackground(movie, torrent, language);
      }
    }

    const subtitles: Record<string, { language: string; label: string; url: string }[]> = {};
    if (movie.subtitles) {
      for (const [lang, subs] of movie.subtitles.entries()) {
        subtitles[lang] = subs.map((s) => ({
          language: s.language,
          label: s.label,
          url: s.url || '',
        }));
      }
    }

    return {
      downloadStatus: movie.downloadStatus,
      hasActiveEngine: this._activeEngines.has(movieId),
      subtitles,
    };
  }

  /**
   * Destroy all active torrent engines. Called on server shutdown.
   */
  destroyAll(): void {
    for (const [movieId, active] of this._activeEngines) {
      logger.info({ movieId }, 'Destroying torrent engine on shutdown');
      active.engine.destroy();
    }
    this._activeEngines.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Select the best torrent from the movie's torrent list.
   * Priority: 720p → 480p → 1080p → anything with most seeds.
   */
  private selectTorrent(movie: IMovieDocument): ITorrent {
    const torrents = movie.torrents;
    const qualityPriority = ['720p', '480p', '1080p'];

    for (const quality of qualityPriority) {
      const match = torrents.find((t) => t.quality === quality);
      if (match) return match;
    }

    // Fallback: torrent with most seeds
    const sorted = [...torrents].sort((a, b) => b.seeds - a.seeds);
    return sorted[0];
  }

  /**
   * Get an existing active engine or create a new one for the movie.
   */
  private async getOrCreateEngine(
    movie: IMovieDocument,
    language: string = 'en',
  ): Promise<ActiveEngine> {
    const movieId = movie._id.toString();

    // Reuse existing engine if available
    const existing = this._activeEngines.get(movieId);
    if (existing) {
      await existing.readyPromise;
      return existing;
    }

    // Select best torrent and build magnet link
    const torrent = this.selectTorrent(movie);
    const magnetLinks = movie.getMagnetLinks();
    const magnetResult = magnetLinks.find(
      (m) => m.quality === torrent.quality && m.seeds === torrent.seeds,
    );

    if (!magnetResult) {
      throw new BadRequestError('Unable to construct magnet link for selected torrent');
    }

    const magnetUri = magnetResult.magnet;

    logger.info(
      { movieId, quality: torrent.quality, seeds: torrent.seeds },
      'Starting torrent engine',
    );

    // Update status to downloading
    movie.downloadStatus = 'downloading';
    await movie.save();

    // Start torrent-stream engine
    const movieDir = path.join(this._downloadsDir, movieId);
    const engine = torrentStream(magnetUri, {
      path: movieDir,
      connections: 100,
      uploads: 10,
      verify: true,
      dht: true,
      tracker: true,
    });

    // Create the active engine entry with a ready promise
    let resolveReady: () => void;
    const readyPromise = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });

    const activeEngine: ActiveEngine = {
      engine,
      movieId,
      file: null,
      ready: false,
      readyPromise,
    };

    this._activeEngines.set(movieId, activeEngine);

    // Handle engine ready event
    engine.on('ready', () => {
      // Select the largest file (the actual video)
      const files = engine.files;
      if (files.length === 0) {
        logger.error({ movieId }, 'Torrent has no files');
        resolveReady!();
        return;
      }

      const videoFile = files.reduce((largest, current) =>
        current.length > largest.length ? current : largest,
      );

      // Deselect all files except the video
      for (const f of files) {
        if (f !== videoFile) {
          f.deselect();
        } else {
          f.select();
        }
      }

      activeEngine.file = videoFile;
      activeEngine.ready = true;

      logger.info(
        {
          movieId,
          fileName: videoFile.name,
          fileSize: videoFile.length,
          fileCount: files.length,
        },
        'Torrent ready — video file selected',
      );

      resolveReady!();

      // Trigger subtitle download in background (non-blocking)
      this.fetchSubtitlesInBackground(movie, torrent, language);
    });

    // Handle download completion — mark as downloaded
    // IMPORTANT: 'idle' fires whenever there are no pending piece requests,
    // which also happens when we deselect files (pause). We must verify the
    // file is actually complete by comparing its size on disk to the expected
    // torrent file length before marking the movie as downloaded.
    engine.on('idle', () => {
      if (!activeEngine.file) return;

      const localPath = path.join(movieDir, activeEngine.file.path);
      const expectedSize = activeEngine.file.length;

      // Check actual file size on disk
      let actualSize = 0;
      try {
        if (fs.existsSync(localPath)) {
          actualSize = fs.statSync(localPath).size;
        }
      } catch {
        // File may not exist yet
        return;
      }

      // Only mark as downloaded if file is fully written (within 1% tolerance
      // to account for filesystem block alignment)
      const completionRatio = actualSize / expectedSize;
      if (completionRatio < 0.99) {
        logger.debug(
          { movieId, actualSize, expectedSize, completionRatio: completionRatio.toFixed(3) },
          'Idle event fired but file is incomplete — ignoring',
        );
        return;
      }

      this._movieRepository
        .findById(movieId)
        .then((freshMovie) => {
          if (freshMovie) {
            freshMovie.downloadStatus = 'downloaded';
            freshMovie.localPath = localPath;
            return freshMovie.save();
          }
        })
        .then(() => {
          logger.info(
            { movieId, localPath, actualSize, expectedSize },
            'Torrent download complete',
          );
        })
        .catch((err: unknown) => {
          const error = err instanceof Error ? err : new Error(String(err));
          logger.error({ err: error, movieId }, 'Failed to update movie after download');
        });
    });

    // Wait for the engine to be ready before returning
    await readyPromise;
    return activeEngine;
  }

  /**
   * Fetch subtitles in the background. Non-blocking.
   */
  private fetchSubtitlesInBackground(
    movie: IMovieDocument,
    torrent: ITorrent,
    language: string = 'en',
  ): void {
    const key = `${movie.imdbId}:${language}`;
    if (this._subtitleFetchesInFlight.has(key)) {
      logger.debug(
        { imdbId: movie.imdbId, language },
        'Subtitle fetch already in progress, skipping duplicate',
      );
      return;
    }
    this._subtitleFetchesInFlight.add(key);

    this._subtitleService
      .ensureForMovie(movie.imdbId, language, torrent)
      .then(() => {
        logger.info({ imdbId: movie.imdbId, language }, 'Subtitles fetched for user language');
      })
      .catch((err: unknown) => {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.warn({ err: error, imdbId: movie.imdbId }, 'Subtitle fetch failed (non-critical)');
      })
      .finally(() => {
        this._subtitleFetchesInFlight.delete(key);
      });
  }
}
