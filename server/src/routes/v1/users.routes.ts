import { Router } from 'express';
import { UserController } from '../../controllers/user.controller';
import { validate } from '../../middleware/validate';
import {
  ChangePasswordSchema,
  GetUserSchema,
  ListUsersSchema,
  UpdateProfileSchema,
} from '../../validators/user.schema';
import { auth } from '../../middleware/auth';
import { methodNotAllowed } from '../../middleware/methodNotAllowed';
import { handleAvatarUpload } from '../../middleware/uploadAvatar';

export const createUserRoutes = (controller: UserController) => {
  const router = Router();

  router.get('/', validate(ListUsersSchema), (req, res, next) =>
    controller.listUsers(req, res, next),
  );
  router.get('/me', auth, (req, res, next) => controller.getMe(req, res, next));
  router.get('/:identifier', validate(GetUserSchema), (req, res, next) =>
    controller.getUser(req, res, next),
  );
  // handleAvatarUpload processes the file and sets req.body.avatarUrl before validation
  router.post(
    '/update-profile',
    auth,
    handleAvatarUpload,
    validate(UpdateProfileSchema),
    (req, res, next) => controller.updateProfile(req, res, next),
  );
  router.post('/change-password', auth, validate(ChangePasswordSchema), (req, res, next) =>
    controller.changePassword(req, res, next),
  );

  // 405 catch-alls: fires when path matches but method is not supported
  router.all('/', methodNotAllowed);
  router.all('/me', methodNotAllowed);
  router.all('/update-profile', methodNotAllowed);
  router.all('/change-password', methodNotAllowed);
  router.all('/:identifier', methodNotAllowed);

  return router;
};
