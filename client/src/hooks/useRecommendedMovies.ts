import { useQuery } from '@tanstack/react-query';
import { movieService } from '../services/movie.service';
import { queryKeys } from '../config/queryClient';
import type { IMoviesResponse } from '../types/movie.types';
import type { ApiError } from '../types/api.types';

interface UseRecommendedMoviesOptions {
    tmdbId?: number | null;
    page?: number;
    enabled?: boolean;
}

export const useRecommendedMovies = ({ tmdbId, page = 1, enabled = true }: UseRecommendedMoviesOptions = {}) => {
    return useQuery<IMoviesResponse, ApiError>({
        queryKey: queryKeys.movies.recommended(tmdbId ?? undefined),
        queryFn: () => movieService.getRecommendedMovies(page, tmdbId ?? undefined),
        enabled: enabled && !!tmdbId,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};
