import { Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/comment.service';
const service = new CommentService();

export async function listComments(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);
    const result = await service.list(page, limit);
    res.json({
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
}

export async function createComment(req: Request, res: Response, next: NextFunction) {
  try {
    const created = await service.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  try {
    await service.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
