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
import { ITorrent, IQualityOption } from '../interfaces/movie.interface';

interface ActiveEngine {
  engine: ReturnType<typeof torrentStream>;
  movieId: string;
  quality: string;
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

  // Resolves the best stream source for a movie at the requested quality:
  //   1. local file if already downloaded for this quality
  //   2. torrent engine stream otherwise (starts one if needed)
  async getStreamableFile(
    movieId: string,
    language: string = 'en',
    quality?: string,
  ): Promise<StreamableFile> {
    const movie = await this._movieRepository.findById(movieId);
    if (!movie) {
      throw new NotFoundError('Movie not found');
    }

    if (!movie.torrents || movie.torrents.length === 0) {
      throw new BadRequestError('No torrents available for this movie');
    }

    const torrent = this.findTorrent(movie, quality);
    const resolvedQuality = torrent.quality;

    // Check per-quality download status first
    const downloadInfo = movie.downloads?.get(resolvedQuality);

    if (downloadInfo?.status === 'downloaded' && downloadInfo.localPath) {
      const filePath = path.resolve(downloadInfo.localPath);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);

        // anything under 10 MB was probably marked complete prematurely
        const MIN_MOVIE_SIZE = 10 * 1024 * 1024;
        if (stats.size < MIN_MOVIE_SIZE) {
          logger.warn(
            { movieId, quality: resolvedQuality, filePath, fileSize: stats.size },
            'Downloaded file is suspiciously small — re-downloading',
          );
          movie.downloads!.set(resolvedQuality, { status: 'not_downloaded' });
          await movie.save();
        } else {
          const ext = path.extname(filePath).toLowerCase();
          const mimeType = VIDEO_MIME_TYPES[ext] || 'application/octet-stream';
          const needsTranscoding = !BROWSER_PLAYABLE.has(ext);

          movie.lastWatched = new Date();
          await movie.save();

          this.fetchSubtitlesInBackground(movie, torrent, language);

          logger.info(
            { movieId, quality: resolvedQuality, filePath, ext, fileSize: stats.size },
            'Serving already-downloaded movie',
          );
          return { filePath, fileSize: stats.size, mimeType, needsTranscoding, movie };
        }
      } else {
        logger.warn({ movieId, quality: resolvedQuality }, 'Local file missing, re-downloading');
        movie.downloads!.set(resolvedQuality, { status: 'not_downloaded' });
        await movie.save();
      }
    }

    // Fallback: check legacy downloadStatus/localPath fields (backward compat)
    if (
      !downloadInfo &&
      movie.downloadStatus === 'downloaded' &&
      movie.localPath
    ) {
      const filePath = path.resolve(movie.localPath);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const MIN_MOVIE_SIZE = 10 * 1024 * 1024;
        if (stats.size >= MIN_MOVIE_SIZE) {
          const ext = path.extname(filePath).toLowerCase();
          const mimeType = VIDEO_MIME_TYPES[ext] || 'application/octet-stream';
          const needsTranscoding = !BROWSER_PLAYABLE.has(ext);

          movie.lastWatched = new Date();
          // Migrate to new per-quality tracking
          if (!movie.downloads) {
            movie.downloads = new Map();
          }
          movie.downloads.set(resolvedQuality, {
            status: 'downloaded',
            localPath: movie.localPath,
          });
          await movie.save();

          this.fetchSubtitlesInBackground(movie, torrent, language);

          logger.info(
            { movieId, quality: resolvedQuality, filePath, ext, fileSize: stats.size },
            'Serving movie from legacy path (migrated to per-quality tracking)',
          );
          return { filePath, fileSize: stats.size, mimeType, needsTranscoding, movie };
        }
      }
    }

    const activeEngine = await this.getOrCreateEngine(movie, torrent, language);

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
        '-movflags frag_keyframe+empty_moov+default_base_moof',
        '-frag_duration 50000',
        '-crf 28',
        '-max_muxing_queue_size 1024'
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
    quality?: string,
  ): Promise<{
    downloadStatus: string;
    hasActiveEngine: boolean;
    needsTranscoding: boolean;
    runtimeSeconds: number | null;
    subtitles: Record<string, { language: string; label: string; url: string }[]>;
    availableQualities: IQualityOption[];
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
        const torrent = this.findTorrent(movie, quality);
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
            forQuality: s.forQuality || '',
          }));
        }
      }
    }

    // Resolve the torrent for the requested quality (or best default)
    const resolvedTorrent = this.findTorrent(movie, quality);
    const resolvedQuality = resolvedTorrent.quality;
    const engineKey = `${movieId}:${resolvedQuality}`;

    // Determine download status for the requested quality
    let downloadStatus = 'not_downloaded';
    const downloadInfo = movie.downloads?.get(resolvedQuality);
    if (downloadInfo) {
      downloadStatus = downloadInfo.status;
    } else if (movie.downloadStatus) {
      // Legacy fallback
      downloadStatus = movie.downloadStatus;
    }

    // Determine whether the browser can play the file natively.
    let needsTranscoding = false;
    if (downloadInfo?.status === 'downloaded' && downloadInfo.localPath) {
      const ext = path.extname(downloadInfo.localPath).toLowerCase();
      needsTranscoding = !BROWSER_PLAYABLE.has(ext);
    } else if (movie.downloadStatus === 'downloaded' && movie.localPath) {
      const ext = path.extname(movie.localPath).toLowerCase();
      needsTranscoding = !BROWSER_PLAYABLE.has(ext);
    } else {
      const activeEngine = this._activeEngines.get(engineKey);
      if (activeEngine?.file) {
        const ext = path.extname(activeEngine.file.name).toLowerCase();
        needsTranscoding = !BROWSER_PLAYABLE.has(ext);
      } else if (resolvedTorrent.type) {
        // No engine yet — use the torrent's declared container type as a hint
        const ext = `.${resolvedTorrent.type.toLowerCase()}`;
        needsTranscoding = !BROWSER_PLAYABLE.has(ext);
      }
    }

    // duration is stored in minutes; the client needs seconds
    const runtimeSeconds =
      movie.duration != null && movie.duration > 0 ? movie.duration * 60 : null;

    // Build available qualities from all torrents
    const availableQualities = this.getAvailableQualities(movie);

    return {
      downloadStatus,
      hasActiveEngine: this._activeEngines.has(engineKey),
      needsTranscoding,
      runtimeSeconds,
      subtitles,
      availableQualities,
    };
  }

  // Returns quality options for all torrents, enriched with download status
  getAvailableQualities(movie: IMovieDocument): IQualityOption[] {
    if (!movie.torrents || movie.torrents.length === 0) return [];

    const deduped = this.deduplicateTorrents(movie.torrents);

    return deduped.map((torrent) => {
      const downloadInfo = movie.downloads?.get(torrent.quality);
      let downloadStatus = 'not_downloaded';
      if (downloadInfo) {
        downloadStatus = downloadInfo.status;
      } else if (movie.downloadStatus === 'downloaded' && movie.localPath) {
        // Legacy: if old fields are set, show as downloaded for the first matching quality
        downloadStatus = movie.downloadStatus;
      }

      return {
        quality: torrent.quality,
        seeds: torrent.seeds,
        peers: torrent.peers,
        size: torrent.size,
        sizeBytes: torrent.sizeBytes,
        downloadStatus,
      };
    });
  }

  destroyAll(): void {
    for (const [key, active] of this._activeEngines) {
      logger.info({ key }, 'Destroying torrent engine on shutdown');
      active.engine.destroy();
    }
    this._activeEngines.clear();
  }

  // Deduplicates torrents that share the same quality string (e.g. two 1080p entries
  // with different codecs). Prefers x265/HEVC (smaller file, same visual quality),
  // otherwise picks the smallest torrent.
  private deduplicateTorrents(torrents: ITorrent[]): ITorrent[] {
    const byQuality = new Map<string, ITorrent[]>();
    for (const t of torrents) {
      const key = t.quality.toLowerCase();
      if (!byQuality.has(key)) byQuality.set(key, []);
      byQuality.get(key)!.push(t);
    }

    const result: ITorrent[] = [];
    for (const group of byQuality.values()) {
      if (group.length === 1) {
        result.push(group[0]);
        continue;
      }
      // Prefer x265 / HEVC
      const x265 = group.find(
        (t) => t.videoCodec && /x265|hevc/i.test(t.videoCodec),
      );
      if (x265) {
        result.push(x265);
        continue;
      }
      // No x265 — pick the smallest
      const smallest = group.reduce((a, b) => (a.sizeBytes <= b.sizeBytes ? a : b));
      result.push(smallest);
    }
    return result;
  }

  // Finds a torrent by the requested quality, or falls back to best available.
  // When multiple torrents share the same quality, prefers x265.
  private findTorrent(movie: IMovieDocument, quality?: string): ITorrent {
    const deduped = this.deduplicateTorrents(movie.torrents);
    if (quality) {
      const match = deduped.find(
        (t) => t.quality.toLowerCase() === quality.toLowerCase(),
      );
      if (match) return match;
      logger.warn(
        { movieId: movie._id, requestedQuality: quality },
        'Requested quality not found — falling back to best available',
      );
    }
    return this.selectTorrent(movie);
  }

  // Picks the best torrent quality: 1080p first, then 720p, 480p, then most seeds.
  // Operates on deduplicated torrents so codec preference is already applied.
  private selectTorrent(movie: IMovieDocument): ITorrent {
    const torrents = this.deduplicateTorrents(movie.torrents);
    const qualityPriority = ['1080p', '720p', '480p'];

    for (const quality of qualityPriority) {
      const match = torrents.find((t) => t.quality === quality);
      if (match) return match;
    }

    const sorted = [...torrents].sort((a, b) => b.seeds - a.seeds);
    return sorted[0];
  }

  private async getOrCreateEngine(
    movie: IMovieDocument,
    torrent: ITorrent,
    language: string = 'en',
  ): Promise<ActiveEngine> {
    const movieId = movie._id.toString();
    const quality = torrent.quality;
    const engineKey = `${movieId}:${quality}`;

    const activeEngineKeys = Array.from(this._activeEngines.keys());
    logger.info(
      { movieId, quality, engineKey, activeEngines: activeEngineKeys, totalActive: activeEngineKeys.length },
      'Checking for existing torrent engines',
    );

    const existing = this._activeEngines.get(engineKey);
    if (existing) {
      await existing.readyPromise;

      // torrent-stream considers everything downloaded once pieces are verified,
      // so if the file was deleted from disk we have to destroy and restart
      if (existing.file) {
        const movieDir = path.join(this._downloadsDir, movieId, quality);
        const filePath = path.join(movieDir, existing.file.path);
        if (!fs.existsSync(filePath)) {
          logger.warn(
            { movieId, quality, filePath },
            'Cached engine file missing from disk — destroying stale engine and re-creating',
          );
          existing.engine.destroy();
          this._activeEngines.delete(engineKey);

          if (!movie.downloads) movie.downloads = new Map();
          movie.downloads.set(quality, { status: 'not_downloaded' });
          await movie.save();
        } else {
          logger.info(
            { movieId, quality, ready: existing.ready, fileName: existing.file.name },
            'Reusing existing torrent engine',
          );
          this.fetchSubtitlesInBackground(movie, torrent, language);
          return existing;
        }
      } else {
        logger.info({ movieId, quality }, 'Reusing existing torrent engine (no file yet)');
        this.fetchSubtitlesInBackground(movie, torrent, language);
        return existing;
      }
    }

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

    // Update per-quality download status
    if (!movie.downloads) movie.downloads = new Map();
    movie.downloads.set(quality, { status: 'downloading' });
    movie.downloadStatus = 'downloading';
    await movie.save();

    // Start torrent-stream engine — store under quality subdir
    const movieDir = path.join(this._downloadsDir, movieId, quality);
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
      quality,
      file: null,
      ready: false,
      readyPromise,
    };

    this._activeEngines.set(engineKey, activeEngine);

    logger.info(
      { movieId, quality, engineKey, totalActiveEngines: this._activeEngines.size },
      'Created new torrent engine and added to active engines map',
    );

    // Handle engine ready event
    engine.on('ready', () => {
      const files = engine.files;
      if (files.length === 0) {
        logger.error({ movieId, quality }, 'Torrent has no files');
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
          quality,
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
          { movieId, quality, actualSize, expectedSize, completionRatio: completionRatio.toFixed(3) },
          'Idle event fired but file is incomplete — ignoring',
        );
        return;
      }

      this._movieRepository
        .findById(movieId)
        .then((freshMovie) => {
          if (freshMovie) {
            // Update per-quality download info
            if (!freshMovie.downloads) freshMovie.downloads = new Map();
            freshMovie.downloads.set(quality, {
              status: 'downloaded',
              localPath,
            });
            // Also update legacy fields for backward compat
            freshMovie.downloadStatus = 'downloaded';
            freshMovie.localPath = localPath;
            return freshMovie.save();
          }
        })
        .then(() => {
          logger.info(
            { movieId, quality, localPath, actualSize, expectedSize },
            'Torrent download complete',
          );
        })
        .catch((err: unknown) => {
          const error = err instanceof Error ? err : new Error(String(err));
          logger.error({ err: error, movieId, quality }, 'Failed to update movie after download');
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
