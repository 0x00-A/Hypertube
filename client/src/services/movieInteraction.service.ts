import { httpClient } from './http';
import type { IResponse } from '../types/movie.types';

class MovieInteractionService {
    private readonly BASE_PATH = '/interactions';

    /**
     * Rate a movie
     * @param movieId The local movie ID (ObjectId)
     * @param rating Rating value (1-10)
     */
    async rateMovie(movieId: string, rating: number): Promise<IResponse<{ movieId: string }>> {
        const response = await httpClient.post<IResponse<{ movieId: string }>>(
            `${this.BASE_PATH}/movies/${movieId}/rating`,
            { rating }
        );
        return response.data;
    }

    /**
     * Get user rating for a movie
     * @param movieId The local movie ID (ObjectId)
     */
    async getUserRating(movieId: string): Promise<{ rating: number | null }> {
        const response = await httpClient.get<IResponse<{ rating: number | null }>>(
            `${this.BASE_PATH}/movies/${movieId}/rating`
        );
        return response.data;
    }
}

export const movieInteractionService = new MovieInteractionService();
