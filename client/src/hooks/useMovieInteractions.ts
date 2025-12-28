import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movieService } from '../services/movie.service';
import { queryKeys } from '../config/queryClient';
import toast from 'react-hot-toast';
import type { IMovieInteraction } from '../types/movie.types';


export const useAddToWatchlist = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            isTmdbMovie,
        }: {
            id: string | number;
            isTmdbMovie: boolean;
        }) => {
            if (!id && id !== 0) throw new Error('Movie ID is required');
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
            if (data && data.movieId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.movies.detail(data.movieId) });
            }
        },
        onError: () => {
            toast.error('Failed to add to watchlist');
        },
    });
};

export const useRemoveFromWatchlist = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (movieId: string) => movieService.removeFromWatchlist(movieId),
        onSuccess: (_, movieId) => {
            toast.success('Removed from watchlist');
            queryClient.invalidateQueries({ queryKey: queryKeys.movies.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.movies.detail(movieId) });
        },
        onError: () => {
            toast.error('Failed to remove from watchlist');
        },
    });
};
