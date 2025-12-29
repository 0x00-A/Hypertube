import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentService } from '../services/comment.service';
import { queryKeys } from '../config/queryClient';
import type { ApiError } from '../types/api.types';
import toast from 'react-hot-toast';

interface DeleteCommentVariables {
    id: string;
    tmdbId: number;
}

export const useDeleteComment = () => {
    const queryClient = useQueryClient();

    return useMutation<void, ApiError, DeleteCommentVariables>({
        mutationFn: ({ id }: DeleteCommentVariables) => commentService.deleteComment(id),
        onSuccess: (_, variables) => {
            // Invalidate and refetch comments for this movie
            queryClient.invalidateQueries({
                queryKey: queryKeys.comments.byMovie(variables.tmdbId),
            });
        },
        onError: (error: ApiError) => {
            toast.error(error.message || 'Failed to delete comment');
        },
    });
};
