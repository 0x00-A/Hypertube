import { Types } from 'mongoose';
import type { IMovie } from './movie.interface';

export interface IMovieInteraction {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  movieId: Types.ObjectId;
  interactionType: 'watched' | 'rated' | 'watchlist' | 'downloaded';

  // Watch progress tracking
  lastWatchedPosition?: number; // in seconds
  duration?: number; // total movie duration in seconds
  watchProgress?: number; // percentage (0-100)
  isCompleted?: boolean; // true if watchProgress >= 95%

  // Rating
  rating?: number; // 1-10, only if interactionType includes 'rated'

  // Timestamps
  watchedAt?: Date; // last time user watched this movie
  completedAt?: Date; // when user finished the movie (>= 95%)
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateMovieInteraction {
  userId: Types.ObjectId;
  movieId: Types.ObjectId;
  interactionType: 'watched' | 'rated' | 'watchlist' | 'downloaded';
  lastWatchedPosition?: number;
  duration?: number;
  rating?: number;
}

export interface IUpdateWatchProgress {
  lastWatchedPosition: number;
  duration: number;
}

export interface IMovieInteractionStats {
  totalWatches: number;
  watchlistCount: number;
  averageRating?: number;
  totalRatings: number;
}

export interface IUserInteractionStats {
  totalWatches: number;
  watchlistCount: number;
  averageRating?: number;
  totalRatings: number;
}

export interface IContinueWatchingItem {
  movie: IMovie;
  watchedDuration: number;
  totalDuration: number;
  percentage: number;
  lastWatchedAt: Date | string;
}
