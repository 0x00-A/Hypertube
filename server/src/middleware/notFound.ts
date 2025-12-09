import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../core/errors/customErrors';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new NotFoundError('Route not found'));
}
