import { httpClient } from './http';
import type {
  IMoviesResponse,
  IMovie,
  IMovieDetails,
  IMovieDetailsResponse,
  IMovieInteraction,
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
  async getTrendingMovies(page: number = 1): Promise<IMoviesResponse> {
    const response = await httpClient.get<IMoviesResponse>(
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
  async getRecommendedMovies(page: number = 1, tmdbId?: number): Promise<IMoviesResponse> {
    const endpoint = tmdbId
      ? `${this.BASE_PATH}/recommended/${tmdbId}`
      : `${this.BASE_PATH}/recommended`;

    const response = await httpClient.get<IMoviesResponse>(
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

  /**
   * Add movie to watchlist - handles both local and TMDB movies
   */
  async addToWatchlist(id: string | number, isTmdbMovie: boolean = true): Promise<IMovieInteraction> {
    const endpoint = isTmdbMovie
      ? `${this.BASE_PATH}/watchlist/${id}`
      : `/interactions/movies/${id}/watchlist`;

    const response = await httpClient.post<{ data: IMovieInteraction }>(endpoint);
    return response.data;
  }

  /**
   * Remove movie from watchlist by Movie ID (MongoDB _id)
   */
  async removeFromWatchlist(movieId: string): Promise<{ message?: string }> {
    const response = await httpClient.delete<{ message?: string }>(
      `/interactions/movies/${movieId}/watchlist`
    );
    return response;
  }

  /**
   * Get user's watchlist with pagination and filters
   */
  async getWatchlist(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    genre?: string;
    minRating?: number;
    year?: number;
  }): Promise<IMoviesResponse> {
    const response = await httpClient.get<IMoviesResponse>(
      '/interactions/watchlist',
      { params }
    );
    return response;
  }
}

export const movieService = new MovieService();
