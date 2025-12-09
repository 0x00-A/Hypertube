import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Higher-order function that wraps async route handlers to catch errors
 * and forward them to Express error handling middleware.
 *
 * This eliminates the need for repetitive try-catch blocks in every controller.
 *
 * @param fn - Async request handler function
 * @returns Wrapped request handler that catches errors
 *
 * @example
 * // Before:
 * async signUp(req: Request, res: Response, next: NextFunction) {
 *   try {
 *     const user = await service.create(req.body);
 *     res.status(201).json({ user });
 *   } catch (err) {
 *     next(err);
 *   }
 * }
 *
 * // After:
 * signUp = asyncHandler(async (req: Request, res: Response) => {
 *   const user = await service.create(req.body);
 *   res.status(201).json({ user });
 * });
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
