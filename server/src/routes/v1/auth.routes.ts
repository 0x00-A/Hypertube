import { Router, Request, Response } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { validate } from '../../middleware/validate';
import { SignUpSchema, LogInSchema, VerifyEmailSchema, RequestPasswordResetSchema, ResetPasswordSchema } from '../../validators/auth.schema';
import { passwordResetLimiter } from '../../middleware/rateLimiter';
import { methodNotAllowed } from '../../middleware/methodNotAllowed';


export const createAuthRoutes = (controller: AuthController) => {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'Auth route is working' });
  });

  router.post('/signup', validate(SignUpSchema), (req, res, next) => controller.signUp(req, res, next));
  router.post('/verify-email', validate(VerifyEmailSchema),(req, res, next) => controller.verifyEmail(req, res, next));
  router.post('/login', validate(LogInSchema), (req, res, next) => controller.logIn(req, res, next));
  router.post('/refresh-token', (req, res, next) => controller.refreshToken(req, res, next));
  router.post('/logout', (req, res, next) => controller.logout(req, res, next));
  router.post('/request-password-reset', passwordResetLimiter, validate(RequestPasswordResetSchema), (req, res, next) => controller.requestPasswordReset(req, res, next));
  router.post('/reset-password', validate(ResetPasswordSchema), (req, res, next) => controller.resetPassword(req, res, next));

  // 405 catch-alls: fires when path matches but method is not supported
  router.all('/', methodNotAllowed);
  router.all('/signup', methodNotAllowed);
  router.all('/verify-email', methodNotAllowed);
  router.all('/login', methodNotAllowed);
  router.all('/logout', methodNotAllowed);
  router.all('/refresh-token', methodNotAllowed);
  router.all('/request-password-reset', methodNotAllowed);
  router.all('/reset-password', methodNotAllowed);

  return router;
};
