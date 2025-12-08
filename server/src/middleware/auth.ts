import { RequestHandler } from 'express';
import { JWTService, JWTErrorType } from '../services/jwt.service';
import { UserRepository } from '../repositories/user.repository';

export const auth: RequestHandler = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: No access token provided' });
  }

  const jwtService = new JWTService();
  const result = jwtService.verifyAccessToken(accessToken);

  if (!result.success) {
    // if token is expired refresh access token
    if (result.error?.type === JWTErrorType.EXPIRED) {
      
    }
    const statusCode = result.error?.type === JWTErrorType.EXPIRED ? 401 : 401;
    return res.status(statusCode).json({
      status: 'error',
      message: result.error?.message || 'Unauthorized',
      errorType: result.error?.type,
    });
  }

  const repo = new UserRepository();
  const user = await repo.findById(result.payload!.userId);

  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: User not found' });
  }

  req.user = user;
  return next();
};
