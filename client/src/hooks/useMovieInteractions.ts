import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movieService } from '../services/movie.service';
import { queryKeys } from '../config/queryClient';
import toast from 'react-hot-toast';
import type { IMovieInteraction } from '../types/movie.types';
import type { ApiError } from '../types/api.types';


export const useAddToWatchlist = () => {
    const queryClient = useQueryClient();

    return useMutation<
        IMovieInteraction,
        ApiError,
        { id: string | number; isTmdbMovie: boolean }
    >({
        mutationFn: async ({ id, isTmdbMovie }) => {
            if (!id) throw new Error('Movie ID is required');
            return movieService.addToWatchlist(id, isTmdbMovie);
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: queryKeys.movies.lists() });
            // For now, simple invalidation is safer but we'll try a basic optimistic update for immediate UI feedback if possible.
        },
        onSuccess: (data: IMovieInteraction) => {
            toast.success('Added to watchlist');
            // Invalidate relevant queries to refetch fresh data
            queryClient.invalidateQueries({ queryKey: queryKeys.movies.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
            if (data && data.movieId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.movies.detail(data.movieId) });
            }
        },
        onError: (error: ApiError) => {
            toast.error(error.message || 'Failed to add to watchlist');
        },
    });
};

export const useRemoveFromWatchlist = () => {
    const queryClient = useQueryClient();

    return useMutation<{ message?: string }, ApiError, string>({
        mutationFn: (movieId: string) => movieService.removeFromWatchlist(movieId),
        onSuccess: (_, movieId) => {
            toast.success('Removed from watchlist');
            queryClient.invalidateQueries({ queryKey: queryKeys.movies.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.movies.detail(movieId) });
        },
        onError: (error: ApiError) => {
            toast.error(error.message || 'Failed to remove from watchlist');
        },
    });
};
