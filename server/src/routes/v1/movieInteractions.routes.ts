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

  // Apply auth middleware to all interaction routes
  router.use(auth);

  // POST /v1/interactions/movies/:movieId/progress - Update watch progress
  router.post(
    '/movies/:movieId/progress',
    validate(UpdateWatchProgressSchema),
    controller.updateWatchProgress.bind(controller),
  );

  // GET /v1/interactions/movies/:movieId/progress - Get watch progress
  router.get(
    '/movies/:movieId/progress',
    validate(MovieIdParamSchema),
    controller.getWatchProgress.bind(controller),
  );

  // POST /v1/interactions/movies/:movieId/rating - Rate a movie
  router.post(
    '/movies/:movieId/rating',
    validate(RateMovieSchema),
    controller.rateMovie.bind(controller),
  );

  // GET /v1/interactions/movies/:movieId/rating - Get user's rating
  router.get(
    '/movies/:movieId/rating',
    validate(MovieIdParamSchema),
    controller.getUserRating.bind(controller),
  );

  // POST /v1/interactions/movies/:movieId/watchlist - Add to watchlist
  router.post(
    '/movies/:movieId/watchlist',
    validate(MovieIdParamSchema),
    controller.addToWatchlist.bind(controller),
  );

  // DELETE /v1/interactions/movies/:movieId/watchlist - Remove from watchlist
  router.delete(
    '/movies/:movieId/watchlist',
    validate(MovieIdParamSchema),
    controller.removeFromWatchlist.bind(controller),
  );

  // GET /v1/interactions/movies/:movieId/stats - Get movie stats
  router.get(
    '/movies/:movieId/stats',
    validate(MovieIdParamSchema),
    controller.getMovieStats.bind(controller),
  );

  // GET /v1/interactions/user/stats - Get user stats
  router.get('/user/stats', controller.getUserStats.bind(controller));

  // GET /v1/interactions/history - Get user's watch history
  router.get('/history', validate(LimitQuerySchema), controller.getWatchHistory.bind(controller));

  // GET /v1/interactions/watchlist - Get user's watchlist
  router.get(
    '/watchlist',
    validate(MovieListQuerySchema),
    controller.getWatchlist.bind(controller),
  );

  // GET /v1/interactions/continue-watching - Get continue watching
  router.get(
    '/continue-watching',
    validate(LimitQuerySchema),
    controller.getContinueWatching.bind(controller),
  );

  return router;
};
