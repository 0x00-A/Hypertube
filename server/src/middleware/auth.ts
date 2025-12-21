import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/jwt.service';
import { UserRepository } from '../repositories/user.repository';
import { UnauthorizedError } from '../core/errors/customErrors';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

// Singleton instances - reused across all requests
const userRepository = new UserRepository();
const jwtService = new JWTService(userRepository);

export const auth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    throw new UnauthorizedError('Unauthorized: No access token provided');
  }

  const result = await jwtService.verifyToken(accessToken, true, false);

  req.user = result.user;
  next();
});

export const optionalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const accessToken = req.cookies.accessToken;
    if (accessToken) {
      try {
        const result = await jwtService.verifyToken(accessToken, true, false);
        req.user = result.user;
      } catch (error) {
        logger.warn(`[optionalAuth] Token verification failed: ${(error as Error).message}`);
        req.user = undefined;
      }
    } else {
      req.user = undefined;
    }
    next();
  },
);
