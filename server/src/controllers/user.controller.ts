import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { NotFoundError } from '../core/errors/customErrors';
import { asyncHandler } from '../utils/asyncHandler';


export class UserController {

  constructor(private _service: UserService) {}

  getUser = asyncHandler(async (req: Request, res: Response) => {
    const username = req.params.username || req.user?.username;

    if (!username) throw new NotFoundError('User not found');

    const user = await this._service.getUser(username);
    if (!user) throw new NotFoundError('User not found');

    res.json({
      status: 'success',
      data: {
        user,
      },
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

// export async function patchUser(req: Request, res: Response, next: NextFunction) {
//   try {
//     const updated = await service.patch(req.params.id, req.body);
//     if (!updated) return res.status(404).json({ message: 'Not found' });
//     res.json(updated);
//   } catch (err) {
//     next(err);
//   }
