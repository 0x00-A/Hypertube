import mongoose, { Schema } from 'mongoose';
import { IMovieInteractionDocument } from './movieInteraction.model.types';

const movieInteractionSchema = new Schema<IMovieInteractionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    movieId: {
      type: Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true,
    },
    interactionType: {
      type: String,
      enum: ['watched', 'rated', 'watchlist', 'downloaded'],
      required: true,
    },
    lastWatchedPosition: {
      type: Number,
      min: 0,
      default: 0,
    },
    duration: {
      type: Number,
      min: 0,
    },
    watchProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: 1,
      max: 10,
    },
    watchedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient user-movie queries
movieInteractionSchema.index({ userId: 1, movieId: 1, interactionType: 1 });

// Calculate watch progress before saving
movieInteractionSchema.pre('save', function (next) {
  if (this.lastWatchedPosition && this.duration && this.duration > 0) {
    this.watchProgress = Math.min(100, (this.lastWatchedPosition / this.duration) * 100);
    this.isCompleted = this.watchProgress >= 95;

    if (this.isCompleted && !this.completedAt) {
      this.completedAt = new Date();
    }
  }
  next();
});

export const MovieInteractionModel = mongoose.model<IMovieInteractionDocument>(
  'MovieInteraction',
  movieInteractionSchema,
);
