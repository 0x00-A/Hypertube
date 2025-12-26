import { useQuery } from '@tanstack/react-query';
import { movieInteractionService } from '../services/movieInteraction.service';
import { queryKeys } from '../config/queryClient';

export const useUserRating = (movieId: string) => {
    return useQuery({
        queryKey: [...queryKeys.movies.all, 'user-rating', movieId],
        queryFn: async () => {
            const data = await movieInteractionService.getUserRating(movieId!);
            return data.rating;
        },
        enabled: !!movieId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
