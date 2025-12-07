import { IScrapedMovie } from '../../interfaces/movie.interface';
import { YtsProvider } from './providers/YtsProvider';
import { MovieRepository } from '../../repositories/movie.repository';
import { getMetadata } from '../metadata/tmdb';
import { logger } from '../../utils/logger';
import { BaseProvider } from './providers/BaseProvider';

export class ScraperEngine {
  private _providers: BaseProvider[] = [new YtsProvider()];
  private _movieRepository = new MovieRepository();

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
      logger.info(`✨ New Movie Found: ${partial.title}. Fetching metadata...`);
      const metadata = await getMetadata(partial.imdbId);

      if (metadata) {
        const completeMovie = {
          ...partial,
          ...metadata,
          torrents: partial.torrents,
        };

        await this._movieRepository.create(completeMovie);
        logger.info(`Created DB Entry: ${completeMovie.title}`);
      } else {
        logger.warn(`⚠️ Failed to find metadata for ${partial.imdbId}. Skipping.`);
      }
    }
  }
}
