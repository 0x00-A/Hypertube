import { ZodSchema } from 'zod';
import { RequestHandler } from 'express';
import { IUser } from '../interfaces/user.interface';

type ParsedRequest = { body?: unknown; query?: unknown; params?: unknown };

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      role?: string;
      validated?: ParsedRequest;
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
    req.validated = parsed;
    next();
  };
