import { IScrapedMovie } from '../../interfaces/movie.interface';
import { ytsProvider } from './providers/YtsProvider';
import { MovieRepository } from '../../repositories/movie.repository';
import { getMetadata } from '../metadata/tmdb';
import { logger } from '../../utils/logger';
import { BaseProvider } from './providers/BaseProvider';
import { IPaginationOptions, MovieFilterOptions } from '../../core/interfaces/IPagination';
import { getOmdbMetadata } from '../metadata/omdb';

export class ScraperEngine {
  private _providers: BaseProvider[];
  private _movieRepository = new MovieRepository();

  constructor(providers: BaseProvider[]) {
    this._providers = providers;
  }

  async scrapePage(page: number) {
    logger.info(`\n--- Scraping Page ${page} ---`);

    const promises = this._providers.map((provider) => provider.scrape(page));
    const results = await Promise.all(promises);

    const partialMovies = results.flat();

    logger.info(`Scraped ${partialMovies.length} movies from all providers on page ${page}.`);

    for (const partial of partialMovies) {
      await this.fillMetadataAndUpsertMovie(partial);
    }
  }

  async searchQuery(paginationOptions: IPaginationOptions, filterOptions: MovieFilterOptions) {
    logger.info(`searching query ${filterOptions.search} ---`);

    const promises = this._providers.map((provider) =>
      provider.search({ ...paginationOptions, ...filterOptions }),
    );
    const results = await Promise.all(promises);

    const partialMovies = results.flat();

    logger.info(
      `Found ${partialMovies.length} movies from all providers for query "${filterOptions.search}".`,
    );

    logger.debug(
      `Logging data found: ${JSON.stringify(partialMovies.map((m) => ({ title: m.title, year: m.year })))}`,
    );

    for (const partial of partialMovies) {
      await this.fillMetadataAndUpsertMovie(partial);
    }
  }

  // Add metadata to new scraped movie or update torrents for existing movie
  async fillMetadataAndUpsertMovie(partial: IScrapedMovie) {
    if (!partial.imdbId) return;

    const existingMovie = await this._movieRepository.findByImdbId(partial.imdbId);

    if (existingMovie) {
      let hasNewTorrents = false;
      for (const t of partial.torrents) {
        const duplicate = existingMovie.torrents.some((et) => et.hash === t.hash);
        if (!duplicate) {
          existingMovie.torrents.push(t);
          hasNewTorrents = true;
        }
      }
      if (hasNewTorrents) {
        existingMovie.lastUpdated = new Date();
        await existingMovie.save();
        logger.info(`Updated torrents for ${existingMovie.title}`);
      }
    } else {
      logger.info(`New Movie Found: ${partial.title}. Fetching metadata...`);
      let metadata = await getMetadata(partial.imdbId);

      if (!metadata) {
        metadata = await getOmdbMetadata(partial.imdbId);
      }

      if (metadata) {
        const completeMovie = {
          ...metadata,
          ...partial,
          title: metadata.title,
        };

        try {
          await this._movieRepository.create(completeMovie);
          logger.info(`Created DB Entry: ${completeMovie.title} ${completeMovie.year}`);
        } catch (error) {
          // log complete partial and metadata object for debugging
          logger.debug(
            `Error creating movie ${completeMovie.title}: ${(error as Error).message}\nPartial: ${JSON.stringify(
              partial,
            )}\nMetadata: ${JSON.stringify(metadata)}`,
          );
        }
      } else {
        logger.warn(`Failed to find metadata for ${partial.imdbId}. Skipping.`);
      }
    }
  }
}

export const scraperEngine = new ScraperEngine([ytsProvider]);
