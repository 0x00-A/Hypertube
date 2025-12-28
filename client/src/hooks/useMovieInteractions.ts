import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movieService } from '../services/movie.service';
import { queryKeys } from '../config/queryClient';
import toast from 'react-hot-toast';
import type { IMovieInteraction, IMovie } from '../types/movie.types';
import { useAppDispatch } from '../redux/hooks';
import { updateMovieWatchlist } from '../redux/slices/moviesSlice';

interface WatchlistMutationParams {
    id: string | number;
    isTmdbMovie: boolean;
}

export const useAddToWatchlist = () => {
    const queryClient = useQueryClient();
    const dispatch = useAppDispatch();

    return useMutation({
        mutationFn: async ({
            id,
            isTmdbMovie,
        }: WatchlistMutationParams) => {
            if (!id && id !== 0) throw new Error('Movie ID is required');
            return movieService.addToWatchlist(id, isTmdbMovie);
        },
        onMutate: async ({ id }) => {
            // Optimistic Update Redux
            dispatch(updateMovieWatchlist({ id, inWatchlist: true }));

            // Optimistic Update React Query Details
            const detailsKey = queryKeys.movies.detail(String(id));
            await queryClient.cancelQueries({ queryKey: detailsKey });
            const previousDetails = queryClient.getQueryData<IMovie>(detailsKey);
            if (previousDetails) {
                queryClient.setQueryData(detailsKey, { ...previousDetails, inWatchlist: true });
            }

            return { previousDetails, id };
        },
        onSuccess: (data: IMovieInteraction) => {
            toast.success('Added to watchlist');
            queryClient.invalidateQueries({ queryKey: queryKeys.movies.all });
            if (data && data.movieId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.movies.detail(data.movieId) });
            }
        },
        onError: (err, { id }, context) => {
            toast.error('Failed to add to watchlist');
            // Revert Redux
            dispatch(updateMovieWatchlist({ id, inWatchlist: false }));
            // Revert React Query
            if (context?.previousDetails) {
                queryClient.setQueryData(queryKeys.movies.detail(String(id)), context.previousDetails);
            }
        },
    });
};

export const useRemoveFromWatchlist = () => {
    const queryClient = useQueryClient();
    const dispatch = useAppDispatch();

    return useMutation({
        mutationFn: (movieId: string) => movieService.removeFromWatchlist(movieId),
        onMutate: async (movieId) => {
            // Optimistic Update Redux
            dispatch(updateMovieWatchlist({ id: movieId, inWatchlist: false }));

            // Optimistic Update React Query Details
            const detailsKey = queryKeys.movies.detail(movieId);
            await queryClient.cancelQueries({ queryKey: detailsKey });
            const previousDetails = queryClient.getQueryData<IMovie>(detailsKey);
            if (previousDetails) {
                queryClient.setQueryData(detailsKey, { ...previousDetails, inWatchlist: false });
            }

            return { previousDetails, movieId };
        },
        onSuccess: (_, movieId) => {
            toast.success('Removed from watchlist');
            queryClient.invalidateQueries({ queryKey: queryKeys.movies.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.movies.detail(movieId) });
        },
        onError: (err, movieId, context) => {
            toast.error('Failed to remove from watchlist');
            // Revert Redux
            dispatch(updateMovieWatchlist({ id: movieId, inWatchlist: true }));
            // Revert React Query
            if (context?.previousDetails) {
                queryClient.setQueryData(queryKeys.movies.detail(movieId), context.previousDetails);
            }
        },
    });
};
