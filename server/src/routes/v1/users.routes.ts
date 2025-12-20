import { Router } from 'express';
import { UserController } from '../../controllers/user.controller';
import { validate } from '../../middleware/validate';
import { GetUserSchema, ListUsersSchema } from '../../validators/user.schema';
import { auth } from '../../middleware/auth';

export const createUserRoutes = (controller: UserController) => {
    const router = Router();

    router.get('/', validate(ListUsersSchema), (_req, res, next) => controller.listUsers(_req, res, next));
    router.get('/me', auth, (req, res, next) => controller.getMe(req, res, next));
    router.get('/:identifier', validate(GetUserSchema), (req, res, next) => controller.getUser(req, res, next));

    return router;
}
