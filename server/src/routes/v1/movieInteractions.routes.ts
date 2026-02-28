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
import { methodNotAllowed } from '../../middleware/methodNotAllowed';

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

  // 405 catch-alls: fires when path matches but method is not supported
  router.all('/movies/:movieId/progress', methodNotAllowed);
  router.all('/movies/:movieId/rating', methodNotAllowed);
  router.all('/movies/:movieId/watchlist', methodNotAllowed);
  router.all('/movies/:movieId/stats', methodNotAllowed);
  router.all('/user/stats', methodNotAllowed);
  router.all('/history', methodNotAllowed);
  router.all('/watchlist', methodNotAllowed);
  router.all('/continue-watching', methodNotAllowed);

  return router;
};
