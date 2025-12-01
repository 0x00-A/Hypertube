import { Router } from 'express';
import { listUsers, getUser, patchUser } from '../../controllers/user.controller';
import { validate } from '../../middleware/validate';
import { IdParamSchema } from '../../validators/common.schema';

export const router = Router();

router.get('/', listUsers);
router.get('/:id', validate(IdParamSchema), getUser);
router.patch('/:id', validate(IdParamSchema), patchUser);
