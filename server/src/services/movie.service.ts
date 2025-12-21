import { MovieRepository } from '../repositories/movie.repository';
import {
  IPaginatedResponse,
  IPaginationOptions,
  MovieFilterOptions,
} from '../core/interfaces/IPagination';
import { logger } from '../utils/logger';
import { ScraperEngine } from './scraper/ScraperEngine';
import {
  IMovie,
  IMovieState,
  ITmdbListMovie,
  ITmdbTrendingMovie,
  ITmdbTrendingResponse,
} from '../interfaces/movie.interface';
import { getImdbIdFromTmdbId, getMetadata } from './metadata/tmdb';
import { getYtsMovieDetailsByImdbId } from './metadata/yts';
import axios from 'axios';
import { env } from '../config/env';
import { BadGatewayError, NotFoundError } from '../core/errors/customErrors';
import { getGenreNames } from '../utils/genres';
import { MovieInteractionRepository } from '../repositories/movieInteraction.repository';
import { Types } from 'mongoose';

export class MovieService {
  private _movieRepository: MovieRepository;
  private _scraperEngine: ScraperEngine;
  private _movieInteractionRepository: MovieInteractionRepository;

  constructor(
    movieRepository: MovieRepository,
    scraperEngine: ScraperEngine,
    movieInteractionRepository: MovieInteractionRepository,
  ) {
    this._movieRepository = movieRepository;
    this._scraperEngine = scraperEngine;
    this._movieInteractionRepository = movieInteractionRepository;
  }

  async list(
    paginationOptions: IPaginationOptions,
    filterOptions: MovieFilterOptions = {},
    userId?: string | undefined,
  ) {
    const result = await this._movieRepository.findAll(paginationOptions, filterOptions);

    result.data = (await this.addUserMovieState(userId, result.data, true)) as IMovie[];

    return result;
  }

  async get(id: string, userId?: string | undefined): Promise<IMovie | null> {
    const movie = await this._movieRepository.findById(id);

    return (await this.addUserMovieState(userId, movie?.toObject(), false)) as IMovie;
  }

  async getRandom(userId?: string | undefined): Promise<IMovie | null> {
    const movie = await this._movieRepository.findRandom();
    return (await this.addUserMovieState(userId, movie?.toObject(), false)) as IMovie;
  }

  async getByTmdbId(tmdbId: number, userId?: string | undefined): Promise<IMovie | null> {
    let movie = await this._movieRepository.findByTmdbId(tmdbId);
    if (!movie) {
      await this.completeMovieData(tmdbId);
      movie = await this._movieRepository.findByTmdbId(tmdbId);
    }

    return (await this.addUserMovieState(userId, movie?.toObject(), false)) as IMovie;
  }

