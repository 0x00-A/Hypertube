import { Router } from 'express';
import { StreamingController } from '../../controllers/streaming.controller';
import { validate } from '../../middleware/validate';
import { StreamMovieParamSchema } from '../../validators/streaming.schema';
import { auth } from '../../middleware/auth';
import { methodNotAllowed } from '../../middleware/methodNotAllowed';

export const createStreamingRouter = (streamingController: StreamingController): Router => {
  const router = Router();

  // GET /api/v1/stream/:movieId — Stream video with Range support
  router.get(
    '/:movieId',
    auth,
    validate(StreamMovieParamSchema),
    streamingController.stream.bind(streamingController),
  );

  // GET /api/v1/stream/:movieId/status — Get download status + subtitles
  router.get(
    '/:movieId/status',
    auth,
    validate(StreamMovieParamSchema),
    streamingController.getStatus.bind(streamingController),
  );

  // 405 catch-alls: fires when path matches but method is not supported
  router.all('/:movieId', methodNotAllowed);
  router.all('/:movieId/status', methodNotAllowed);

  return router;
};
