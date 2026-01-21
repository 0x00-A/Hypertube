import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile, VerifyCallback } from 'passport-google-oauth20';
import FortyTwoStrategy = require('passport-42');
import { OAuthService } from '../services/oauth.service';
import { FortyTwoProfile } from '../types/oauth.type';
import { env } from './env';


export function configurePassport(oauthService: OAuthService): void {
  // Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken: string, refreshToken: string, profile: GoogleProfile, done: VerifyCallback) => {
        try {
          const user = await oauthService.handleGoogleOAuth(profile);
          return done(null, user as Express.User);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );

  // 42 Strategy
  passport.use(
    new FortyTwoStrategy(
      {
        clientID: env.FORTYTWO_CLIENT_ID,
        clientSecret: env.FORTYTWO_CLIENT_SECRET,
        callbackURL: env.FORTYTWO_CALLBACK_URL,
      },
      async (accessToken: string, refreshToken: string, profile: unknown, done: VerifyCallback) => {
        try {
          const user = await oauthService.handleFortyTwoOAuth(profile as FortyTwoProfile);
          return done(null, user as Express.User);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

export { passport };