  async getTrending(
    paginationOptions: Partial<IPaginationOptions>,
    userId?: string | undefined,
  ): Promise<IPaginatedResponse<ITmdbListMovie>> {
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

      const normalized = await this.normalizeTmdbMoviesWithLocalData(results.data.results, userId);

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

  async getRecommended(
    paginationOptions: Partial<IPaginationOptions>,
    tmdbId: number | undefined,
    userId: Types.ObjectId,
  ): Promise<IPaginatedResponse<ITmdbListMovie>> {
    try {
      const hardcodedTmdbIds = [
        550, // Fight Club
        680, // Pulp Fiction
        278, // The Shawshank Redemption
        238, // The Godfather
        424, // Schindler's List
        240, // The Godfather: Part II
        13, // Forrest Gump
        155, // The Dark Knight
        497, // The Green Mile
        122, // The Lord of the Rings: The Return of the King
        603, // The Matrix
        769, // Goodfellas
        424, // The Silence of the Lambs
        27205, // Inception
        11, // Star Wars: Episode IV - A New Hope
        1893, // The Empire Strikes Back
        1891, // Return of the Jedi
        157336, // Interstellar
        24428, // The Avengers
        99861, // Avengers: Endgame
        299534, // Avengers: Infinity War
        497698, // Black Widow
        634649, // Spider-Man: No Way Home
      ];

      const lastWatchedTmdbId =
        await this._movieInteractionRepository.getLastWatchedMovieTmdbId(userId);

      const movieId =
        tmdbId ||
        lastWatchedTmdbId ||
        hardcodedTmdbIds[Math.floor(Math.random() * hardcodedTmdbIds.length)];

      const recommendedUrl = `${env.TMDB_BASE_API_URL}/movie/${movieId}/recommendations`;

      const results = await axios.get<ITmdbTrendingResponse>(recommendedUrl, {
        headers: {
          Authorization: `Bearer ${env.TMDB_API_ACCESS_TOKEN}`,
        },
        params: {
          page: paginationOptions.page,
          language: 'en-US',
        },
      });

      const normalized = await this.normalizeTmdbMoviesWithLocalData(
        results.data.results,
        userId.toString(),
      );

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

  async getPopular(
    paginationOptions: Partial<IPaginationOptions>,
    userId?: string | undefined,
  ): Promise<IPaginatedResponse<ITmdbListMovie>> {
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
      const normalized = await this.normalizeTmdbMoviesWithLocalData(results.data.results, userId);

      logger.info(`[MovieService] Fetched and normalized popular movies from TMDB API.`);
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

  /**
   * Read the curated CSV and return the ordered list. If movies exist locally they are enriched
   * with user state flags and DB data; otherwise a lightweight record from the CSV is returned.
   */
  async getCuratedList(
    paginationOptions: IPaginationOptions,
    filterOptions: MovieFilterOptions,
    userId?: string | undefined,
  ) {
    const result = await this._movieRepository.findAll(paginationOptions, filterOptions);

    result.data = (await this.addUserMovieState(userId, result.data, true)) as IMovie[];
    return result;
  }

  async addToWatchlist(userId: Types.ObjectId, tmdbId: number) {
    let movie = await this._movieRepository.findByTmdbId(tmdbId);
    if (!movie) {
      await this.completeMovieData(tmdbId);

      movie = await this._movieRepository.findByTmdbId(tmdbId);
      if (!movie) throw new NotFoundError('Movie not found');
    }
    const interaction = await this._movieInteractionRepository.addToWatchlist(userId, movie._id);
    return interaction.toObject();
  }

  async completeMovieData(tmdbId: number) {
    try {
      const imdbId = await getImdbIdFromTmdbId(tmdbId);
      if (!imdbId) {
        logger.error(`[MovieService] No IMDb ID found for TMDb ID "${tmdbId}".`);
        return null;
      }

      // If movie already exists, return it (avoid extra network calls and double-creation)
      const movieExists = await this._movieRepository.findByImdbId(imdbId);
      if (movieExists) return movieExists.toObject();

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

      const movieData: IMovie = {
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
        cast: metadata.cast || [],
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

  async searchExternal(
    paginationOptions: IPaginationOptions,
    filterOptions: MovieFilterOptions,
    userId?: string | undefined,
  ) {
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

    results.data = (await this.addUserMovieState(userId, results.data, true)) as IMovie[];

    return results;
  }

  private async normalizeTmdbMoviesWithLocalData(
    tmdbMovies: ITmdbTrendingMovie[],
    userId?: string | undefined,
  ): Promise<ITmdbListMovie[]> {
    const tmdbIds = tmdbMovies.map((m) => m.id);
    const localMovies = await this._movieRepository.findByTmdbIds(tmdbIds);
    const localMoviesWithState = await this.addUserMovieState(
      userId,
      localMovies.map((m) => m.toObject()),
      true,
    );

    const localTmdbIds = new Set(localMovies.map((m) => m.tmdbId));

    return tmdbMovies.map((m: ITmdbTrendingMovie) => {
      const isLocal = localTmdbIds.has(m.id);
      let localMovie: IMovie | undefined = undefined;

      if (isLocal) {
        localMovie = (localMoviesWithState as IMovie[]).find((lm) => lm.tmdbId === m.id) as IMovie;
      }

      return {
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
        isLocal,
        inWatchlist: isLocal && localMovie ? (localMovie as IMovie).inWatchlist : false,
        isWatched: isLocal && localMovie ? (localMovie as IMovie).isWatched : false,
        userRating: isLocal && localMovie ? (localMovie as IMovie).userRating : null,
        topRank: isLocal && localMovie ? ((localMovie as IMovie).topRank ?? null) : null,
      };
    });
  }

  private async addUserMovieState(
    userId: string | undefined,
    movies: IMovie | IMovie[] | undefined,
    isArray: boolean = false,
  ): Promise<IMovie | IMovie[] | undefined> {
    if (!userId || !movies) return movies;

    const moviesArray: IMovie[] = isArray ? (movies as IMovie[]) : [movies as IMovie];

    if (moviesArray.length === 0) return movies;

    const movieIds = moviesArray.map((movie) => (movie as any)._id);

    const userMoviesInteractions = await this._movieInteractionRepository.findByUserAndMovies(
      userId,
      movieIds,
    );

    const interactionMap = new Map<string, IMovieState>();

    for (const it of userMoviesInteractions) {
      const state = interactionMap.get(it.movieId.toString()) ?? {
        isWatched: false,
        inWatchlist: false,
        userRating: null,
      };

      if (it.interactionType === 'watchlist') state.inWatchlist = true;
      if (it.interactionType === 'watched' && it.isCompleted) state.isWatched = true;
      if (it.interactionType === 'rated' && it.rating) state.userRating = it.rating;

      interactionMap.set(it.movieId.toString(), state);
    }

    const mapped: IMovie[] = moviesArray.map((movie: IMovie) => {
      const interaction = interactionMap.get((movie as any)._id.toString());

      return {
        ...movie,
        isWatched: interaction?.isWatched ?? false,
        inWatchlist: interaction?.inWatchlist ?? false,
        userRating: interaction?.userRating ?? null,
      };
    });

    return isArray ? mapped : mapped[0];
  }
}
