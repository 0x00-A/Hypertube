import { Router, Request, Response } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { validate } from '../../middleware/validate';
import { SignUpSchema } from '../../validators/signup.schema';


export const createAuthRoutes = (controller: AuthController) => {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'Auth route is working' });
  });

  router.post('/signup', validate(SignUpSchema), (req, res, next) => controller.signUp(req, res, next));

  return router;
};
