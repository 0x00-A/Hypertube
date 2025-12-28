import { httpClient } from './http';
import type { ICommentsResponse, ICreateCommentDTO, ICommentResponse } from '../types/comment.types';

export const commentService = {
    getMovieComments: async (
        tmdbId: number,
        page: number = 1,
        limit: number = 20,
        sortBy: string = 'createdAt',
        sortOrder: 'asc' | 'desc' = 'desc'
    ): Promise<ICommentsResponse> => {
        const response = await httpClient.get<ICommentsResponse>(`/comments/movie/${tmdbId}`, {
            params: { page, limit, sortBy, sortOrder }
        });
        return response;
    },

    createComment: async (data: ICreateCommentDTO): Promise<ICommentResponse> => {
        const response = await httpClient.post<ICommentResponse>('/comments', data);
        return response;
    },

    updateComment: async (id: string, content: string): Promise<ICommentResponse> => {
        const response = await httpClient.patch<ICommentResponse>(`/comments/${id}`, { content });
        return response;
    },

    deleteComment: async (id: string): Promise<void> => {
        await httpClient.delete(`/comments/${id}`);
    },
};
