import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { logger } from '../src/utils/logger';
import { MovieRepository } from '../src/repositories/movie.repository';
import { MovieInteractionRepository } from '../src/repositories/movieInteraction.repository';
import { ScraperEngine } from '../src/services/scraper/ScraperEngine';
import { MovieService } from '../src/services/movie.service';
import { YtsProvider } from '../src/services/scraper/providers/YtsProvider';

async function seed() {
  try {
    if (!env.MONGODB_URI) throw new Error('MONGODB_URI is not set in env');

    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to database for seeding top movies');

    const movieRepo = new MovieRepository();
    const movieInteractionRepo = new MovieInteractionRepository();
    const ytsProvider = new YtsProvider();
    const scraperEngine = new ScraperEngine([ytsProvider]);
    const movieService = new MovieService(movieRepo, scraperEngine, movieInteractionRepo);

    const csvPath = path.resolve(__dirname, 'movies.csv');
    if (!fs.existsSync(csvPath)) throw new Error(`CSV file not found: ${csvPath}`);

    const rows: Array<Record<string, string>> = [];

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csvParser())
        .on('data', (data: Record<string, string>) => {
          rows.push(data);
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });

    logger.info(`Parsed ${rows.length} rows from ${csvPath}`);

    let processed = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const tmdbStr = (row.tmdb_id || row.tmdbId || row.tmdb || '').trim();
      if (!tmdbStr) continue;
      const tmdbId = Number(tmdbStr);
      if (Number.isNaN(tmdbId)) continue;

      try {
        const rank = i + 1; // CSV order determines topRank
        logger.info({ tmdbId, rank }, 'Seeding movie: calling completeMovieData');
        await movieService.completeMovieData(tmdbId);
        // Set numeric topRank in DB
        await movieRepo.updateByTmdbId(tmdbId, { topRank: rank });
        processed++;
        logger.info({ tmdbId, rank }, 'Marked as topRank');
      } catch (err: unknown) {
        logger.error({ err, tmdbId }, 'Failed to seed movie');
      }
    }

    logger.info(`Seeding complete. Processed ${processed} movies.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error: unknown) {
    logger.error({ error }, 'Seeding failed');
    process.exit(1);
  }
}

seed();
