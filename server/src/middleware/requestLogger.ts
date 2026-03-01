import { Request, Response, NextFunction } from 'express';
import pino from 'pino';

// Use pretty printing only in development
const logger =
  process.env.NODE_ENV === 'development' ? pino({ transport: { target: 'pino-pretty' } }) : pino(); // Production: JSON output

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
