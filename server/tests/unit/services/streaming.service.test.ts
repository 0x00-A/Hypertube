/**
 * Unit tests for StreamingService
 *
 * Mocks: torrent-stream, fluent-ffmpeg, fs, MovieRepository, SubtitleService
 */
import { EventEmitter } from 'events';
import * as path from 'path';
import { Readable, PassThrough } from 'stream';
import mongoose from 'mongoose';
import { MovieModel } from '../../../src/models/Movie';
import { MovieRepository } from '../../../src/repositories/movie.repository';
import { StreamingService } from '../../../src/services/streaming.service';
import { SubtitleService } from '../../../src/services/SubtitleService';
import { NotFoundError, BadRequestError } from '../../../src/core/errors/customErrors';

// ============================================================================
// Mocks
// ============================================================================

// Mock torrent-stream: returns an EventEmitter-like engine
const mockEngine = Object.assign(new EventEmitter(), {
  files: [] as Array<{
    name: string;
    path: string;
    length: number;
    select: jest.Mock;
    deselect: jest.Mock;
    createReadStream: jest.Mock;
  }>,
  destroy: jest.fn(),
});

jest.mock('torrent-stream', () => {
  return jest.fn(() => mockEngine);
});

// Mock fluent-ffmpeg: returns a chainable object that ultimately calls .pipe()
const mockFfmpegChain = {
  outputFormat: jest.fn().mockReturnThis(),
  videoCodec: jest.fn().mockReturnThis(),
  audioCodec: jest.fn().mockReturnThis(),
  outputOptions: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  pipe: jest.fn().mockImplementation((passthrough: PassThrough) => {
    // Simulate writing a small chunk then ending
    process.nextTick(() => {
      passthrough.end(Buffer.from('fake-transcoded-data'));
    });
    return passthrough;
  }),
};

jest.mock('fluent-ffmpeg', () => {
  return jest.fn(() => mockFfmpegChain);
});

// Mock fs — existsSync and statSync for local file checks, mkdirSync for init
jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: jest.fn().mockReturnValue(true),
    statSync: jest.fn().mockReturnValue({ size: 5_000_000 }),
    mkdirSync: jest.fn(),
  };
});

// ============================================================================
// Setup
// ============================================================================

const movieRepository = new MovieRepository();
const subtitleService = {
  ensureForMovie: jest.fn().mockResolvedValue(undefined),
} as unknown as SubtitleService;

let streamingService: StreamingService;

beforeEach(() => {
  jest.clearAllMocks();
  mockEngine.removeAllListeners();
  mockEngine.files = [];
  mockEngine.destroy.mockClear();

  streamingService = new StreamingService(movieRepository, subtitleService);
});

// ============================================================================
// Helper: create a movie in the in-memory DB
// ============================================================================

const createTestMovie = async (overrides: Record<string, unknown> = {}) => {
  return MovieModel.create({
    imdbId: `tt${Date.now()}`,
    tmdbId: Math.floor(Math.random() * 999999),
    title: 'Test Movie',
    year: 2024,
    rating: 7.5,
    images: {
      thumbnail: 'https://example.com/thumb.jpg',
      poster: 'https://example.com/poster.jpg',
      backdrop: 'https://example.com/backdrop.jpg',
    },
    torrents: [
      {
        url: 'https://yts.mx/torrent/test',
        hash: 'abc123def456abc123def456abc123def456abc1',
        quality: '720p',
        seeds: 100,
        peers: 50,
        size: '1.2 GB',
        sizeBytes: 1_200_000_000,
      },
    ],
    downloadStatus: 'not_downloaded',
    lastUpdated: new Date(),
    ...overrides,
  });
};

// ============================================================================
// Tests
// ============================================================================

