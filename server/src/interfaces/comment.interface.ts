export interface IComment {
  id?: string;
  userId: string;
  movieId: string;
  content: string;
  createdAt?: Date;
}
