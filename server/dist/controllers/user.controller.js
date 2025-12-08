"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = getUser;
const user_service_1 = require("../services/user.service");
const service = new user_service_1.UserService();
// export async function listUsers(req: Request, res: Response, next: NextFunction) {
//   try {
//     const page = parseInt((req.query.page as string) || '1', 10);
//     const limit = parseInt((req.query.limit as string) || '10', 10);
//     const result = await service.list(page, limit);
//     res.json({
//       data: result.data,
//       page: result.page,
//       limit: result.limit,
//       total: result.total,
//       totalPages: result.totalPages,
//     });
//   } catch (err) {
//     next(err);
//   }
// }
async function getUser(req, res, next) {
    try {
        const user = await service.get(req.params.id);
        if (!user)
            return res.status(404).json({ message: 'Not found' });
        res.json(user);
    }
    catch (err) {
        next(err);
    }
}
// export async function patchUser(req: Request, res: Response, next: NextFunction) {
//   try {
//     const updated = await service.patch(req.params.id, req.body);
//     if (!updated) return res.status(404).json({ message: 'Not found' });
//     res.json(updated);
//   } catch (err) {
//     next(err);
//   }
