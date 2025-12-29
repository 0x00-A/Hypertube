import { useQuery } from '@tanstack/react-query';
import { movieInteractionService } from '../services/movieInteraction.service';
import { queryKeys } from '../config/queryClient';
import type { ApiError } from '../types/api.types';

export const useUserRating = (movieId: string) => {
    return useQuery<number | null, ApiError>({
        queryKey: [...queryKeys.movies.all, 'user-rating', movieId],
        queryFn: async () => {
            const data = await movieInteractionService.getUserRating(movieId!);
            return data.rating;
        },
        enabled: !!movieId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
