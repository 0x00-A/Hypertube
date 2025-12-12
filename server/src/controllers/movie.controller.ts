import { Request, Response } from 'express';
import { MovieService } from '../services/movie.service';
import { IPaginationOptions, MovieFilterOptions } from '../core/interfaces/IPagination';
import { NotFoundError } from '../core/errors/customErrors';
import { asyncHandler } from '../utils/asyncHandler';

export class MovieController {
  private _movieService: MovieService;

  constructor(movieService: MovieService) {
    this._movieService = movieService;
  }

  listMovies = asyncHandler(async (req: Request, res: Response) => {
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

    const result = await this._movieService.list(paginationOptions, filterOptions);

    res.json(result);
  });

  getMovie = asyncHandler(async (req: Request, res: Response) => {
    const movie = await this._movieService.get(req.params.id);

    if (!movie) {
      throw new NotFoundError('Movie not found');
    }

    res.json({ data: movie });
  });

  getMovieByTmdbId = asyncHandler(async (req: Request, res: Response) => {
    const { tmdbId } = req.validated?.params as { tmdbId: number };
    const movie = await this._movieService.getByTmdbId(tmdbId);

    if (!movie) {
      throw new NotFoundError('Movie not found');
    }

    res.json({ data: movie });
  });

  getTrendingMovies = asyncHandler(async (req: Request, res: Response) => {
    const query = req.validated?.query as Partial<IPaginationOptions>;
    const paginationOptions: Partial<IPaginationOptions> = {
      page: query.page || 1,
    };
    const result = await this._movieService.getTrending(paginationOptions);

    res.json(result);
  });

  getRecommendedMovies = asyncHandler(async (req: Request, res: Response) => {
    // const userId = req.user?._id;
    const userId = 'placeholder-user-id';
    const { page } = req.validated?.query as { page?: number };

    // if (!userId) {
    //   throw new NotFoundError('User not found');
    // }

    const paginationOptions: Partial<IPaginationOptions> = {
      page: page || 1,
    };

    const result = await this._movieService.getRecommended(paginationOptions, userId);

    res.json(result);
  });

  getPopularMovies = asyncHandler(async (req: Request, res: Response) => {
    const query = req.validated?.query as Partial<IPaginationOptions>;
    const paginationOptions: Partial<IPaginationOptions> = {
      page: query.page || 1,
    };
    const result = await this._movieService.getPopular(paginationOptions);
    res.json(result);
  });

  searchExternalMovies = asyncHandler(async (req: Request, res: Response) => {
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

    const results = await this._movieService.searchExternal(paginationOptions, filterOptions);
    res.json({ data: results });
  });
}
