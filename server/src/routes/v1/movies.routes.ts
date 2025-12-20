import { Router } from 'express';
import { MovieController } from '../../controllers/movie.controller';
import { validate } from '../../middleware/validate';
import {
  MovieListQuerySchema,
  MovieIdParamSchema,
  MovieSearchQuerySchema,
  TmdbIdParamSchema,
  MoviePageQuerySchema,
} from '../../validators/movie.schema';
import { auth } from '../../middleware/auth';

export const createMovieRouter = (movieController: MovieController): Router => {
  const router = Router();

  router.get('/', validate(MovieListQuerySchema), movieController.listMovies.bind(movieController));

  router.get(
    '/trending',
    validate(MoviePageQuerySchema),
    movieController.getTrendingMovies.bind(movieController),
  );

  router.get(
    '/popular',
    validate(MoviePageQuerySchema),
    movieController.getPopularMovies.bind(movieController),
  );

  router.use(auth);

  router.get(
    '/search',
    validate(MovieSearchQuerySchema),
    movieController.searchExternalMovies.bind(movieController),
  );

  router.get(
    '/recommended',
    validate(MoviePageQuerySchema),
    movieController.getRecommendedMovies.bind(movieController),
  );

  router.get('/:id', validate(MovieIdParamSchema), movieController.getMovie.bind(movieController));

  router.get(
    '/tmdb/:tmdbId',
    validate(TmdbIdParamSchema),
    movieController.getMovieByTmdbId.bind(movieController),
  );

  return router;
};