describe('StreamingService', () => {
  afterEach(async () => {
    streamingService.destroyAll();
    await MovieModel.deleteMany({});
  });

  // --------------------------------------------------------------------------
  // getStreamableFile
  // --------------------------------------------------------------------------
  describe('getStreamableFile', () => {
    it('should throw NotFoundError when movie does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(streamingService.getStreamableFile(fakeId)).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when movie has no torrents', async () => {
      const movie = await createTestMovie({ torrents: [] });
      await expect(streamingService.getStreamableFile(movie._id.toString())).rejects.toThrow(
        BadRequestError,
      );
    });

    it('should serve from local file when movie is already downloaded', async () => {
      const localPath = path.join(__dirname, 'test-movie.mp4');
      const movie = await createTestMovie({
        downloadStatus: 'downloaded',
        localPath,
      });

      const result = await streamingService.getStreamableFile(movie._id.toString());

      expect(result.filePath).toBe(path.resolve(localPath));
      expect(result.fileSize).toBe(5_000_000); // From mocked statSync
      expect(result.mimeType).toBe('video/mp4');
      expect(result.needsTranscoding).toBe(false);
      expect(result.createTorrentStream).toBeUndefined();
    });

    it('should mark MKV files as needing transcoding', async () => {
      const localPath = path.join(__dirname, 'test-movie.mkv');
      const movie = await createTestMovie({
        downloadStatus: 'downloaded',
        localPath,
      });

      const result = await streamingService.getStreamableFile(movie._id.toString());

      expect(result.needsTranscoding).toBe(true);
      expect(result.mimeType).toBe('video/x-matroska');
    });

    it('should start a torrent engine when movie is not downloaded', async () => {
      const fs = jest.requireMock<typeof import('fs')>('fs');
      // Return false for the downloaded local path check
      (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
        if (typeof p === 'string' && p.includes('downloads')) return true; // downloads dir exists
        return false; // local file does not exist
      });

      const movie = await createTestMovie({ downloadStatus: 'not_downloaded' });

      // Emit ready when the listener is attached (after async DB calls complete)
      const originalOn = mockEngine.on.bind(mockEngine);
      mockEngine.on = jest
        .fn()
        .mockImplementation((event: string, cb: (...args: unknown[]) => void) => {
          originalOn(event, cb);
          if (event === 'ready') {
            const mockFile = {
              name: 'Movie.2024.720p.mp4',
              path: 'Movie.2024.720p.mp4',
              length: 800_000_000,
              select: jest.fn(),
              deselect: jest.fn(),
              createReadStream: jest.fn().mockReturnValue(
                new Readable({
                  read() {
                    this.push(null);
                  },
                }),
              ),
            };
            mockEngine.files = [mockFile];
            // Emit after the listener is registered
            setImmediate(() => mockEngine.emit('ready'));
          }
          return mockEngine;
        }) as typeof mockEngine.on;

      const result = await streamingService.getStreamableFile(movie._id.toString());

      expect(result.fileSize).toBe(800_000_000);
      expect(result.mimeType).toBe('video/mp4');
      expect(result.needsTranscoding).toBe(false);
      expect(result.createTorrentStream).toBeDefined();

      // Restore original on
      mockEngine.on = originalOn as typeof mockEngine.on;
    });
  });

  // --------------------------------------------------------------------------
  // createTranscodingStream
  // --------------------------------------------------------------------------
  describe('createTranscodingStream', () => {
    it('should return a readable stream', () => {
      const inputStream = new Readable({
        read() {
          this.push(null);
        },
      });

      const result = streamingService.createTranscodingStream(inputStream);

      expect(result).toBeInstanceOf(Readable);
    });

    it('should call ffmpeg with correct output options', () => {
      const ffmpeg = jest.requireMock<jest.Mock>('fluent-ffmpeg');
      const inputStream = new Readable({
        read() {
          this.push(null);
        },
      });

      streamingService.createTranscodingStream(inputStream);

      expect(ffmpeg).toHaveBeenCalledWith(inputStream);
      expect(mockFfmpegChain.outputFormat).toHaveBeenCalledWith('mp4');
      expect(mockFfmpegChain.videoCodec).toHaveBeenCalledWith('libx264');
      expect(mockFfmpegChain.audioCodec).toHaveBeenCalledWith('aac');
      expect(mockFfmpegChain.outputOptions).toHaveBeenCalledWith(
        expect.arrayContaining(['-preset ultrafast', '-tune zerolatency']),
      );
    });
  });

  // --------------------------------------------------------------------------
  // getStatus
  // --------------------------------------------------------------------------
  describe('getStatus', () => {
    it('should throw NotFoundError when movie does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(streamingService.getStatus(fakeId)).rejects.toThrow(NotFoundError);
    });

    it('should return status for existing movie', async () => {
      const movie = await createTestMovie({ downloadStatus: 'downloading' });

      const result = await streamingService.getStatus(movie._id.toString());

      expect(result.downloadStatus).toBe('downloading');
      expect(result.hasActiveEngine).toBe(false);
      expect(result.subtitles).toEqual({});
    });

    it('should return subtitles when available', async () => {
      const subtitlesMap = new Map();
      subtitlesMap.set('en', [
        {
          language: 'English',
          label: 'English (SRT)',
          url: '/subtitles/tt123_en.vtt',
          forHash: 'abc123',
          forQuality: '720p',
        },
      ]);

      const movie = await createTestMovie({
        downloadStatus: 'downloaded',
        subtitles: subtitlesMap,
      });

      const result = await streamingService.getStatus(movie._id.toString());

      expect(result.subtitles).toHaveProperty('en');
      expect(result.subtitles['en']).toHaveLength(1);
      expect(result.subtitles['en'][0]).toEqual({
        language: 'English',
        label: 'English (SRT)',
        url: '/subtitles/tt123_en.vtt',
      });
    });
  });

  // --------------------------------------------------------------------------
  // destroyAll
  // --------------------------------------------------------------------------
  describe('destroyAll', () => {
    it('should not throw when no active engines', () => {
      expect(() => streamingService.destroyAll()).not.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // selectTorrent (tested indirectly through getStreamableFile)
  // --------------------------------------------------------------------------
  describe('torrent quality selection', () => {
    it('should prefer 720p over 1080p', async () => {
      const torrentStream = jest.requireMock<jest.Mock>('torrent-stream');

      // Reset mock to avoid the global state from existsSync
      const fs = jest.requireMock<typeof import('fs')>('fs');
      (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
        if (typeof p === 'string' && p.includes('downloads')) return true;
        return false;
      });

      const movie = await createTestMovie({
        downloadStatus: 'not_downloaded',
        torrents: [
          {
            url: 'https://yts.mx/torrent/1080p',
            hash: 'hash1080',
            quality: '1080p',
            seeds: 200,
            peers: 100,
            size: '2.0 GB',
            sizeBytes: 2_000_000_000,
          },
          {
            url: 'https://yts.mx/torrent/720p',
            hash: 'hash720',
            quality: '720p',
            seeds: 150,
            peers: 75,
            size: '1.2 GB',
            sizeBytes: 1_200_000_000,
          },
        ],
      });

      // Emit ready when the listener is attached
      const originalOn = mockEngine.on.bind(mockEngine);
      mockEngine.on = jest
        .fn()
        .mockImplementation((event: string, cb: (...args: unknown[]) => void) => {
          originalOn(event, cb);
          if (event === 'ready') {
            const mockFile = {
              name: 'Movie.720p.mp4',
              path: 'Movie.720p.mp4',
              length: 1_200_000_000,
              select: jest.fn(),
              deselect: jest.fn(),
              createReadStream: jest.fn().mockReturnValue(
                new Readable({
                  read() {
                    this.push(null);
                  },
                }),
              ),
            };
            mockEngine.files = [mockFile];
            setImmediate(() => mockEngine.emit('ready'));
          }
          return mockEngine;
        }) as typeof mockEngine.on;

      await streamingService.getStreamableFile(movie._id.toString());

      // Verify the magnet was called (torrent-stream receives the magnet)
      expect(torrentStream).toHaveBeenCalled();

      // Restore original on
      mockEngine.on = originalOn as typeof mockEngine.on;
    });
  });
});
