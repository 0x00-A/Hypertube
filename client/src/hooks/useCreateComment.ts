import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentService } from '../services/comment.service';
import { queryKeys } from '../config/queryClient';
import type { ICreateCommentDTO, ICommentResponse } from '../types/comment.types';

export const useCreateComment = () => {
    const queryClient = useQueryClient();

    return useMutation<ICommentResponse, Error, ICreateCommentDTO>({
        mutationFn: (data: ICreateCommentDTO) => commentService.createComment(data),
        onSuccess: (_, variables) => {
            // Invalidate and refetch comments for this movie
            queryClient.invalidateQueries({
                queryKey: queryKeys.comments.byMovie(variables.tmdbId),
            });
        },
    });
};
