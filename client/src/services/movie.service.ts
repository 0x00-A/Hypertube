import { httpClient } from './http';
import type {
  ITrendingMoviesResponse,
  IRecommendedMoviesResponse,
  IMoviesResponse,
  IMovie,
  IMovieDetails,
  IMovieDetailsResponse,
} from '../types/movie.types';
import type { IMovieFilters } from '../types/movieFilter.types';

// ============================================================================
// Movie Service
// ============================================================================

class MovieService {
  private readonly BASE_PATH = '/movies';

  /**
   * Get movie details - handles both local and TMDB movies
   */
  async getMovieDetails(id: string, isTmdbMovie: boolean = true): Promise<IMovieDetails> {
    const endpoint = isTmdbMovie
      ? `${this.BASE_PATH}/tmdb/${id}`
      : `${this.BASE_PATH}/${id}`;

    const response = await httpClient.get<IMovieDetailsResponse>(endpoint);
    return response.data;
  }

  /**
   * Get trending movies from TMDB API
   */
  async getTrendingMovies(page: number = 1): Promise<ITrendingMoviesResponse> {
    const response = await httpClient.get<ITrendingMoviesResponse>(
      `${this.BASE_PATH}/trending`,
      {
        params: { page },
      }
    );
    return response;
  }

  /**
   * Get movies for the hero slider
   */
  async getSliderMovies(): Promise<IMovie[]> {
    const response = await httpClient.get<{ data: IMovie[] }>(
      `${this.BASE_PATH}/slider`
    );
    return response.data;
  }

  /**
   * Get recommended movies - handles both general recommendations and specific ones based on tmdbId
   */
  async getRecommendedMovies(page: number = 1, tmdbId?: number): Promise<IRecommendedMoviesResponse> {
    const endpoint = tmdbId
      ? `${this.BASE_PATH}/recommended/${tmdbId}`
      : `${this.BASE_PATH}/recommended`;

    const response = await httpClient.get<IRecommendedMoviesResponse>(
      endpoint,
      {
        params: { page },
      }
    );
    return response;
  }

  /**
   * Get popular movies from TMDB API
   */
  async getPopularMovies(page: number = 1): Promise<IMoviesResponse> {
    const response = await httpClient.get<IMoviesResponse>(
      `${this.BASE_PATH}/popular`,
      {
        params: { page },
      }
    );
    return response;
  }

  /**
   * Get movies by genre
   */
  async getMoviesByGenre(genre: string, page: number = 1, limit: number = 20): Promise<IMoviesResponse> {
    const response = await httpClient.get<IMoviesResponse>(
      `${this.BASE_PATH}`,
      {
        params: { genre, page, limit },
      }
    );
    return response;
  }

  /**
   * Get all movies with optional filters
   */
  async getAllMovies(filters?: IMovieFilters): Promise<IMoviesResponse> {
    const params: Record<string, string | number> = {};

    if (filters) {
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.sortOrder) params.sortOrder = filters.sortOrder;
      if (filters.genre && filters.genre !== 'All') params.genre = filters.genre;
      if (filters.minRating && filters.minRating > 0) params.minRating = filters.minRating;
      if (filters.year && filters.year > 0) params.year = filters.year;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
    }

    const response = await httpClient.get<IMoviesResponse>(
      `${this.BASE_PATH}`,
      { params }
    );
    return response;
  }
}

export const movieService = new MovieService();
