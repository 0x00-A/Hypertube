import { Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/comment.service';
import { asyncHandler } from '../utils/asyncHandler';
import { IPaginationOptions } from '../core/interfaces/IPagination';
import { ICreateCommentDTO } from '../interfaces/comment.interface';
import { Types } from 'mongoose';
import { IResponse } from '../core/interfaces/IResponse';

export class CommentController {
  private _commentService: CommentService;

  constructor(commentService: CommentService) {
    this._commentService = commentService;
  }

  listComments = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const query = req.validated?.query as IPaginationOptions;
    const paginationOptions: IPaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 20,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    };

    const result = await this._commentService.list(undefined, paginationOptions);
    res.json(result);
  });

  getCommentById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const commentId = (req.validated?.params as { id: string }).id;
    const result = await this._commentService.getById(commentId);

    const response: IResponse<typeof result> = {
      data: result,
      message: 'Comment retrieved successfully.',
    };
    res.json(response);
  });

  listCommentsByMovie = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const tmdbId = (req.validated?.params as { tmdbId: number }).tmdbId;
    const query = req.validated?.query as IPaginationOptions;
    const paginationOptions: IPaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 20,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    };

    const result = await this._commentService.list(tmdbId, paginationOptions);
    res.json(result);
  });

  createComment = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { content, tmdbId } = req.validated?.body as ICreateCommentDTO;
    const userId = new Types.ObjectId(req.user?._id);

    const result = await this._commentService.create(
      {
        content,
        tmdbId,
      },
      userId,
    );

    const response: IResponse<typeof result> = {
      data: result,
      message: 'Comment created successfully.',
    };

    res.status(201).json(response);
  });

  updateComment = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const commentId = (req.validated?.params as { id: string }).id;
    const userId = new Types.ObjectId(req.user?._id);
    const { content } = req.validated?.body as { content: string };

    const updatedComment = await this._commentService.update(commentId, content, userId);

    const response: IResponse<typeof updatedComment> = {
      data: updatedComment,
      message: 'Comment updated successfully.',
    };
    res.status(200).json(response);
  });

  deleteComment = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const commentId = (req.validated?.params as { id: string }).id;
    const userId = new Types.ObjectId(req.user?._id);

    await this._commentService.delete(commentId, userId);

    res.status(204).send();
  });
}
