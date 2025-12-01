import { Request, Response, NextFunction } from 'express';
import { MovieService } from '../services/movie.service';
const service = new MovieService();

export async function listMovies(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);
    const result = await service.list(page, limit);
    res.json({
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMovie(req: Request, res: Response, next: NextFunction) {
  try {
    const movie = await service.get(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Not found' });
    res.json(movie);
  } catch (err) {
    next(err);
  }
}
