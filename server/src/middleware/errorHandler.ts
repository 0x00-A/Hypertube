import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors/AppError';
import { logger } from '../utils/logger';
import { Error as MongooseError } from 'mongoose';

interface MongoServerError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

interface PayloadTooLargeError extends Error {
  limit?: number;
}

export const errorHandler = (
  err: Error | AppError | MongooseError.ValidationError | MongoServerError | PayloadTooLargeError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  // 1. Operational errors (AppError)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;

    logger.info({ statusCode, message, path: req.originalUrl }, 'Operational error');

    return res.status(statusCode).json({
      status: statusCode >= 500 ? 'error' : 'fail',
      message,
      ...(err.validationErrors && { validationErrors: err.validationErrors }),
      path: req.originalUrl,
    });
  }

  // 2. Mongoose validation errors
  if (err.name === 'ValidationError' && err instanceof MongooseError.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';

    const validationErrors = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));

    logger.warn({ validationErrors, path: req.originalUrl }, 'Mongoose validation error');

    return res.status(statusCode).json({
      status: 'fail',
      message,
      validationErrors,
      path: req.originalUrl,
    });
  }

  // 3. MongoDB duplicate key error (11000)
  const mongoErr = err as MongoServerError;
  if (err.name === 'MongoServerError' && mongoErr.code === 11000) {
    statusCode = 400;
    const field = mongoErr.keyValue ? Object.keys(mongoErr.keyValue)[0] : 'unknown';
    message = `Duplicate value for field: ${field}. Please use another value.`;

    logger.warn({ field, path: req.originalUrl }, 'MongoDB duplicate key error');

    return res.status(statusCode).json({
      status: 'fail',
      message,
      path: req.originalUrl,
    });
  }

  // 4. JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';

    logger.warn({ path: req.originalUrl }, 'Invalid JWT token');

    return res.status(statusCode).json({
      status: 'fail',
      message,
      path: req.originalUrl,
    });
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';

    logger.warn({ path: req.originalUrl }, 'JWT token expired');

    return res.status(statusCode).json({
      status: 'fail',
      message,
      path: req.originalUrl,
    });
  }

  // 5. PayloadTooLargeError (body-parser)
  if (err.name === 'PayloadTooLargeError') {
    statusCode = 413;
    message = 'Request payload too large. Please upload a smaller file (max 5MB)';

    const payloadErr = err as PayloadTooLargeError;
    logger.warn({ path: req.originalUrl, limit: payloadErr.limit }, 'Payload too large');

    return res.status(statusCode).json({
      status: 'fail',
      message,
      path: req.originalUrl,
    });
  }

  // 6. Unknown/programmer errors
  logger.error({ err, path: req.originalUrl }, 'Unhandled/Unexpected error');

  // Never leak internal error details in production
  return res.status(statusCode).json({
    status: 'error',
    message,
    path: req.originalUrl,
  });
};
