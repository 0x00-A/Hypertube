import { RequestHandler } from 'express';
import { JWTService } from '../services/jwt.service';
import { UserRepository } from '../repositories/user.repository';
import { UnauthorizedError } from '../core/errors/customErrors';

export const auth: RequestHandler = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      throw new UnauthorizedError('Unauthorized: No access token provided');
    }

    const jwtService = new JWTService(new UserRepository());
    const result = await jwtService.verifyToken(accessToken, true, false);

    req.user = result.user;
    next();
  } catch (err) {
    next(err);
  }
};
