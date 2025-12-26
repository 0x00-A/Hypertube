import { useQuery } from '@tanstack/react-query';
import { commentService } from '../services/comment.service';
import { queryKeys } from '../config/queryClient';
import type { ICommentsResponse } from '../types/comment.types';

interface UseMovieCommentsOptions {
    tmdbId?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    enabled?: boolean;
}

export const useMovieComments = ({
    tmdbId,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    enabled = true,
}: UseMovieCommentsOptions = {}) => {
    return useQuery<ICommentsResponse, Error>({
        queryKey: [...queryKeys.comments.byMovie(tmdbId ?? 0), { page, sortBy, sortOrder }],
        queryFn: () => commentService.getMovieComments(tmdbId!, page, limit, sortBy, sortOrder),
        enabled: enabled && !!tmdbId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};
