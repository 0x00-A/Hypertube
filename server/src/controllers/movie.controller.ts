import { Request, Response, NextFunction } from 'express';
import { MovieService } from '../services/movie.service';

export class MovieController {
  private _movieService: MovieService;

  constructor(movieService: MovieService) {
    this._movieService = movieService;
  }

  async listMovies(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.validated?.query as {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        search?: string;
        genre?: string;
        minRating?: number;
        year?: number;
      };

      const result = await this._movieService.list({
        page: query.page || 1,
        limit: query.limit || 20,
        sortBy: query.sortBy || 'lastUpdated',
        sortOrder: query.sortOrder || 'desc',
        search: query.search,
        genre: query.genre,
        minRating: query.minRating,
        year: query.year,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getMovie(req: Request, res: Response, next: NextFunction) {
    try {
      const movie = await this._movieService.get(req.params.id);
      if (!movie) return res.status(404).json({ message: 'Movie not found' });
      res.json({ data: movie });
    } catch (err) {
      next(err);
    }
  }
}
