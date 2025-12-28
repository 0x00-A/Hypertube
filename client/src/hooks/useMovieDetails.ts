import { useQuery } from '@tanstack/react-query';
import { movieService } from '../services/movie.service';
import { queryKeys } from '../config/queryClient';
import type { IMovieDetails } from '../types/movie.types';

interface UseMovieDetailsOptions {
    id: string;
    isTmdbMovie: boolean;
}

export const useMovieDetails = ({ id, isTmdbMovie }: UseMovieDetailsOptions) => {
    return useQuery<IMovieDetails, Error>({
        queryKey: queryKeys.movies.detail(id),
        queryFn: () => movieService.getMovieDetails(id, isTmdbMovie),
        enabled: !!id,
        staleTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount, error) => {
            const status = (error as { response?: { status: number } })?.response?.status;
            if (status === 404) return false; // Don't retry 404s
            return failureCount < 2;
        },
    });
};
