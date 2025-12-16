import { Request, Response } from 'express';
import { IResponse } from '../core/interfaces/IResponse';
import { MovieInteractionService } from '../services/movieInteraction.service';
import { asyncHandler } from '../utils/asyncHandler';
import { Types } from 'mongoose';
import {
  IPaginatedResponse,
  IPaginationOptions,
  MovieFilterOptions,
} from '../core/interfaces/IPagination';
import { IMovie } from '../interfaces/movie.interface';

export class MovieInteractionController {
  private _service: MovieInteractionService;

  constructor(service: MovieInteractionService) {
    this._service = service;
  }

  updateWatchProgress = asyncHandler(async (req: Request, res: Response) => {
    const userId = new Types.ObjectId(req.user?._id);
    const { movieId } = req.validated?.params as { movieId: string };
    const { lastWatchedPosition, duration } = req.validated?.body as {
      lastWatchedPosition: number;
      duration: number;
    };

    const interaction = await this._service.updateWatchProgress(
      userId,
      new Types.ObjectId(movieId),
      { lastWatchedPosition, duration },
    );

    const response: IResponse<typeof interaction> = {
      data: interaction,
      message: 'Watch progress updated successfully.',
    };
    res.json(response);
  });

  rateMovie = asyncHandler(async (req: Request, res: Response) => {
    const userId = new Types.ObjectId(req.user?._id);
    const { movieId } = req.validated?.params as { movieId: string };
    const { rating } = req.validated?.body as { rating: number };

    const interaction = await this._service.rateMovie(userId, new Types.ObjectId(movieId), rating);

    const response: IResponse<typeof interaction> = {
      data: interaction,
      message: 'Movie rated successfully.',
    };
    res.json(response);
  });

  addToWatchlist = asyncHandler(async (req: Request, res: Response) => {
    const userId = new Types.ObjectId(req.user?._id);
    const { movieId } = req.validated?.params as { movieId: string };

    const interaction = await this._service.addToWatchlist(userId, new Types.ObjectId(movieId));

    const response: IResponse<typeof interaction> = {
      data: interaction,
      message: 'Movie added to watchlist.',
    };
    res.status(201).json(response);
  });

  removeFromWatchlist = asyncHandler(async (req: Request, res: Response) => {
    const userId = new Types.ObjectId(req.user?._id);
    const { movieId } = req.validated?.params as { movieId: string };

    await this._service.removeFromWatchlist(userId, new Types.ObjectId(movieId));

    const response: IResponse<null> = {
      message: 'Movie removed from watchlist.',
    };
    res.status(200).json(response);
  });

  getWatchHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = new Types.ObjectId(req.user?._id);
    const { limit } = req.validated?.query as { limit?: number };

    const history = await this._service.getWatchHistory(userId, limit);

    const response: IResponse<typeof history> = {
      data: history,
      message: 'User watch history fetched successfully.',
    };
    res.json(response);
  });

  getWatchlist = asyncHandler(async (req: Request, res: Response) => {
    const userId = new Types.ObjectId(req.user?._id);

    const query = req.validated?.query as IPaginationOptions & MovieFilterOptions;

    const paginationOptions: IPaginationOptions = {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    const filterOptions: MovieFilterOptions = {
      search: query.search,
      genre: query.genre,
      minRating: query.minRating,
      year: query.year,
    };

    const watchlist = await this._service.getWatchlist(userId, paginationOptions, filterOptions);

    const response: IPaginatedResponse<IMovie> = {
      ...watchlist,
      message: 'User watchlist fetched successfully.',
    };

    res.json(response);
  });

  getContinueWatching = asyncHandler(async (req: Request, res: Response) => {
    const userId = new Types.ObjectId(req.user?._id);
    const { limit } = req.validated?.query as { limit?: number };

    const continueWatching = await this._service.getContinueWatching(userId, limit);

    const response: IResponse<typeof continueWatching> = {
      data: continueWatching,
      message: 'Continue watching list fetched successfully.',
    };
    res.json(response);
  });

  getMovieStats = asyncHandler(async (req: Request, res: Response) => {
    const { movieId } = req.validated?.params as { movieId: string };

    const stats = await this._service.getMovieStats(new Types.ObjectId(movieId));

    const response: IResponse<typeof stats> = {
      data: stats,
      message: 'Movie statistics fetched successfully.',
    };
    res.json(response);
  });

  getUserStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = new Types.ObjectId(req.user?._id);

    const stats = await this._service.getUserStats(userId);

    const response: IResponse<typeof stats> = {
      data: stats,
      message: 'User statistics fetched successfully.',
    };
    res.json(response);
  });

  getWatchProgress = asyncHandler(async (req: Request, res: Response) => {
    const userId = new Types.ObjectId(req.user?._id);
    const { movieId } = req.validated?.params as { movieId: string };

    const progress = await this._service.getWatchProgress(userId, new Types.ObjectId(movieId));

    const response: IResponse<typeof progress> = {
      data: progress,
      message: 'Watch progress fetched successfully.',
    };
    res.json(response);
  });

  getUserRating = asyncHandler(async (req: Request, res: Response) => {
    const userId = new Types.ObjectId(req.user?._id);
    const { movieId } = req.validated?.params as { movieId: string };

    const rating = await this._service.getUserRating(userId, new Types.ObjectId(movieId));

    const response: IResponse<{ rating: typeof rating }> = {
      data: { rating },
      message: 'User rating fetched successfully.',
    };
    res.json(response);
  });
}
