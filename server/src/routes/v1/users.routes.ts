import { Router } from 'express';
import { UserController } from '../../controllers/user.controller';
import { validate } from '../../middleware/validate';
import { GetUserSchema, ListUsersSchema, UpdateProfileSchema } from '../../validators/user.schema';
import { auth } from '../../middleware/auth';

export const createUserRoutes = (controller: UserController) => {
    const router = Router();

    router.get('/', validate(ListUsersSchema), (req, res, next) => controller.listUsers(req, res, next));
    router.get('/me', auth, (req, res, next) => controller.getMe(req, res, next));
    router.get('/:identifier', validate(GetUserSchema), (req, res, next) => controller.getUser(req, res, next));
    router.post('/update-profile', validate(UpdateProfileSchema), auth, (req, res, next) => controller.updateProfile(req, res, next));

    return router;
}
