import { ZodSchema } from 'zod';
import { RequestHandler } from 'express';
import { IUser } from '../interfaces/user.interface';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      role?: string;
    }
  }
}

export const validate =
  (schema: ZodSchema<any>): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!result.success) {
      return res.status(400).json({
        errors: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    const parsed = result.data as { body?: unknown; query?: unknown; params?: unknown };
    // Avoid mutating Express request getters; attach parsed values for controllers to opt-in use
    (req as any).validated = parsed;
    next();
  };
