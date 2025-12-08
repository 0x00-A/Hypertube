import { Router, Request, Response } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { validate } from '../../middleware/validate';
import { SignUpSchema, LogInSchema } from '../../validators/auth.schema';


export const createAuthRoutes = (controller: AuthController) => {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'Auth route is working' });
  });

  router.post('/signup', validate(SignUpSchema), (req, res, next) => controller.signUp(req, res, next));
  router.post('/login', validate(LogInSchema), (req, res, next) => controller.logIn(req, res, next));

  return router;
};
