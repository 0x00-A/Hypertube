import { httpClient } from "./http";
import type { IResponse, IMovieInteraction } from "../types/movie.types";

class MovieInteractionService {
  private readonly BASE_PATH = "/interactions";

  /**
   * Rate a movie
   * @param movieId The local movie ID (ObjectId)
   * @param rating Rating value (1-10)
   */
  async rateMovie(
    movieId: string,
    rating: number,
  ): Promise<{ rating: number }> {
    const response = await httpClient.post<IResponse<{ rating: number }>>(
      `${this.BASE_PATH}/movies/${movieId}/rating`,
      { rating },
    );
    return response.data;
  }

  /**
   * Get user rating for a movie
   * @param movieId The local movie ID (ObjectId)
   */
  async getUserRating(movieId: string): Promise<{ rating: number | null }> {
    const response = await httpClient.get<IResponse<{ rating: number | null }>>(
      `${this.BASE_PATH}/movies/${movieId}/rating`,
    );
    return response.data;
  }

  /**
   * Update watch progress for a movie
   */
  async updateWatchProgress(
    movieId: string,
    lastWatchedPosition: number,
    duration: number,
  ): Promise<IMovieInteraction> {
    const response = await httpClient.post<IResponse<IMovieInteraction>>(
      `${this.BASE_PATH}/movies/${movieId}/progress`,
      { lastWatchedPosition, duration },
    );
    return response.data;
  }

  /**
   * Get watch progress for a movie
   */
  async getWatchProgress(movieId: string): Promise<IMovieInteraction | null> {
    try {
      const response = await httpClient.get<IResponse<IMovieInteraction>>(
        `${this.BASE_PATH}/movies/${movieId}/progress`,
      );
      return response.data;
    } catch {
      return null;
    }
  }
}

export const movieInteractionService = new MovieInteractionService();
