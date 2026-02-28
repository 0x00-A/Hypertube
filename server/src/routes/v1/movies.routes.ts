import { Router } from 'express';
import { MovieController } from '../../controllers/movie.controller';
import { validate } from '../../middleware/validate';
import {
  MovieListQuerySchema,
  MovieIdParamSchema,
  MovieSearchQuerySchema,
  TmdbIdParamSchema,
  MoviePageQuerySchema,
  RecommendedTmdbSchema,
} from '../../validators/movie.schema';
import { auth, optionalAuth } from '../../middleware/auth';
import { methodNotAllowed } from '../../middleware/methodNotAllowed';

export const createMovieRouter = (movieController: MovieController): Router => {
  const router = Router();

  router.get(
    '/',
    auth,
    validate(MovieListQuerySchema),
    movieController.listMovies.bind(movieController),
  );

  router.get(
    '/trending',
    optionalAuth,
    validate(MoviePageQuerySchema),
    movieController.getTrendingMovies.bind(movieController),
  );

  router.get('/slider', optionalAuth, movieController.getHomepageSlider.bind(movieController));

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

  router.get('/genres', auth, movieController.getGenres.bind(movieController));

  router.get(
    '/search',
    auth,
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

  router.get(
    '/recommended/:tmdbId',
    auth,
    validate(RecommendedTmdbSchema),
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

  // 405 catch-alls: fires when path matches but method is not supported
  router.all('/', methodNotAllowed);
  router.all('/trending', methodNotAllowed);
  router.all('/slider', methodNotAllowed);
  router.all('/curated', methodNotAllowed);
  router.all('/random', methodNotAllowed);
  router.all('/popular', methodNotAllowed);
  router.all('/genres', methodNotAllowed);
  router.all('/search', methodNotAllowed);
  router.all('/recommended', methodNotAllowed);
  router.all('/tmdb/:tmdbId', methodNotAllowed);
  router.all('/recommended/:tmdbId', methodNotAllowed);
  router.all('/watchlist/:tmdbId', methodNotAllowed);
  router.all('/:id', methodNotAllowed);

  return router;
};
