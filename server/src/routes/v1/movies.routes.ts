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
import { auth, optionalAuth } from '../../middleware/auth';

export const createMovieRouter = (movieController: MovieController): Router => {
  const router = Router();

  // Public/optional auth routes
  router.get(
    '/',
    optionalAuth,
    validate(MovieListQuerySchema),
    movieController.listMovies.bind(movieController),
  );

  router.get(
    '/trending',
    optionalAuth,
    validate(MoviePageQuerySchema),
    movieController.getTrendingMovies.bind(movieController),
  );

  router.get(
    '/popular',
    optionalAuth,
    validate(MoviePageQuerySchema),
    movieController.getPopularMovies.bind(movieController),
  );

  router.get(
    '/search',
    optionalAuth,
    validate(MovieSearchQuerySchema),
    movieController.searchExternalMovies.bind(movieController),
  );

  router.get(
    '/tmdb/:tmdbId',
    optionalAuth,
    validate(TmdbIdParamSchema),
    movieController.getMovieByTmdbId.bind(movieController),
  );

  router.get(
    '/:id',
    optionalAuth,
    validate(MovieIdParamSchema),
    movieController.getMovie.bind(movieController),
  );

  // Protected routes (auth required)
  router.get(
    '/recommended',
    auth,
    validate(MoviePageQuerySchema),
    movieController.getRecommendedMovies.bind(movieController),
  );

  router.post(
    '/watchlist/:tmdbId',
    auth,
    validate(TmdbIdParamSchema),
    movieController.addToWatchlist.bind(movieController),
  );

  return router;
};
