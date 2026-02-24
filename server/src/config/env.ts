import * as dotenv from 'dotenv';
dotenv.config();
import { cleanEnv, str, port, bool, num } from 'envalid';

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
  PORT: port({ default: 3000 }),
  MONGODB_URI: str({ default: 'mongodb://localhost:27017/hypertube-test' }),
  CLIENT_URL: str({ default: 'http://localhost:5173' }),
  ENABLE_REQUEST_LOGGING: bool({ default: true }),
  LOG_LEVEL: str({ default: 'info' }),

  YTS_BASE_API_URL: str({ default: 'https://yts.mx/api/v2' }),
  TMDB_BASE_API_URL: str({ default: 'https://api.themoviedb.org/3' }),
  TMDB_IMAGE_BASE_URL: str({ default: 'https://image.tmdb.org/t/p' }),
  TMDB_API_ACCESS_TOKEN: str({ default: 'your-tmdb-api-access-token-here' }),
  OMDB_API_KEY: str({ default: 'your-omdb-api-key-here' }),

  OPEN_SUBTITLES_API_URL: str({ default: 'https://api.opensubtitles.com/api/v1' }),
  OPEN_SUBTITLES_API_KEY: str({ default: '' }),
  OPEN_SUBTITLES_USERNAME: str({ default: '' }),
  OPEN_SUBTITLES_PASSWORD: str({ default: '' }),
  OPEN_SUBTITLES_USER_AGENT: str({ default: 'hypertube v1.0' }),

  // Enable running subtitle service unit tests (guarded in test files)
  RUN_SUBTITLE_SERVICE_TESTS: bool({ default: false }),

  JWT_ACCESS_SECRET: str({ default: 'test-access-secret-key-at-least-32-characters-long' }),
  JWT_REFRESH_SECRET: str({ default: 'test-refresh-secret-key-at-least-32-characters-long' }),
  JWT_ACCESS_EXPIRES_IN: str({ default: '12h' }),
  JWT_REFRESH_EXPIRES_IN: str({ default: '30d' }),
  JWT_REFRESH_PATH: str({ default: '/api/v1/auth/refresh-token' }),
  MAX_AGE_ACCESS_TOKEN: num({ default: 43200000 }), // 12 hours in ms
  MAX_AGE_REFRESH_TOKEN: num({ default: 2592000000 }), // 30 days in ms

  GOOGLE_CLIENT_ID: str({ default: 'test-google-client-id' }),
  GOOGLE_CLIENT_SECRET: str({ default: 'test-google-client-secret' }),
  GOOGLE_CALLBACK_URL: str({ default: 'http://localhost:3001/api/v1/oauth/google/callback' }),

  FORTYTWO_CLIENT_ID: str({ default: 'test-42-client-id' }),
  FORTYTWO_CLIENT_SECRET: str({ default: 'test-42-client-secret' }),
  FORTYTWO_CALLBACK_URL: str({ default: 'http://localhost:3001/api/v1/oauth/42/callback' }),

  OAUTH_CLIENT_REDIRECT_URL: str({ default: 'http://localhost:5173/auth/oauth-callback' }),

  EMAIL_HOST: str({ default: 'localhost' }),
  EMAIL_PORT: num({ default: 1025 }),
  EMAIL_USER: str({ default: 'test@hypertube.test' }),
  EMAIL_PASS: str({ default: 'test-password' }),

  // Streaming
  DOWNLOADS_DIR: str({ default: './downloads' }),
});
