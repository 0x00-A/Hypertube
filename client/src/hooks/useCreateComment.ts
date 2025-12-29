import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentService } from '../services/comment.service';
import { queryKeys } from '../config/queryClient';
import type { ICreateCommentDTO, ICommentResponse } from '../types/comment.types';
import type { ApiError } from '../types/api.types';
import toast from 'react-hot-toast';

export const useCreateComment = () => {
    const queryClient = useQueryClient();

    return useMutation<ICommentResponse, ApiError, ICreateCommentDTO>({
        mutationFn: (data: ICreateCommentDTO) => commentService.createComment(data),
        onSuccess: (_, variables) => {
            // Invalidate and refetch comments for this movie
            queryClient.invalidateQueries({
                queryKey: queryKeys.comments.byMovie(variables.tmdbId),
            });
        },
        onError: (error: ApiError) => {
            toast.error(error.message || 'Failed to create comment');
        },
    });
};
