import * as dotenv from 'dotenv';
dotenv.config();
import { cleanEnv, str, port, bool, num } from 'envalid';

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
  PORT: port({ default: 3000 }),
  MONGODB_URI: str(),
  CLIENT_URL: str(),
  ENABLE_REQUEST_LOGGING: bool({ default: true }),
  LOG_LEVEL: str({ default: 'info' }),

  YTS_BASE_API_URL: str({ default: 'https://yts.mx/api/v2' }),
  TMDB_BASE_API_URL: str({ default: 'https://api.themoviedb.org/3' }),
  TMDB_IMAGE_BASE_URL: str({ default: 'https://image.tmdb.org/t/p' }),
  TMDB_API_ACCESS_TOKEN: str(),
  OMDB_API_KEY: str(),

  JWT_ACCESS_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  JWT_ACCESS_EXPIRES_IN: str({ default: '1h' }),
  JWT_REFRESH_EXPIRES_IN: str({ default: '30d' }),
  JWT_REFRESH_PATH: str({ default: '/api/v1/auth/refresh-token' }),
  MAX_AGE_ACCESS_TOKEN: num({ default: 3600000 }), // 1 hour in ms
  MAX_AGE_REFRESH_TOKEN: num({ default: 2592000000 }), // 30 days in ms

  GOOGLE_CLIENT_ID: str(),
  GOOGLE_CLIENT_SECRET: str(),
  GOOGLE_CALLBACK_URL: str(),

  FORTYTWO_CLIENT_ID: str(),
  FORTYTWO_CLIENT_SECRET: str(),
  FORTYTWO_CALLBACK_URL: str(),

  EMAIL_HOST: str(),
  EMAIL_PORT: num(),
  EMAIL_USER: str(),
  EMAIL_PASS: str(),
});
