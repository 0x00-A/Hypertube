import { Router } from 'express';
import { MovieInteractionController } from '../../controllers/movieInteraction.controller';
import { validate } from '../../middleware/validate';
import { auth } from '../../middleware/auth';
import {
  MovieIdParamSchema,
  UpdateWatchProgressSchema,
  RateMovieSchema,
  LimitQuerySchema,
} from '../../validators/movieInteraction.schema';
import { MovieListQuerySchema } from '../../validators/movie.schema';

export const createMovieInteractionRouter = (controller: MovieInteractionController): Router => {
  const router = Router();

  router.use(auth);

  router.post(
    '/movies/:movieId/progress',
    validate(UpdateWatchProgressSchema),
    controller.updateWatchProgress.bind(controller),
  );

  router.get(
    '/movies/:movieId/progress',
    validate(MovieIdParamSchema),
    controller.getWatchProgress.bind(controller),
  );

  router.post(
    '/movies/:movieId/rating',
    validate(RateMovieSchema),
    controller.rateMovie.bind(controller),
  );

  router.get(
    '/movies/:movieId/rating',
    validate(MovieIdParamSchema),
    controller.getUserRating.bind(controller),
  );

  router.post(
    '/movies/:movieId/watchlist',
    validate(MovieIdParamSchema),
    controller.addToWatchlist.bind(controller),
  );

  router.delete(
    '/movies/:movieId/watchlist',
    validate(MovieIdParamSchema),
    controller.removeFromWatchlist.bind(controller),
  );

  router.get(
    '/movies/:movieId/stats',
    validate(MovieIdParamSchema),
    controller.getMovieStats.bind(controller),
  );

  router.get('/user/stats', controller.getUserStats.bind(controller));

  router.get(
    '/history',
    validate(MovieListQuerySchema),
    controller.getWatchHistory.bind(controller),
  );

  router.get(
    '/watchlist',
    validate(MovieListQuerySchema),
    controller.getWatchlist.bind(controller),
  );

  router.get(
    '/continue-watching',
    validate(LimitQuerySchema),
    controller.getContinueWatching.bind(controller),
  );

  return router;
};
