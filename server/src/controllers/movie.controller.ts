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
      limit: query.limit || 10,
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
}
