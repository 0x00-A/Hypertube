import { Router } from 'express';
import { UserController } from '../../controllers/user.controller';
import { validate } from '../../middleware/validate';
import { GetUserSchema } from '../../validators/user.schema';
import { auth } from '../../middleware/auth';

export const createUserRoutes = (controller: UserController) => {
    const router = Router();

    router.get('/me', auth, (req, res, next) => controller.getMe(req, res, next));
    router.get('/:username', validate(GetUserSchema), (req, res, next) => controller.getUser(req, res, next));

    return router;
}
