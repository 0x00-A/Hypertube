import { MovieRepository } from '../repositories/movie.repository';
import { IPaginationOptions, MovieFilterOptions } from '../core/interfaces/IPagination';
import { logger } from '../utils/logger';
import { ScraperEngine } from './scraper/ScraperEngine';
import { IMovie, ITmdbTrendingMovie, ITmdbTrendingResponse } from '../interfaces/movie.interface';
import { getImdbIdFromTmdbId, getMetadata } from './metadata/tmdb';
import { getYtsMovieDetailsByImdbId } from './metadata/yts';
import axios from 'axios';
import { env } from '../config/env';
import { BadGatewayError } from '../core/errors/customErrors';
import { getGenreNames } from '../utils/genres';

export class MovieService {
  private _movieRepository: MovieRepository;
  private _scraperEngine: ScraperEngine;

  constructor(movieRepository: MovieRepository, scraperEngine: ScraperEngine) {
    this._movieRepository = movieRepository;
    this._scraperEngine = scraperEngine;
  }

  async list(paginationOptions: IPaginationOptions, filterOptions: MovieFilterOptions = {}) {
    return this._movieRepository.findAll(paginationOptions, filterOptions);
  }

  async get(id: string): Promise<IMovie | null> {
    const movie = await this._movieRepository.findById(id);
    return movie?.toObject();
  }

  async getByTmdbId(tmdbId: number): Promise<IMovie | null> {
    let movie = await this._movieRepository.findByTmdbId(tmdbId);
    if (!movie) {
      await this.completeMovieData(tmdbId);
      movie = await this._movieRepository.findByTmdbId(tmdbId);
    }

    return movie?.toObject();
  }

