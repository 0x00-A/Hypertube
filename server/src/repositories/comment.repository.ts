import { CommentModel } from '../models/Comment';
import { IComment, ICreateCommentDTO, IPopulatedComment } from '../interfaces/comment.interface';
import { IPaginatedResponse, IPaginationOptions } from '../core/interfaces/IPagination';
import { MovieModel } from '../models/Movie';
import { Types } from 'mongoose';

export class CommentRepository {
  async findAll(
    tmdbId?: number,
    paginationOptions?: IPaginationOptions,
  ): Promise<IPaginatedResponse<IPopulatedComment>> {
    const filter = typeof tmdbId === 'number' ? { tmdbId } : {};
    const page = paginationOptions?.page || 1;
    const limit = paginationOptions?.limit || 20;
    const sortBy = paginationOptions?.sortBy || 'createdAt';
    const sortOrder = paginationOptions?.sortOrder === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      CommentModel.find(filter)
        .populate('user', 'username avatarUrl')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean<IPopulatedComment[]>(),
      CommentModel.countDocuments(filter),
    ]);

    return {
      data: data as IPopulatedComment[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async findAllByMovie(
    tmdbId: number,
    paginationOptions?: IPaginationOptions,
  ): Promise<IPaginatedResponse<IPopulatedComment>> {
    const movie = await MovieModel.findOne({ tmdbId });

    if (!movie) {
      return {
        data: [] as IPopulatedComment[],
        pagination: {
          page: 1,
          limit: 0,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    const page = paginationOptions?.page || 1;
    const limit = paginationOptions?.limit || 20;
    const sortBy = paginationOptions?.sortBy || 'createdAt';
    const sortOrder = paginationOptions?.sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      CommentModel.find({ tmdbId })
        .populate('user', 'username avatarUrl')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean<IPopulatedComment[]>(),
      CommentModel.countDocuments({ tmdbId }),
    ]);

    return {
      data: data as IPopulatedComment[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async create(comment: ICreateCommentDTO, userId: Types.ObjectId): Promise<IComment> {
    const doc = await CommentModel.create({ ...comment, user: userId });
    await doc.populate('user', 'username avatarUrl');
    return doc.toObject();
  }

  async findById(id: string): Promise<IComment | null> {
    const doc = await CommentModel.findById(id)
      .lean<IComment>()
      .populate('user', 'username avatarUrl');

    return doc;
  }

  async update(id: string, content: string): Promise<IComment | null> {
    const doc = await CommentModel.findByIdAndUpdate(id, { content }, { new: true })
      .populate('user', 'username avatarUrl')
      .lean<IComment>();
    return doc;
  }

  async delete(id: string): Promise<void> {
    await CommentModel.findByIdAndDelete(id);
  }
}
