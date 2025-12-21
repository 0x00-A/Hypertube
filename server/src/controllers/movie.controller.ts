import { Request, Response } from 'express';
import { MovieService } from '../services/movie.service';
import {
  IPaginatedResponse,
  IPaginationOptions,
  MovieFilterOptions,
} from '../core/interfaces/IPagination';
import { NotFoundError } from '../core/errors/customErrors';
import { asyncHandler } from '../utils/asyncHandler';
import { IMovie, ITmdbListMovie } from '../interfaces/movie.interface';
import { IResponse } from '../core/interfaces/IResponse';
import { Types } from 'mongoose';

export class MovieController {
  private _movieService: MovieService;

  constructor(movieService: MovieService) {
    this._movieService = movieService;
  }

  listMovies = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const query = req.validated?.query as IPaginationOptions & MovieFilterOptions;

    const paginationOptions: IPaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 20,
      sortBy: query.sortBy || 'lastUpdated',
      sortOrder: query.sortOrder || 'desc',
    };

    const filterOptions: MovieFilterOptions = {
      search: query.search,
      genre: query.genre,
      minRating: query.minRating,
      year: query.year,
    };

    const result = await this._movieService.list(paginationOptions, filterOptions, userId);

    const response: IPaginatedResponse<IMovie> = {
      ...result,
      message: 'Movies fetched successfully.',
    };

    res.json(response);
  });

  getMovie = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const movie = await this._movieService.get(req.params.id, userId);

    if (!movie) {
      throw new NotFoundError('Movie not found');
    }

    const response: IResponse<IMovie> = {
      data: movie,
      message: 'Movie fetched successfully.',
    };

    res.json(response);
  });

  getRandomMovie = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const movie = await this._movieService.getRandom(userId);

    if (!movie) {
      throw new NotFoundError('No movie found');
    }

    const response: IResponse<IMovie> = {
      data: movie,
      message: 'Random movie fetched successfully.',
    };
    res.json(response);
  });

  getMovieByTmdbId = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { tmdbId } = req.validated?.params as { tmdbId: number };
    const movie = await this._movieService.getByTmdbId(tmdbId, userId);

    if (!movie) {
      throw new NotFoundError('Movie not found');
    }

    const response: IResponse<IMovie> = {
      data: movie,
      message: 'Movie fetched successfully.',
    };

    res.json(response);
  });

  getTrendingMovies = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const query = req.validated?.query as Partial<IPaginationOptions>;
    const paginationOptions: Partial<IPaginationOptions> = {
      page: query.page || 1,
    };

    const result = await this._movieService.getTrending(paginationOptions, userId);

    const response: IPaginatedResponse<ITmdbListMovie> = {
      ...result,
      message: 'Trending movies fetched successfully.',
    };

    res.json(response);
  });

  getRecommendedMovies = asyncHandler(async (req: Request, res: Response) => {
    const userId = new Types.ObjectId(req.user?._id);
    const { page } = req.validated?.query as { page?: number };
    const { tmdbId } = (req.validated?.params ?? {}) as { tmdbId?: number | undefined };

    const paginationOptions: Partial<IPaginationOptions> = {
      page: page || 1,
    };

    const result = await this._movieService.getRecommended(paginationOptions, tmdbId, userId);

    const response: IPaginatedResponse<ITmdbListMovie> = {
      ...result,
      message: 'Recommended movies fetched successfully.',
    };

    res.json(response);
  });

  getPopularMovies = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const query = req.validated?.query as Partial<IPaginationOptions>;
    const paginationOptions: Partial<IPaginationOptions> = {
      page: query.page || 1,
    };

    const result = await this._movieService.getPopular(paginationOptions, userId);

    const response: IPaginatedResponse<ITmdbListMovie> = {
      ...result,
      message: 'Popular movies fetched successfully.',
    };

    res.json(response);
  });

  searchExternalMovies = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const query = req.validated?.query as IPaginationOptions & MovieFilterOptions;

    const paginationOptions: IPaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 20,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder || 'desc',
    };

    const filterOptions: MovieFilterOptions = {
      search: query.search,
      genre: query.genre,
      minRating: query.minRating,
      year: query.year,
    };

    const results = await this._movieService.searchExternal(
      paginationOptions,
      filterOptions,
      userId,
    );

    const response: IPaginatedResponse<IMovie> = {
      ...results,
      message: 'External movies fetched successfully.',
    };

    res.json(response);
  });

  addToWatchlist = asyncHandler(async (req: Request, res: Response) => {
    const userId = new Types.ObjectId(req.user?._id);
    const { tmdbId } = req.validated?.params as { tmdbId: number };

    const interaction = await this._movieService.addToWatchlist(userId, tmdbId);

    const response: IResponse<typeof interaction> = {
      data: interaction,
      message: 'Movie added to watchlist.',
    };
    res.status(201).json(response);
  });

  getCuratedMovies = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const query = req.validated?.query as Partial<IPaginationOptions & MovieFilterOptions>;

    const paginationOptions: IPaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 20,
      sortBy: query.sortBy || 'topRank',
      sortOrder: query.sortOrder || 'asc',
    };
    const filterOptions: MovieFilterOptions = {
      search: query.search,
      genre: query.genre,
      minRating: query.minRating,
      year: query.year,
      topRanked: true,
    };

    const results = await this._movieService.getCuratedList(
      paginationOptions,
      filterOptions,
      userId,
    );

    const response: IResponse<unknown[]> = {
      ...results,
      message: 'Curated movies fetched successfully.',
    };

    res.json(response);
  });
}
