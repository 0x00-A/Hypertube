# Scraper Integration Tests

This directory contains end-to-end integration tests for the Hypertube scraper engine.

## Overview

The scraper integration test (`scraper.integration.test.ts`) verifies the complete workflow:

1. Scraping movies from external providers (YTS, PopcornTime, etc.)
2. Fetching metadata from TMDB API
3. Saving/updating movies in MongoDB
4. Handling duplicate torrents and movie updates

## Test Modes

### Mock Provider Mode (Default)

By default, tests run with **mock providers** for fast, reliable, and offline testing.

```bash
npm test -- tests/integration/scraper.integration.test.ts
```

**Mock behavior:**

- Uses `MockYtsProvider` instead of real API calls
- Returns predefined movies (The Shawshank Redemption, The Dark Knight)
- TMDB metadata is also mocked
- Tests run quickly (~3 seconds)
- No external API dependencies
- Predictable test results

### Real Provider Mode

To test against **real external APIs**, set the `RUN_SCRAPER_INTEGRATION` environment variable:

```bash
# PowerShell
$env:RUN_SCRAPER_INTEGRATION='true'; npm test -- tests/integration/scraper.integration.test.ts

# Bash/Linux
RUN_SCRAPER_INTEGRATION=true npm test -- tests/integration/scraper.integration.test.ts
```

**Real provider behavior:**

- Uses actual YTS API (requires internet connection)
- Uses actual TMDB API (requires valid `TMDB_API_ACCESS_TOKEN` in `.env`)
- Tests may take longer (~10-30 seconds)
- Results depend on current API data
- Tests verify data structure, not exact values

## Test Coverage

### 1. End-to-End Scraping

- ✅ Scrapes page 1 from providers
- ✅ Fetches metadata from TMDB
- ✅ Saves complete movies to MongoDB
- ✅ Verifies movie structure and data integrity

### 2. Update Logic

- ✅ Updates existing movies with new torrents
- ✅ Prevents duplicate torrents (same hash)
- ✅ Updates `lastUpdated` timestamp

### 3. Data Validation

- ✅ Skips movies without valid IMDb ID
- ✅ Maintains unique IMDb IDs in database

### 4. MongoDB Integration

- ✅ Uses `mongodb-memory-server` for isolated testing
- ✅ Tests save/retrieve operations
- ✅ Verifies data persistence

## Requirements

### Mock Mode

- No external dependencies
- Works offline
- Runs in ~3 seconds

### Real Provider Mode

- Internet connection
- Valid `TMDB_API_ACCESS_TOKEN` in `.env` file:
  ```env
  TMDB_API_ACCESS_TOKEN=eyJhbGc...your_token_here
  ```
- YTS API must be accessible (uses `yts.lt` by default)
- Runs in ~9-10 seconds

> **Note:** The `.env` file is automatically loaded during tests. If you don't have a `.env` file, create one in the `server/` directory with the TMDB token.

## Configuration

Test environment variables are defined in `tests/setup-env.ts`:

```typescript
process.env.RUN_SCRAPER_INTEGRATION = 'false'; // Set to 'true' for real providers
process.env.YTS_BASE_API_URL = 'https://yts.mx/api/v2';
process.env.TMDB_API_ACCESS_TOKEN = 'test-tmdb-token-for-mocking';
```

## Example Output

### Mock Mode (fast)

```
Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Time:        2.952 s
```

### Real Provider Mode (slower, requires internet)

```
Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Time:        15.234 s
```

## Debugging

To see detailed logs during testing:

1. Remove the logger mock in the test file
2. Set `verbose: true` in `jest.config.cjs`
3. Run tests with `--verbose` flag:
   ```bash
   npm test -- tests/integration/scraper.integration.test.ts --verbose
   ```

## Continuous Integration

For CI/CD pipelines:

- Use **mock mode** by default for speed and reliability
- Run **real provider mode** on scheduled jobs (e.g., nightly) to verify API compatibility
- Cache mongodb-memory-server binaries to speed up CI

Example GitHub Actions:

```yaml
- name: Run Mock Integration Tests
  run: npm test

- name: Run Real Provider Integration Tests (Nightly)
  if: github.event.schedule
  env:
    RUN_SCRAPER_INTEGRATION: 'true'
    TMDB_API_ACCESS_TOKEN: ${{ secrets.TMDB_API_ACCESS_TOKEN }}
  run: npm test -- tests/integration/scraper.integration.test.ts
```

## Troubleshooting

### MongoDB Memory Server Issues

If you see MongoDB connection errors:

```bash
# Clear the cache
rm -rf ~/.cache/mongodb-binaries
# or on Windows
Remove-Item -Recurse -Force $env:USERPROFILE\.cache\mongodb-binaries
```

### Timeout Errors

If tests timeout with real providers:

- Check your internet connection
- Verify API keys are valid
- Increase timeout in test (currently 30 seconds)

### TypeScript Errors

Make sure all dependencies are installed:

```bash
npm install
```
