export interface IComment {
  id: string;
  userId: string;
  movieId: string;
  content: string;
  createdAt?: Date;
}

export interface ICreateCommentDTO extends Omit<IComment, 'id' | 'createdAt'> {}

export interface IUpdateCommentDTO extends Partial<ICreateCommentDTO> {}
