import { Router, Request, Response } from 'express';
import { UserController } from '../../controllers/user.controller';


export const createUserRoutes = (controller: UserController) => {
    const router = Router();

    router.get('/', (_req: Request, res: Response) => {
        res.json({ message: 'User route is working' });
    });

    router.get('/me', (req, res, next) => controller.getMe(req, res, next));
    router.get('/:username', (req, res, next) => controller.getUser(req, res, next));

    return router;
}
