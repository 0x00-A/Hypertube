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

export const createMovieRouter = (movieController: MovieController): Router => {
  const router = Router();

  // /v1/movies GET
  router.get('/', validate(MovieListQuerySchema), movieController.listMovies.bind(movieController));

  // /v1/movies/search GET
  router.get(
    '/search',
    validate(MovieSearchQuerySchema),
    movieController.searchExternalMovies.bind(movieController),
  );

  // /v1/movies/trending

  router.get(
    '/trending',
    validate(MoviePageQuerySchema),
    movieController.getTrendingMovies.bind(movieController),
  );

  // /v1/movies/recommended GET
  router.get(
    '/recommended',
    validate(MoviePageQuerySchema),
    movieController.getRecommendedMovies.bind(movieController),
  );

  // /v1/movies/popular GET
  router.get(
    '/popular',
    validate(MoviePageQuerySchema),
    movieController.getPopularMovies.bind(movieController),
  );

  // /v1/movies/{id} GET
  router.get('/:id', validate(MovieIdParamSchema), movieController.getMovie.bind(movieController));

  // /v1/movies/tmdb/:tmdbId GET
  router.get(
    '/tmdb/:tmdbId',
    validate(TmdbIdParamSchema),
    movieController.getMovieByTmdbId.bind(movieController),
  );
  return router;
};
