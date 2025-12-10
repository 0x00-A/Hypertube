// Load .env file first to get real tokens
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load the .env.test file from the server directory
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Now set/override test-specific variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.ENABLE_REQUEST_LOGGING = 'false';
process.env.CLIENT_URL = 'http://localhost:5173';

// YTS has multiple mirror URLs - try yts.lt if yts.mx is blocked
if (!process.env.YTS_BASE_API_URL) {
  process.env.YTS_BASE_API_URL = 'https://yts.lt/api/v2';
}

// TMDB token should come from .env, but provide fallback for mock mode
if (!process.env.TMDB_API_ACCESS_TOKEN) {
  process.env.TMDB_API_ACCESS_TOKEN = 'test-tmdb-token-for-mocking';
}

process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-change-in-production';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-change-in-production';
process.env.JWT_ACCESS_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '30d';

// Set to 'false' for mock mode (default), 'true' for real provider testing
if (!process.env.RUN_SCRAPER_INTEGRATION) {
  process.env.RUN_SCRAPER_INTEGRATION = 'false';
}
