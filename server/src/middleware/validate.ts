import { z } from 'zod';
import { RequestHandler } from 'express';
import { IUser } from '../interfaces/user.interface';
import { BadRequestError } from '../core/errors/customErrors';
import { ValidationError } from '../core/errors/AppError';

type ParsedRequest = { body?: unknown; query?: unknown; params?: unknown };

declare global {
  namespace Express {
    interface Request {
      user?: Partial<IUser>;
      role?: string;
      validated?: ParsedRequest;
    }
  }
}

export const validate =
  (schema: z.ZodType<any>): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!result.success) {
      const errors = result.error.issues.map<ValidationError>((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));

      return next(new BadRequestError(errors));
    }
    const parsed = result.data as { body?: unknown; query?: unknown; params?: unknown };
    req.validated = parsed;
    next();
  };
