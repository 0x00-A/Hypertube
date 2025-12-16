import { Document, Types } from 'mongoose';

export interface IMovieInteractionDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  movieId: Types.ObjectId;
  interactionType: 'watched' | 'rated' | 'watchlist' | 'downloaded';
  lastWatchedPosition?: number;
  duration?: number;
  watchProgress?: number;
  isCompleted?: boolean;
  rating?: number;
  watchedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
