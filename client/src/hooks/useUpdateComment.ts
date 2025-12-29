import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentService } from '../services/comment.service';
import { queryKeys } from '../config/queryClient';
import type { ICommentResponse } from '../types/comment.types';
import type { ApiError } from '../types/api.types';
import toast from 'react-hot-toast';

interface UpdateCommentVariables {
    id: string;
    content: string;
    tmdbId: number;
}

export const useUpdateComment = () => {
    const queryClient = useQueryClient();

    return useMutation<ICommentResponse, ApiError, UpdateCommentVariables>({
        mutationFn: ({ id, content }: UpdateCommentVariables) =>
            commentService.updateComment(id, content),
        onSuccess: (_, variables) => {
            // Invalidate and refetch comments for this movie
            queryClient.invalidateQueries({
                queryKey: queryKeys.comments.byMovie(variables.tmdbId),
            });
        },
        onError: (error: ApiError) => {
            toast.error(error.message || 'Failed to update comment');
        },
    });
};
