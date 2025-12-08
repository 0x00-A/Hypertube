import { Router } from 'express';
import { MovieController } from '../../controllers/movie.controller';
import { validate } from '../../middleware/validate';
import { MovieListQuerySchema, MovieIdParamSchema } from '../../validators/movie.schema';

export const createMovieRouter = (movieController: MovieController): Router => {
  const router = Router();

  // /v1/movies GET
  router.get('/', validate(MovieListQuerySchema), movieController.listMovies.bind(movieController));

  // /v1/movies/{id} GET
  router.get('/:id', validate(MovieIdParamSchema), movieController.getMovie.bind(movieController));

  return router;
};
