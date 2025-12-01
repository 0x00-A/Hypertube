import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
const logger = pino({ transport: { target: 'pino-pretty' } });

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - start,
    });
  });
  next();
}
