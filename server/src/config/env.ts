import * as dotenv from 'dotenv';
dotenv.config();
import { cleanEnv, str, port, bool } from 'envalid';

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
  PORT: port({ default: 3000 }),
  MONGODB_URI: str(),
  CLIENT_URL: str(),
  ENABLE_REQUEST_LOGGING: bool({ default: true }),

  YTS_BASE_API_URL: str({ default: 'https://yts.mx/api/v2' }),
  TMDB_API_ACCESS_TOKEN: str(),
  OMDB_API_KEY: str(),

  JWT_ACCESS_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  JWT_ACCESS_EXPIRES_IN: str({ default: '1h' }),
  JWT_REFRESH_EXPIRES_IN: str({ default: '30d' }),
  JWT_REFRESH_PATH: str({ default: '/api/v1/auth/refresh-token' }),
});
