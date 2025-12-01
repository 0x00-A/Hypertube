import { Router } from 'express';
import { listComments, createComment, deleteComment } from '../../controllers/comment.controller';
import { validate } from '../../middleware/validate';
import { IdParamSchema } from '../../validators/common.schema';

export const router = Router();

router.get('/', listComments);
router.post('/', createComment);
router.delete('/:id', validate(IdParamSchema), deleteComment);
