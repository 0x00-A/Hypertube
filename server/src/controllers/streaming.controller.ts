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
    const userLanguage = req.user?.language || 'en';

    const streamable = await this._streamingService.getStreamableFile(movieId, userLanguage);

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
      // Parse Range header: "bytes=start-end"
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
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
    const userLanguage = req.user?.language || 'en';

    const status = await this._streamingService.getStatus(movieId, userLanguage);

    res.json({
      status: 'success',
      data: status,
    });
  });
}
