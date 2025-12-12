// Load .env.test file first to get real tokens
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load the .env.test file from the server directory
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Now set/override test-specific variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.ENABLE_REQUEST_LOGGING = 'false';
process.env.LOG_LEVEL = 'error';
process.env.CLIENT_URL = 'http://localhost:5173';

// YTS has multiple mirror URLs - try yts.lt if yts.mx is blocked
if (!process.env.YTS_BASE_API_URL) {
  process.env.YTS_BASE_API_URL = 'https://yts.lt/api/v2';
}

if (!process.env.TMDB_BASE_API_URL) {
  process.env.TMDB_BASE_API_URL = 'https://api.themoviedb.org/3';
}

if (!process.env.TMDB_IMAGE_BASE_URL) {
  process.env.TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
}

// TMDB token should come from .env.test, but provide fallback for mock mode
if (!process.env.TMDB_API_ACCESS_TOKEN) {
  process.env.TMDB_API_ACCESS_TOKEN = 'test-tmdb-token-for-mocking';
}

// OMDB key should come from .env.test, but provide fallback for mock mode
if (!process.env.OMDB_API_KEY) {
  process.env.OMDB_API_KEY = 'test-omdb-key-for-mocking';
}

// JWT secrets for testing - do not use in production
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-at-least-32-characters-long-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-at-least-32-characters-long-for-testing';
process.env.JWT_ACCESS_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '30d';
process.env.JWT_REFRESH_PATH = '/api/v1/auth/refresh-token';
process.env.MAX_AGE_ACCESS_TOKEN = '3600000'; // 1 hour in ms
process.env.MAX_AGE_REFRESH_TOKEN = '2592000000'; // 30 days in ms

// OAuth configuration for testing
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id-for-testing-purposes';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret-for-testing-purposes';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3001/api/v1/oauth/google/callback';
process.env.FORTYTWO_CLIENT_ID = 'test-42-client-id-for-testing-purposes';
process.env.FORTYTWO_CLIENT_SECRET = 'test-42-client-secret-for-testing-purposes';
process.env.FORTYTWO_CALLBACK_URL = 'http://localhost:3001/api/v1/oauth/42/callback';

// Set to 'false' for mock mode (default), 'true' for real provider testing
if (!process.env.RUN_SCRAPER_INTEGRATION) {
  process.env.RUN_SCRAPER_INTEGRATION = 'false';
}
