/**
 * Unit tests for StreamingController
 *
 * Focuses on HTTP behavior: Range parsing, response headers, status codes.
 * Mocks StreamingService completely — no torrent/ffmpeg needed.
 */
import { Request, Response } from 'express';
import { Readable } from 'stream';
import { EventEmitter } from 'events';
import { StreamingController } from '../../../src/controllers/streaming.controller';
import { StreamingService } from '../../../src/services/streaming.service';
import type { StreamableFile } from '../../../src/services/streaming.service';

// Mock fs to prevent real file system access
jest.mock('fs', () => {
  const { Readable } = require('stream');
  return {
    ...jest.requireActual('fs'),
    createReadStream: jest.fn().mockImplementation(() => {
      return new Readable({
        read() {
          this.push(Buffer.from('fake-video'));
          this.push(null);
        },
      });
    }),
    existsSync: jest.fn().mockReturnValue(true),
    statSync: jest.fn().mockReturnValue({ size: 5_000_000 }),
  };
});

// ============================================================================
// Mock StreamingService
// ============================================================================

const mockGetStreamableFile = jest.fn();
const mockCreateTranscodingStream = jest.fn();
const mockGetStatus = jest.fn();
const mockDestroyAll = jest.fn();

const mockStreamingService = {
  getStreamableFile: mockGetStreamableFile,
  createTranscodingStream: mockCreateTranscodingStream,
  getStatus: mockGetStatus,
  destroyAll: mockDestroyAll,
} as unknown as StreamingService;

// ============================================================================
// Helpers
// ============================================================================

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    validated: { params: { movieId: '507f1f77bcf86cd799439011' } },
    ...overrides,
  } as unknown as Request;
}

function createMockResponse(): Response & {
  _status: number;
  _headers: Record<string, string | number>;
  _ended: boolean;
  _json: unknown;
  _piped: boolean;
} {
  const res = new EventEmitter() as Response & {
    _status: number;
    _headers: Record<string, string | number>;
    _ended: boolean;
    _json: unknown;
    _piped: boolean;
  };

  res._status = 200;
  res._headers = {};
  res._ended = false;
  res._json = null;
  res._piped = false;

  res.status = jest.fn().mockImplementation((code: number) => {
    res._status = code;
    return res;
  });
  res.setHeader = jest.fn().mockImplementation((key: string, value: string | number) => {
    res._headers[key] = value;
    return res;
  });
  res.end = jest.fn().mockImplementation(() => {
    res._ended = true;
    return res;
  });
  res.json = jest.fn().mockImplementation((data: unknown) => {
    res._json = data;
    return res;
  });
  res.pipe = jest.fn().mockReturnValue(res);
  // pipe() is called on streams, not on response — but we mock the writable aspect
  // The controller calls readStream.pipe(res), so res needs to be writable
  res.write = jest.fn().mockReturnValue(true);

  return res;
}

function createReadableStream(data: string = 'video-data'): Readable {
  return new Readable({
    read() {
      this.push(Buffer.from(data));
      this.push(null);
    },
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('StreamingController', () => {
  let controller: StreamingController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new StreamingController(mockStreamingService);
  });

  // --------------------------------------------------------------------------
  // stream handler
  // --------------------------------------------------------------------------
  describe('stream', () => {
    const baseStreamable: StreamableFile = {
      fileSize: 5_000_000,
      mimeType: 'video/mp4',
      needsTranscoding: false,
      filePath: '/downloads/movie.mp4',
      isDownloading: false,
      movie: {} as StreamableFile['movie'],
    };

    describe('direct serve (no transcoding)', () => {
      it('should respond 200 with full file when no Range header', async () => {
        mockGetStreamableFile.mockResolvedValue(baseStreamable);
        const req = createMockRequest();
        const res = createMockResponse();

        // Call the underlying async handler
        await controller.stream(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Length', 5_000_000);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'video/mp4');
        expect(res.setHeader).toHaveBeenCalledWith('Accept-Ranges', 'bytes');
      });

      it('should respond 206 with partial content when Range header is valid', async () => {
        mockGetStreamableFile.mockResolvedValue(baseStreamable);
        const req = createMockRequest({
          headers: { range: 'bytes=0-999999' },
        } as Partial<Request>);
        const res = createMockResponse();

        await controller.stream(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(206);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Range', 'bytes 0-999999/5000000');
        expect(res.setHeader).toHaveBeenCalledWith('Content-Length', 1000000);
        expect(res.setHeader).toHaveBeenCalledWith('Accept-Ranges', 'bytes');
      });

      it('should respond 416 when Range start exceeds file size', async () => {
        mockGetStreamableFile.mockResolvedValue(baseStreamable);
        const req = createMockRequest({
          headers: { range: 'bytes=9999999-' },
        } as Partial<Request>);
        const res = createMockResponse();

        await controller.stream(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(416);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Range', 'bytes */5000000');
      });
    });

    describe('transcoding path', () => {
      it('should set Content-Type to video/mp4 and Transfer-Encoding to chunked', async () => {
        const transcodingStreamable: StreamableFile = {
          ...baseStreamable,
          needsTranscoding: true,
          mimeType: 'video/x-matroska',
        };
        mockGetStreamableFile.mockResolvedValue(transcodingStreamable);

        const mockTranscodedStream = createReadableStream('transcoded');
        mockCreateTranscodingStream.mockReturnValue(mockTranscodedStream);

        const req = createMockRequest();
        const res = createMockResponse();

        await controller.stream(req, res, jest.fn());

        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'video/mp4');
        expect(res.setHeader).toHaveBeenCalledWith('Transfer-Encoding', 'chunked');
        expect(mockCreateTranscodingStream).toHaveBeenCalled();
      });

      it('should use filePath for transcoding when downloading', async () => {
        const transcodingStreamable: StreamableFile = {
          fileSize: 800_000_000,
          mimeType: 'video/x-matroska',
          needsTranscoding: true,
          filePath: '/downloads/downloading-movie.mkv',
          isDownloading: true,
          movie: {} as StreamableFile['movie'],
        };
        mockGetStreamableFile.mockResolvedValue(transcodingStreamable);

        const mockTranscodedStream = createReadableStream('transcoded');
        mockCreateTranscodingStream.mockReturnValue(mockTranscodedStream);

        const req = createMockRequest();
        const res = createMockResponse();

        await controller.stream(req, res, jest.fn());

        expect(mockCreateTranscodingStream).toHaveBeenCalled();
      });
    });
  });

  // --------------------------------------------------------------------------
  // getStatus handler
  // --------------------------------------------------------------------------
  describe('getStatus', () => {
    it('should return status data wrapped in success envelope', async () => {
      const statusData = {
        downloadStatus: 'downloading',
        hasActiveEngine: true,
        subtitles: {
          en: [{ language: 'English', label: 'English (SRT)', url: '/subtitles/tt123_en.vtt' }],
        },
      };
      mockGetStatus.mockResolvedValue(statusData);

      const req = createMockRequest();
      const res = createMockResponse();

      await controller.getStatus(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: statusData,
      });
    });
  });
});
