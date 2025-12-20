import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { logger } from '../src/utils/logger';
import { MovieRepository } from '../src/repositories/movie.repository';
import { IMovie } from '../src/interfaces/movie.interface';

const movieRepository = new MovieRepository();

const sampleMovies: Partial<IMovie>[] = [
  {
    imdbId: 'tt0111161',
    tmdbId: 278,
    title: 'The Shawshank Redemption',
    year: 1994,
    rating: 9.3,
    synopsis:
      'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
    genres: ['Drama'],
    originalLanguage: 'en',
    images: { thumbnail: '', backdrop: '', poster: '' },
    torrents: [],
    downloadStatus: 'not_downloaded',
    lastUpdated: new Date(),
  },
  {
    imdbId: 'tt0068646',
    tmdbId: 238,
    title: 'The Godfather',
    year: 1972,
    rating: 9.2,
    synopsis:
      'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
    genres: ['Crime', 'Drama'],
    originalLanguage: 'en',
    images: { thumbnail: '', backdrop: '', poster: '' },
    torrents: [],
    downloadStatus: 'not_downloaded',
    lastUpdated: new Date(),
  },
];

async function seed(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      // keep defaults; change options in env/config if needed
    });

    logger.info({ count: sampleMovies.length }, 'Seeding movies to database');

    for (const movieData of sampleMovies) {
      // MovieRepository.upsert should accept Partial<IMovie>
      await movieRepository.upsert(movieData);
    }

    logger.info('Seeding completed successfully');
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error({ err: error }, 'Seeding failed');
    } else {
      logger.error({ err: String(error) }, 'Seeding failed with unknown error');
    }
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
