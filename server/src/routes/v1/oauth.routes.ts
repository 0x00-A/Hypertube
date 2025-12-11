import { Router, Request, Response } from 'express';
import { OAuthController } from '../../controllers/oauth.controller';


export const createOAuthRoutes = (controller: OAuthController) => {
    const router = Router();

    router.get('/', (_req: Request, res: Response) => {
        res.json({ message: 'OAuth route is working' });
    });

    router.get('/google', (req, res, next) => controller.googleAuth(req, res, next));
    router.get('/google/callback', (req, res, next) => controller.googleCallback(req, res, next));

    router.get('/42', (req, res, next) => controller.fortyTwoAuth(req, res, next));
    router.get('/42/callback', (req, res, next) => controller.fortyTwoCallback(req, res, next));

    return router;
}