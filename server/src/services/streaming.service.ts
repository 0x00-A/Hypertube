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
  filePath?: string;
  fileSize: number;
  mimeType: string;
  needsTranscoding: boolean;
  createTorrentStream?: (start?: number, end?: number) => Readable;
  movie: IMovieDocument;
}

const VIDEO_MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.m4v': 'video/mp4',
};

// formats browsers can play natively without transcoding
const BROWSER_PLAYABLE = new Set(['.mp4', '.webm', '.m4v']);

export class StreamingService {
  private _movieRepository: MovieRepository;
  private _subtitleService: SubtitleService;
  private _activeEngines: Map<string, ActiveEngine> = new Map();
  private _downloadsDir: string;
  // prevents duplicate concurrent subtitle fetches for the same movie+language
  private _subtitleFetchesInFlight: Set<string> = new Set();

  constructor(movieRepository: MovieRepository, subtitleService: SubtitleService) {
    this._movieRepository = movieRepository;
    this._subtitleService = subtitleService;
    this._downloadsDir = path.resolve(env.DOWNLOADS_DIR);

    if (!fs.existsSync(this._downloadsDir)) {
      fs.mkdirSync(this._downloadsDir, { recursive: true });
    }
  }

  // Resolves the best stream source for a movie:
  //   1. local file if already downloaded
  //   2. torrent engine stream otherwise (starts one if needed)
  async getStreamableFile(movieId: string, language: string = 'en'): Promise<StreamableFile> {
    const movie = await this._movieRepository.findById(movieId);
    if (!movie) {
      throw new NotFoundError('Movie not found');
    }

    if (!movie.torrents || movie.torrents.length === 0) {
      throw new BadRequestError('No torrents available for this movie');
    }

    if (movie.downloadStatus === 'downloaded' && movie.localPath) {
      const filePath = path.resolve(movie.localPath);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);

        // anything under 10 MB was probably marked complete prematurely
        const MIN_MOVIE_SIZE = 10 * 1024 * 1024;
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

          movie.lastWatched = new Date();
          await movie.save();

          const torrent = this.selectTorrent(movie);
          this.fetchSubtitlesInBackground(movie, torrent, language);

          logger.info(
            { movieId, filePath, ext, fileSize: stats.size },
            'Serving already-downloaded movie',
          );
          return { filePath, fileSize: stats.size, mimeType, needsTranscoding, movie };
        }
      } else {
        logger.warn({ movieId }, 'Local file missing, re-downloading');
        movie.downloadStatus = 'not_downloaded';
        movie.localPath = undefined;
        await movie.save();
      }
    }

    const activeEngine = await this.getOrCreateEngine(movie, language);

    if (!activeEngine.file) {
      throw new BadRequestError('No suitable video file found in torrent');
    }

    const ext = path.extname(activeEngine.file.name).toLowerCase();
    const mimeType = VIDEO_MIME_TYPES[ext] || 'video/mp4';
    const needsTranscoding = !BROWSER_PLAYABLE.has(ext);

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

  // Pipes the input through ffmpeg and returns a fragmented MP4 stream.
  createTranscodingStream(inputStream: Readable): Readable {
    const passthrough = new PassThrough();

    ffmpeg(inputStream)
      .outputFormat('mp4')
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset ultrafast',
        '-tune zerolatency',
        '-movflags frag_keyframe+empty_moov+faststart',
        '-crf 23',
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

  async getStatus(
    movieId: string,
    language?: string,
  ): Promise<{
    downloadStatus: string;
    hasActiveEngine: boolean;
    needsTranscoding: boolean;
    runtimeSeconds: number | null;
    subtitles: Record<string, { language: string; label: string; url: string }[]>;
  }> {
    const movie = await this._movieRepository.findById(movieId);
    if (!movie) {
      throw new NotFoundError('Movie not found');
    }

    if (language && movie.torrents && movie.torrents.length > 0) {
      let needsFetch = false;

      const hasEnglish = movie.subtitles?.has('en') && movie.subtitles.get('en')!.length > 0;
      if (!hasEnglish) {
        needsFetch = true;
      }

      if (!needsFetch && language !== 'en' && language !== movie.originalLanguage) {
        const hasUserLang = movie.subtitles?.has(language) && movie.subtitles.get(language)!.length > 0;
        if (!hasUserLang) {
          needsFetch = true;
        }
      }

      if (needsFetch) {
        const torrent = this.selectTorrent(movie);
        this.fetchSubtitlesInBackground(movie, torrent, language);
      }
    }

    const subtitles: Record<string, { language: string; label: string; url: string }[]> = {};
    if (movie.subtitles) {
      for (const [lang, subs] of movie.subtitles.entries()) {
        const validSubs = subs.filter((s) => {
          if (s.localPath && !fs.existsSync(s.localPath)) {
            logger.warn(
              { lang, localPath: s.localPath },
              'Subtitle file missing from disk — omitting from status response',
            );
            return false;
          }
          return true;
        });
        if (validSubs.length > 0) {
          subtitles[lang] = validSubs.map((s) => ({
            language: s.language,
            label: s.label,
            url: s.url || '',
          }));
        }
      }
    }

    // prefer the actual file extension once downloaded; fall back to the torrent type field
    let needsTranscoding = false;
    if (movie.downloadStatus === 'downloaded' && movie.localPath) {
      const ext = path.extname(movie.localPath).toLowerCase();
      needsTranscoding = !BROWSER_PLAYABLE.has(ext);
    } else if (movie.torrents && movie.torrents.length > 0) {
      const torrent = this.selectTorrent(movie);
      const torrentExt = torrent.type ? `.${torrent.type.toLowerCase()}` : '';
      needsTranscoding = torrentExt !== '' && !BROWSER_PLAYABLE.has(torrentExt);
    }

    // duration is stored in minutes; the client needs seconds
    const runtimeSeconds =
      movie.duration != null && movie.duration > 0 ? movie.duration * 60 : null;

    return {
      downloadStatus: movie.downloadStatus,
      hasActiveEngine: this._activeEngines.has(movieId),
      needsTranscoding,
      runtimeSeconds,
      subtitles,
    };
  }

  destroyAll(): void {
    for (const [movieId, active] of this._activeEngines) {
      logger.info({ movieId }, 'Destroying torrent engine on shutdown');
      active.engine.destroy();
    }
    this._activeEngines.clear();
  }

  // Picks the best torrent quality: 480p first, then 720p, 1080p, then most seeds.
  private selectTorrent(movie: IMovieDocument): ITorrent {
    const torrents = movie.torrents;
    const qualityPriority = ['480p', '720p', '1080p'];

    for (const quality of qualityPriority) {
      const match = torrents.find((t) => t.quality === quality);
      if (match) return match;
    }

    const sorted = [...torrents].sort((a, b) => b.seeds - a.seeds);
    return sorted[0];
  }

  private async getOrCreateEngine(
    movie: IMovieDocument,
    language: string = 'en',
  ): Promise<ActiveEngine> {
    const movieId = movie._id.toString();

    const activeEngineIds = Array.from(this._activeEngines.keys());
    logger.info(
      { movieId, activeEngines: activeEngineIds, totalActive: activeEngineIds.length },
      'Checking for existing torrent engines',
    );

    const existing = this._activeEngines.get(movieId);
    if (existing) {
      await existing.readyPromise;

      // torrent-stream considers everything downloaded once pieces are verified,
      // so if the file was deleted from disk we have to destroy and restart
      if (existing.file) {
        const movieDir = path.join(this._downloadsDir, movieId);
        const filePath = path.join(movieDir, existing.file.path);
        if (!fs.existsSync(filePath)) {
          logger.warn(
            { movieId, filePath },
            'Cached engine file missing from disk — destroying stale engine and re-creating',
          );
          existing.engine.destroy();
          this._activeEngines.delete(movieId);

          movie.downloadStatus = 'not_downloaded';
          movie.localPath = undefined;
          await movie.save();
        } else {
          logger.info(
            { movieId, ready: existing.ready, fileName: existing.file.name },
            'Reusing existing torrent engine',
          );
          const torrent = this.selectTorrent(movie);
          this.fetchSubtitlesInBackground(movie, torrent, language);
          return existing;
        }
      } else {
        logger.info({ movieId }, 'Reusing existing torrent engine (no file yet)');
        const torrent = this.selectTorrent(movie);
        this.fetchSubtitlesInBackground(movie, torrent, language);
        return existing;
      }
    }

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

    movie.downloadStatus = 'downloading';
    await movie.save();

    // Start torrent-stream engine
    const movieDir = path.join(this._downloadsDir, movieId);
    const engine = torrentStream(magnetUri, {
      path: movieDir,
      connections: 100,
      uploads: 5,
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

    logger.info(
      { movieId, totalActiveEngines: this._activeEngines.size },
      'Created new torrent engine and added to active engines map',
    );

    // Handle engine ready event
    engine.on('ready', () => {
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
      this.fetchSubtitlesInBackground(movie, torrent, language);
    });

    // 'idle' fires when piece requests dry up, which can also happen when files
    // are deselected — verify file size before marking as downloaded
    engine.on('idle', () => {
      if (!activeEngine.file) return;

      const localPath = path.join(movieDir, activeEngine.file.path);
      const expectedSize = activeEngine.file.length;

      let actualSize = 0;
      try {
        if (fs.existsSync(localPath)) {
          actualSize = fs.statSync(localPath).size;
        }
      } catch {
        return;
      }

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

  private fetchSubtitlesInBackground(
    movie: IMovieDocument,
    torrent: ITorrent,
    language: string = 'en',
  ): void {
    const key = `${movie.imdbId}:multi:${language}`;
    if (this._subtitleFetchesInFlight.has(key)) {
      logger.debug(
        { imdbId: movie.imdbId, language },
        'Multi-language subtitle fetch already in progress, skipping duplicate',
      );
      return;
    }
    this._subtitleFetchesInFlight.add(key);

    this._subtitleService
      .ensureMultiLanguageForMovie(movie.imdbId, language, torrent, movie.originalLanguage)
      .then(() => {
        logger.info(
          {
            imdbId: movie.imdbId,
            userLanguage: language,
            movieOriginalLang: movie.originalLanguage,
          },
          'Multi-language subtitles fetched',
        );
      })
      .catch((err: unknown) => {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.warn(
          { err: error, imdbId: movie.imdbId, userLanguage: language },
          'Multi-language subtitle fetch failed (non-critical)',
        );
      })
      .finally(() => {
        this._subtitleFetchesInFlight.delete(key);
      });
  }
}
