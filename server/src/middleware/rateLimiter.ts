import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiter for password reset requests
 * Prevents email bombing attacks by limiting requests per email address
 *
 * Limits: 3 requests per hour per email address
 * This stricter limit is appropriate for security-sensitive operations
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 3, // Max 3 requests per hour per email
  message: {
    status: 'fail',
    message: 'Too many password reset requests. Please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers

  // Use email from request body as the key for rate limiting
  keyGenerator: (req: Request): string => {
    const email = req.body?.email;
    // If no email in body, use IP as fallback (shouldn't happen with validation)
    return email ? `password-reset:${email.toLowerCase().trim()}` : req.ip || 'unknown';
  },

  // Custom handler to return consistent error format
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      status: 'fail',
      message: 'Too many password reset requests for this email address. Please try again in an hour.',
      path: '/api/v1/auth/request-password-reset',
    });
  },
});

/**
 * Rate limiter for general authentication endpoints
 * Prevents brute force attacks on login and other auth endpoints
 *
 * Limits: 10 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per 15 minutes per IP
  message: {
    status: 'fail',
    message: 'Too many requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,

  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      status: 'fail',
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    });
  },
});
