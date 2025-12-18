import { httpClient } from './http';
import type {
  ITrendingMoviesResponse,
  IRecommendedMoviesResponse,
  IMoviesResponse,
} from '../types/movie.types';

// ============================================================================
// Movie Service
// ============================================================================

class MovieService {
  private readonly BASE_PATH = '/movies';

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
   * Get recommended movies (currently returns recommendations based on hardcoded movies)
   */
  async getRecommendedMovies(page: number = 1): Promise<IRecommendedMoviesResponse> {
    const response = await httpClient.get<IRecommendedMoviesResponse>(
      `${this.BASE_PATH}/recommended`,
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
}

export const movieService = new MovieService();
