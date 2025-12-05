import * as dotenv from 'dotenv';
dotenv.config();
import { cleanEnv, str, port, bool } from 'envalid';

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
  PORT: port({ default: 3000 }),
  MONGODB_URI: str(),
  ENABLE_REQUEST_LOGGING: bool({ default: true }),
  YTS_BASE_API_URL: str({ default: 'https://yts.mx/api/v2' }),
  POP_CORNTIME_BASE_API_URL: str({ default: 'https://tv-v2.api-fetch.website' }),
  TMDB_API_KEY: str(),
  TMDB_BASE_API_URL: str({ default: 'https://api.themoviedb.org/3' }),
  OMDB_API_KEY: str(),
  SCRAPER_INTERVAL_MINUTES: str({ default: '30' }),
  DOWNLOADS_PATH: str({ default: './downloads' }),
  MAX_CONCURRENT_DOWNLOADS: str({ default: '3' }),
  TORRENT_DOWNLOAD_TIMEOUT_MS: str({ default: '300000' }),
  SESSION_SECRET: str(),
});