  async getTrending(paginationOptions: Partial<IPaginationOptions>) {
    try {
      const trendingUrl = `${env.TMDB_BASE_API_URL}/trending/movie/week`;
      const results = await axios.get<ITmdbTrendingResponse>(trendingUrl, {
        headers: {
          Authorization: `Bearer ${env.TMDB_API_ACCESS_TOKEN}`,
        },
        params: {
          page: paginationOptions.page,
          language: 'en-US',
        },
      });

      const normalized = await this.normalizeTmdbMoviesWithLocalData(results.data.results);

      logger.info(`[MovieService] Fetched and normalized trending movies from TMDB API.`);
      logger.debug(`[MovieService] Trending movies data: ${JSON.stringify(normalized)}`);

      return {
        data: normalized,
        pagination: {
          page: results.data.page,
          total: results.data.total_results,
          totalPages: results.data.total_pages,
          limit: 20,
          hasNextPage: results.data.page < results.data.total_pages,
          hasPrevPage: results.data.page > 1,
        },
      };
    } catch (error: unknown) {
      logger.error(
        `[MovieService] Error fetching trending movies: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadGatewayError();
    }
  }

  async getRecommended(paginationOptions: Partial<IPaginationOptions>, _userId: string) {
    try {
      // Temporary hardcoded recommended movies until user preferences are implemented
      const hardcodedTmdbIds = [
        550, // Fight Club
        680, // Pulp Fiction
        278, // The Shawshank Redemption
        238, // The Godfather
      ];

      const recommendedUrl = `${env.TMDB_BASE_API_URL}/movie/${
        hardcodedTmdbIds[Math.floor(Math.random() * hardcodedTmdbIds.length)]
      }/recommendations`;

      const results = await axios.get<ITmdbTrendingResponse>(recommendedUrl, {
        headers: {
          Authorization: `Bearer ${env.TMDB_API_ACCESS_TOKEN}`,
        },
        params: {
          page: paginationOptions.page,
          language: 'en-US',
        },
      });

      const normalized = await this.normalizeTmdbMoviesWithLocalData(results.data.results);

      logger.info(`[MovieService] Fetched and normalized recommended movies from TMDB API.`);
      logger.debug(`[MovieService] Recommended movies data: ${JSON.stringify(normalized)}`);

      return {
        data: normalized,
        pagination: {
          page: results.data.page,
          total: results.data.total_results,
          totalPages: results.data.total_pages,
          limit: 20,
          hasNextPage: results.data.page < results.data.total_pages,
          hasPrevPage: results.data.page > 1,
        },
      };
    } catch (error: unknown) {
      logger.error(
        `[MovieService] Error fetching recommended movies: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadGatewayError();
    }
  }

  async getPopular(paginationOptions: Partial<IPaginationOptions>) {
    try {
      const popularUrl = `${env.TMDB_BASE_API_URL}/movie/popular`;
      const results = await axios.get<ITmdbTrendingResponse>(popularUrl, {
        headers: {
          Authorization: `Bearer ${env.TMDB_API_ACCESS_TOKEN}`,
        },
        params: {
          page: paginationOptions.page,
          language: 'en-US',
        },
      });
      const normalized = await this.normalizeTmdbMoviesWithLocalData(results.data.results);

      logger.info(`[MovieService] Fetched and normalized popular movies from TMDB API.`);
      logger.debug(`[MovieService] Popular movies data: ${JSON.stringify(normalized)}`);
      return {
        data: normalized,
        pagination: {
          page: results.data.page,
          total: results.data.total_results,
          totalPages: results.data.total_pages,
          limit: 20,
          hasNextPage: results.data.page < results.data.total_pages,
          hasPrevPage: results.data.page > 1,
        },
      };
    } catch (error: unknown) {
      logger.error(
        `[MovieService] Error fetching popular movies: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadGatewayError();
    }
  }

  async completeMovieData(tmdbId: number) {
    try {
      const imdbId = await getImdbIdFromTmdbId(tmdbId);
      if (!imdbId) {
        logger.error(`[MovieService] No IMDb ID found for TMDb ID "${tmdbId}".`);
        return null;
      }

      // In case movie metadata is from OMDB so it exists but it doesnt have imdbId
      const movieExists = await this._movieRepository.findByImdbId(imdbId);
      if (movieExists) {
        logger.info(
          `[MovieService] Movie with IMDb ID "${imdbId}" already exists in database. Skipping completion.`,
        );
        await movieExists.save();
        return movieExists.toObject();
      }

      let metadata = await getMetadata(imdbId);
      if (!metadata) {
        logger.error(`[MovieService] TMDB metadata not found for IMDb ID "${imdbId}".`);
        return null;
      }

      // add YTS torrents using IMDb ID
      const ytsMovieDetails = await getYtsMovieDetailsByImdbId(imdbId);
      if (!ytsMovieDetails || !ytsMovieDetails.torrents || ytsMovieDetails.torrents.length === 0) {
        logger.warn(`[MovieService] No YTS torrents found for IMDb ID "${imdbId}".`);
        logger.debug({ ytsMovieDetails }, 'YTS full response');
      }

      const movieData: Partial<IMovie> = {
        imdbId,
        tmdbId,
        title: metadata.title,
        year: metadata.year,
        rating: metadata.rating,
        duration: metadata.duration,
        synopsis: metadata.synopsis,
        genres: metadata.genres || [],
        originalLanguage: metadata.originalLanguage,
        trailer: metadata.trailer,
        images: metadata.images,
        torrents: ytsMovieDetails?.torrents
          ? ytsMovieDetails.torrents.map((t) => ({
              url: t.url,
              hash: t.hash,
              quality: t.quality,
              type: t.type,
              videoCodec: t.video_codec,
              seeds: t.seeds,
              peers: t.peers,
              size: t.size,
              sizeBytes: t.size_bytes,
              provider: 'YTS',
            }))
          : [],
        downloadStatus: 'not_downloaded',
        lastUpdated: new Date(),
      };

      // create or update
      await this._movieRepository.upsert(movieData);

      logger.info(
        `[MovieService] Successfully created/updated complete movie data for TMDb ID "${tmdbId}".`,
      );
      return movieData;
    } catch (error) {
      logger.error(
        `[MovieService] Error completing data for movie TMDb ID "${tmdbId}": ${(error as Error).message}`,
      );
      return null;
    }
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

    // if less than 10, scrape external sources and query again
    if (!results.data || results.data.length < 10) {
      await this._scraperEngine.searchQuery(paginationOptions, filterOptions);
      results = await this.searchDatabase(paginationOptions, filterOptions);

      if (results.data) {
        logger.info(
          `After scraping, found ${results.data.length} movies in database for query "${filterOptions.search}".`,
        );
      }
    }

    return results;
  }

  private async normalizeTmdbMoviesWithLocalData(tmdbMovies: ITmdbTrendingMovie[]) {
    const tmdbIds = tmdbMovies.map((m) => m.id);
    const localMovies = await this._movieRepository.findByTmdbIds(tmdbIds);
    const localTmdbIds = new Set(localMovies.map((m) => m.tmdbId));

    return tmdbMovies.map((m: ITmdbTrendingMovie) => ({
      tmdbId: m.id,
      title: m.title,
      year: m.release_date ? parseInt(m.release_date.split('-')[0]) : 0,
      rating: m.vote_average.toFixed(1),
      originalLanguage: m.original_language,
      overview: m.overview,
      genres: getGenreNames(m.genre_ids),
      images: {
        thumbnail: m.poster_path ? `${env.TMDB_IMAGE_BASE_URL}/w200${m.poster_path}` : '',
        backdrop: m.backdrop_path ? `${env.TMDB_IMAGE_BASE_URL}/original${m.backdrop_path}` : '',
      },
      isLocal: localTmdbIds.has(m.id),
    }));
  }
}
