import { MovieInteractionRepository } from '../repositories/movieInteraction.repository';
import { MovieService } from './movie.service';
import { Types } from 'mongoose';
import {
  IMovieInteraction,
  IUpdateWatchProgress,
  IMovieInteractionStats,
  IContinueWatchingItem,
} from '../interfaces/movieInteraction.interface';
import { BadRequestError, NotFoundError } from '../core/errors/customErrors';
import { IMovie } from '../interfaces/movie.interface';
import {
  IPaginatedResponse,
  IPaginationOptions,
  MovieFilterOptions,
} from '../core/interfaces/IPagination';

export class MovieInteractionService {
  private _repository: MovieInteractionRepository;
  private _movieService: MovieService;

  constructor(repository: MovieInteractionRepository, movieService: MovieService) {
    this._repository = repository;
    this._movieService = movieService;
  }

  async updateWatchProgress(
    userId: Types.ObjectId,
    movieId: Types.ObjectId,
    progressData: IUpdateWatchProgress,
  ): Promise<IMovieInteraction> {
    if (progressData.lastWatchedPosition < 0) {
      throw new BadRequestError('Watch position cannot be negative');
    }

    if (progressData.duration <= 0) {
      throw new BadRequestError('Duration must be greater than 0');
    }

    if (progressData.lastWatchedPosition > progressData.duration) {
      throw new BadRequestError('Watch position cannot exceed duration');
    }

    const interaction = await this._repository.upsertWatchProgress(userId, movieId, progressData);
    return interaction.toObject();
  }

  async rateMovie(
    userId: Types.ObjectId,
    movieId: Types.ObjectId,
    rating: number,
  ): Promise<IMovieInteraction> {
    if (rating < 1 || rating > 10) {
      throw new BadRequestError('Rating must be between 1 and 10');
    }

    const interaction = await this._repository.upsertRating(userId, movieId, rating);
    return interaction.toObject();
  }

  async addToWatchlist(
    userId: Types.ObjectId,
    movieId: Types.ObjectId,
  ): Promise<IMovieInteraction> {
    const interaction = await this._repository.addToWatchlist(userId, movieId);
    return interaction.toObject();
  }

  async removeFromWatchlist(userId: Types.ObjectId, movieId: Types.ObjectId): Promise<void> {
    const deleted = await this._repository.removeFromWatchlist(userId, movieId);
    if (!deleted) {
      throw new NotFoundError('Movie not found in watchlist');
    }
  }

  async getWatchHistory(
    userId: Types.ObjectId,
    paginationOptions: IPaginationOptions,
    filterOptions: MovieFilterOptions,
  ): Promise<IPaginatedResponse<IMovie>> {
    const history = await this._repository.getUserWatchHistory(
      userId,
      paginationOptions,
      filterOptions,
    );

    if (history.data && history.data.length > 0) {
      const moviesWithState = await this._movieService.applyUserMovieState(
        userId.toString(),
        history.data,
        true,
      );
      history.data = moviesWithState as IMovie[];
    }

    return history;
  }

  async getWatchlist(
    userId: Types.ObjectId,
    paginationOptions: IPaginationOptions,
    filterOptions: MovieFilterOptions,
  ): Promise<IPaginatedResponse<IMovie>> {
    const watchlist = await this._repository.getUserWatchlist(
      userId,
      paginationOptions,
      filterOptions,
    );

    if (watchlist.data && watchlist.data.length > 0) {
      const moviesWithState = await this._movieService.applyUserMovieState(
        userId.toString(),
        watchlist.data,
        true,
      );
      watchlist.data = moviesWithState as IMovie[];
    }

    return watchlist;
  }

  async getContinueWatching(userId: Types.ObjectId, limit = 10): Promise<IContinueWatchingItem[]> {
    const continueWatching = await this._repository.getUserContinueWatching(userId, limit);
    return continueWatching;
  }

  async getMovieStats(movieId: Types.ObjectId): Promise<IMovieInteractionStats> {
    return await this._repository.getMovieStats(movieId);
  }

  async getUserStats(userId: Types.ObjectId): Promise<IMovieInteractionStats> {
    return await this._repository.getUserStats(userId);
  }

  async getWatchProgress(
    userId: Types.ObjectId,
    movieId: Types.ObjectId,
  ): Promise<IMovieInteraction | null> {
    const interaction = await this._repository.findByUserAndMovie(userId, movieId, 'watched');
    return interaction ? interaction.toObject() : null;
  }

  async getUserRating(userId: Types.ObjectId, movieId: Types.ObjectId): Promise<number | null> {
    const interaction = await this._repository.findByUserAndMovie(userId, movieId, 'rated');
    return interaction?.rating || null;
  }
}
