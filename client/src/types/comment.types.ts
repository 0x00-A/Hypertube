export interface IComment {
    _id: string;
    user: {
        _id: string;
        username: string;
        avatarUrl?: string;
    };
    tmdbId: number;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface ICommentsResponse {
    data: IComment[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export interface ICreateCommentDTO {
    content: string;
    tmdbId: number;
}

export interface IUpdateCommentDTO {
    content: string;
}

export interface ICommentResponse {
    data: IComment;
    message?: string;
}
