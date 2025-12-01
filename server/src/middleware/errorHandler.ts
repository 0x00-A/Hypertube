import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
const logger = pino();

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  logger.error({ err }, 'Unhandled error');
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
}
