import { Request, Response, NextFunction } from 'express';
import { MovieService } from '../services/movie.service';

export class MovieController {
  private _movieService: MovieService;

  constructor(movieService: MovieService) {
    this._movieService = movieService;
  }

  async listMovies(req: Request, res: Response, next: NextFunction) {
    try {
    } catch (err) {
      next(err);
    }
  }

  async getMovie(req: Request, res: Response, next: NextFunction) {
    try {
      const movie = await this._movieService.get(req.params.id);
      if (!movie) return res.status(404).json({ message: 'Not found' });
      res.json(movie);
    } catch (err) {
      next(err);
    }
  }
}
