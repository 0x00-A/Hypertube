import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { passport } from '../config/passport';
import { JWTService } from '../services/jwt.service';
import { IUser } from '../interfaces/user.interface';

export class OAuthController {
  constructor(private _jwtService: JWTService) {}

  googleAuth = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false
    })(req, res, next);
  };

  googleCallback = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', { session: false }, (err: Error | null, user: IUser | false) => {
      if (err || !user) {
        return res.redirect(`${env.CLIENT_URL}?error=oauth_failed`);
      }
      const tokens = this._jwtService.generateTokens({ userId: user._id! });

      res.cookie('accessToken', tokens.access_token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: env.MAX_AGE_ACCESS_TOKEN
      });

      res.cookie('refreshToken', tokens.refresh_token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth/refresh-token',
        maxAge: env.MAX_AGE_REFRESH_TOKEN
      });

      return res.redirect(`${env.CLIENT_URL}?status=oauth_success`);
    })(req, res, next);
  };

  fortyTwoAuth = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('42', {
      session: false
    })(req, res, next);
  };

  fortyTwoCallback = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('42', { session: false }, (err: Error | null, user: IUser | false) => {
      if (err || !user) {
        return res.redirect(`${env.CLIENT_URL}?error=oauth_failed`);
      }

      const tokens = this._jwtService.generateTokens({ userId: user._id! });

      res.cookie('accessToken', tokens.access_token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: env.MAX_AGE_ACCESS_TOKEN,
      });

      res.cookie('refreshToken', tokens.refresh_token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth/refresh-token',
        maxAge: env.MAX_AGE_REFRESH_TOKEN,
      });

      return res.redirect(`${env.CLIENT_URL}?status=oauth_success`);
    })(req, res, next);
  };
}