import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movieInteractionService } from '../services/movieInteraction.service';
import { queryKeys } from '../config/queryClient';
import type { IMovieDetails } from '../types/movie.types';
import { toast } from 'react-hot-toast';

interface UseMovieRatingOptions {
    movieId: string;
}

export const useMovieRating = ({ movieId }: UseMovieRatingOptions) => {
    const queryClient = useQueryClient();
    const userRatingKey = [...queryKeys.movies.all, 'user-rating', movieId];

    return useMutation({
        mutationFn: (rating: number) => movieInteractionService.rateMovie(movieId, rating),

        // Optimistic Update
        onMutate: async (newRating) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.movies.detail(movieId) });
            await queryClient.cancelQueries({ queryKey: userRatingKey });

            // Snapshot previous values
            const previousMovieDetails = queryClient.getQueryData<IMovieDetails>(queryKeys.movies.detail(movieId));
            const previousUserRating = queryClient.getQueryData<number | null>(userRatingKey);

            // Optimistically update
            if (previousMovieDetails) {
                queryClient.setQueryData<IMovieDetails>(queryKeys.movies.detail(movieId), {
                    ...previousMovieDetails,
                    userRating: newRating,
                });
            }
            queryClient.setQueryData<number | null>(userRatingKey, newRating);

            return { previousMovieDetails, previousUserRating };
        },

        // Rolling back on error
        onError: (_err, _newRating, context) => {
            if (context?.previousMovieDetails) {
                queryClient.setQueryData(queryKeys.movies.detail(movieId), context.previousMovieDetails);
            }
            if (context?.previousUserRating !== undefined) {
                queryClient.setQueryData(userRatingKey, context.previousUserRating);
            }
            toast.error('Failed to update rating');
        },

        // Ensure data consistency after settlement
        onSettled: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.movies.detail(movieId) }),
                queryClient.invalidateQueries({ queryKey: userRatingKey }),
                queryClient.refetchQueries({ queryKey: queryKeys.movies.detail(movieId) }),
                queryClient.refetchQueries({ queryKey: userRatingKey }),
            ]);
        },

        onSuccess: () => {
            toast.success('Rating updated successfully');
        }
    });
};
