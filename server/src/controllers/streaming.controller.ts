import { Request, Response } from 'express';
import * as fs from 'fs';
import { Readable } from 'stream';
import { StreamingService } from '../services/streaming.service';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';
import { BadRequestError } from '../core/errors/customErrors';

export class StreamingController {
  private _streamingService: StreamingService;

  constructor(streamingService: StreamingService) {
    this._streamingService = streamingService;
  }

  stream = asyncHandler(async (req: Request, res: Response) => {
    const { movieId } = req.validated?.params as { movieId: string };
    const { quality } = (req.validated?.query as { quality?: string }) || {};
    const userLanguage = req.user?.language || 'en';

    const streamable = await this._streamingService.getStreamableFile(movieId, userLanguage, quality);

    if (streamable.needsTranscoding) {
      logger.info({ movieId }, 'Transcoding required — streaming via ffmpeg');

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Transfer-Encoding', 'chunked');

      let inputStream: Readable;
      if (streamable.filePath) {
        inputStream = fs.createReadStream(streamable.filePath);
      } else if (streamable.createTorrentStream) {
        inputStream = streamable.createTorrentStream() as Readable;
      } else {
        throw new BadRequestError('No stream source available');
      }

      const transcodedStream = this._streamingService.createTranscodingStream(inputStream);

      // Clean up on client disconnect
      res.on('close', () => {
        transcodedStream.destroy();
      });

      transcodedStream.pipe(res);
      return;
    }

    // Direct serve (MP4/WebM) with Range support ---
    const fileSize = streamable.fileSize;
    const rangeHeader = req.headers.range;

    if (rangeHeader) {
      // Parse Range header per RFC 7233: "bytes=start-end", "bytes=start-", "bytes=-suffix"
      const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
      if (!match) {
        // Malformed Range header — respond with 416
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
        res.end();
        return;
      }

      const rawStart = match[1];
      const rawEnd = match[2];

      let start: number;
      let end: number;

      if (rawStart === '' && rawEnd === '') {
        // "bytes=-" is invalid
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
        res.end();
        return;
      } else if (rawStart === '') {
        // Suffix-byte range: "bytes=-N" means last N bytes
        const suffixLength = parseInt(rawEnd, 10);
        start = Math.max(0, fileSize - suffixLength);
        end = fileSize - 1;
      } else {
        start = parseInt(rawStart, 10);
        end = rawEnd !== '' ? parseInt(rawEnd, 10) : fileSize - 1;
      }

      // Number.isFinite guards are defensive — the regex guarantees digit strings,
      // but parseInt('', 10) === NaN so they catch any edge cases from empty capture groups.
      if (!Number.isFinite(start) || !Number.isFinite(end) || start >= fileSize || end >= fileSize || start > end) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
        res.end();
        return;
      }

      const chunkSize = end - start + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunkSize);
      res.setHeader('Content-Type', streamable.mimeType);

      let readStream: Readable;
      if (streamable.filePath) {
        // Serve from local file
        readStream = fs.createReadStream(streamable.filePath, { start, end });
      } else if (streamable.createTorrentStream) {
        // Serve from active torrent engine
        readStream = streamable.createTorrentStream(start, end);
      } else {
        throw new BadRequestError('No stream source available');
      }

      res.on('close', () => {
        readStream.destroy();
      });

      readStream.pipe(res);
    } else {
      // No Range header — serve full file (200)
      res.status(200);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Type', streamable.mimeType);
      res.setHeader('Accept-Ranges', 'bytes');

      let readStream: Readable;
      if (streamable.filePath) {
        readStream = fs.createReadStream(streamable.filePath);
      } else if (streamable.createTorrentStream) {
        readStream = streamable.createTorrentStream();
      } else {
        throw new BadRequestError('No stream source available');
      }

      res.on('close', () => {
        readStream.destroy();
      });

      readStream.pipe(res);
    }
  });

  getStatus = asyncHandler(async (req: Request, res: Response) => {
    const { movieId } = req.validated?.params as { movieId: string };
    const { quality } = (req.validated?.query as { quality?: string }) || {};
    const userLanguage = req.user?.language || 'en';

    const status = await this._streamingService.getStatus(movieId, userLanguage, quality);

    res.json({
      status: 'success',
      data: status,
    });
  });
}
