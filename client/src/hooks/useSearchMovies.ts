import { useQuery } from '@tanstack/react-query';
import { movieService } from '../services/movie.service';
import { queryKeys } from '../config/queryClient';
import type { IMoviesResponse } from '../types/movie.types';
import type { ApiError } from '../types/api.types';

/**
 * Hook to search movies using React Query
 * @param query - Search query string
 * @returns React Query result with search results
 */
export const useSearchMovies = (query: string) => {
    return useQuery<IMoviesResponse, ApiError>({
        queryKey: queryKeys.movies.search(query),
        queryFn: () => movieService.searchMovies(query),
        enabled: query.length >= 2, // Only search when query has at least 2 characters
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
    });
};
