import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentService } from '../services/comment.service';
import { queryKeys } from '../config/queryClient';
import type { ICommentResponse } from '../types/comment.types';

interface UpdateCommentVariables {
    id: string;
    content: string;
    tmdbId: number;
}

export const useUpdateComment = () => {
    const queryClient = useQueryClient();

    return useMutation<ICommentResponse, Error, UpdateCommentVariables>({
        mutationFn: ({ id, content }: UpdateCommentVariables) =>
            commentService.updateComment(id, content),
        onSuccess: (_, variables) => {
            // Invalidate and refetch comments for this movie
            queryClient.invalidateQueries({
                queryKey: queryKeys.comments.byMovie(variables.tmdbId),
            });
        },
    });
};
