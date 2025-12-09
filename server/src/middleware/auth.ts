import { RequestHandler } from 'express';
import { JWTService } from '../services/jwt.service';

export const auth: RequestHandler = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: No access token provided' });
  }

  const jwtService = new JWTService();
  const result = await jwtService.verifyToken(accessToken, true, false);

  if (result.success) {
    req.user = result.user;
    return next();
  } else {
    return res.status(401).json({
      status: 'error',
      message: result.error?.message || 'Unauthorized',
      errorType: result.error?.type
    });
  }
};
