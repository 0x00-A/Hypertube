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

  // Curated list from scripts/movies.csv (supports optional auth)
  router.get(
    '/curated',
    optionalAuth,
    validate(MovieListQuerySchema),
    movieController.getCuratedMovies.bind(movieController),
  );

  router.get('/random', auth, movieController.getRandomMovie.bind(movieController));

  router.get(
    '/popular',
    optionalAuth,
    validate(MoviePageQuerySchema),
    movieController.getPopularMovies.bind(movieController),
  );

  router.get('/genres', optionalAuth, movieController.getGenres.bind(movieController));

  router.get(
    '/search',
    optionalAuth,
    validate(MovieSearchQuerySchema),
    movieController.searchExternalMovies.bind(movieController),
  );

  router.get(
    '/tmdb/:tmdbId',
    auth,
    validate(TmdbIdParamSchema),
    movieController.getMovieByTmdbId.bind(movieController),
  );

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

  router.get(
    '/:id',
    auth,
    validate(MovieIdParamSchema),
    movieController.getMovie.bind(movieController),
  );

  return router;
};
