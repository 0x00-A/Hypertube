import { useQuery } from '@tanstack/react-query';
import { movieService } from '../services/movie.service';
import { queryKeys } from '../config/queryClient';
import type { IRecommendedMoviesResponse } from '../types/movie.types';

interface UseRecommendedMoviesOptions {
    tmdbId?: number | null;
    page?: number;
    enabled?: boolean;
}

export const useRecommendedMovies = ({ tmdbId, page = 1, enabled = true }: UseRecommendedMoviesOptions = {}) => {
    return useQuery<IRecommendedMoviesResponse, Error>({
        queryKey: queryKeys.movies.recommended(tmdbId ?? undefined),
        queryFn: () => movieService.getRecommendedMovies(page, tmdbId ?? undefined),
        enabled: enabled && !!tmdbId,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};
