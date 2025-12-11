import { MovieRepository } from '../repositories/movie.repository';
import { IPaginationOptions, MovieFilterOptions } from '../core/interfaces/IPagination';
import { scraperEngine } from './scraper/ScraperEngine';
import { logger } from '../utils/logger';

export class MovieService {
  private _movieRepository: MovieRepository;

  constructor(movieRepository: MovieRepository) {
    this._movieRepository = movieRepository;
  }

  async list(paginationOptions: IPaginationOptions, filterOptions: MovieFilterOptions = {}) {
    return this._movieRepository.findAll(paginationOptions, filterOptions);
  }

  async get(id: string) {
    return this._movieRepository.findById(id);
  }

  async searchDatabase(paginationOptions: IPaginationOptions, filterOptions: MovieFilterOptions) {
    logger.debug(
      `Searching database with filters: ${JSON.stringify(
        filterOptions,
      )} and pagination: ${JSON.stringify(paginationOptions)}`,
    );

    return this._movieRepository.findAll(paginationOptions, filterOptions);
  }

  async searchExternal(paginationOptions: IPaginationOptions, filterOptions: MovieFilterOptions) {
    let results = await this.searchDatabase(paginationOptions, filterOptions);

    if (results.data) {
      logger.info(
        `Found ${results.data.length} movies in database for query "${filterOptions.search}".`,
      );
    }

    // less than 10, scrape external sources and query again
    if (!results.data || results.data.length < 10) {
      await scraperEngine.searchQuery(paginationOptions, filterOptions);
      results = await this.searchDatabase(paginationOptions, filterOptions);

      if (results.data) {
        logger.info(
          `After scraping, found ${results.data.length} movies in database for query "${filterOptions.search}".`,
        );
      }
    }

    return results;
  }
}
