import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(req: Request, res: Response, _next: NextFunction) {
  res.status(404).json({ message: 'Route not found', path: req.originalUrl });
}
