import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { IdParamSchema } from '../../validators/common.schema';
import { auth } from '../../middleware/auth';
import { CommentController } from '../../controllers/comment.controller';
import {
  commentListByMovieQuerySchema,
  createCommentSchema,
  updateCommentSchema,
  commentListQuerySchema,
} from '../../validators/comment.schema';

export const createCommentRouter = (commentController: CommentController): Router => {
  const router = Router();

  router.get(
    '/',
    validate(commentListQuerySchema),
    commentController.listComments.bind(commentController),
  );

  router.use(auth);

  router.get(
    '/:id',
    validate(IdParamSchema),
    commentController.getCommentById.bind(commentController),
  );

  router.get(
    '/movie/:tmdbId',
    validate(commentListByMovieQuerySchema),
    commentController.listCommentsByMovie.bind(commentController),
  );

  router.post(
    '/',
    validate(createCommentSchema),
    commentController.createComment.bind(commentController),
  );

  router.patch(
    '/:id',
    validate(updateCommentSchema),
    commentController.updateComment.bind(commentController),
  );

  router.delete(
    '/:id',
    validate(IdParamSchema),
    commentController.deleteComment.bind(commentController),
  );

  return router;
};
