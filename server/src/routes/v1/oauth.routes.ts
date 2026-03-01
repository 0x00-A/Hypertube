import { Router, Request, Response } from 'express';
import { OAuthController } from '../../controllers/oauth.controller';
import { methodNotAllowed } from '../../middleware/methodNotAllowed';


export const createOAuthRoutes = (controller: OAuthController) => {
    const router = Router();

    router.get('/', (_req: Request, res: Response) => {
        res.json({ message: 'OAuth route is working' });
    });

    router.get('/google', (req, res, next) => controller.googleAuth(req, res, next));
    router.get('/google/callback', (req, res, next) => controller.googleCallback(req, res, next));

    router.get('/42', (req, res, next) => controller.fortyTwoAuth(req, res, next));
    router.get('/42/callback', (req, res, next) => controller.fortyTwoCallback(req, res, next));

    // 405 catch-alls: fires when path matches but method is not supported
    router.all('/', methodNotAllowed);
    router.all('/google', methodNotAllowed);
    router.all('/google/callback', methodNotAllowed);
    router.all('/42', methodNotAllowed);
    router.all('/42/callback', methodNotAllowed);

    return router;
}