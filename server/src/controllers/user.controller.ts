import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { NotFoundError } from '../core/errors/customErrors';
import { asyncHandler } from '../utils/asyncHandler';
import { IUserProfileUpdate } from '../interfaces/user.interface';


export class UserController {

  constructor(private _service: UserService) {}

  listUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = (req.validated?.query as { page: number; limit: number }) || { page: 1, limit: 10 };
    const result = await this._service.list(page, limit);
    res.json({
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  });

  getMe = asyncHandler(async (req: Request, res: Response) => {
    const username = req.user?.username;

    if (!username) throw new NotFoundError('User not found');

    const user = await this._service.getUser(username, true);
    if (!user) throw new NotFoundError('User not found');

    res.json({
      status: 'success',
      data: {
        user,
      },
    });
  });


  getUser = asyncHandler(async (req: Request, res: Response) => {
    const identifier = (req.validated?.params as { identifier: string })?.identifier;

    if (!identifier) throw new NotFoundError('User not found');

    const user = await this._service.getUser(identifier);
    if (!user) throw new NotFoundError('User not found');

    res.json({
      status: 'success',
      data: {
        user,
      },
    });
  });

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const newData = req.validated?.body as IUserProfileUpdate;
    if (req.user == null || req.user.username == null) {
      throw new NotFoundError('User not found');
    }
    await this._service.updateProfile(req.user.username, newData);
    res.json({
      status: 'success',
      message: 'Profile updated successfully',
    });

  });

}
// export const listUsers = asyncHandler(async (req: Request, res: Response) => {
//   const page = parseInt((req.query.page as string) || '1', 10);
//   const limit = parseInt((req.query.limit as string) || '10', 10);
//   const result = await service.list(page, limit);
//   res.json({
//     data: result.data,
//     page: result.page,
//     limit: result.limit,
//     total: result.total,
//     totalPages: result.totalPages,
//   });
// });

// export const getUser = asyncHandler(async (req: Request, res: Response) => {
//   const user = await service.get(req.params.id);
//   if (!user) {
//     throw new NotFoundError('User not found');
//   }
//   res.json(user);
// });
