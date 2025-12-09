// import { CommentModel } from '../models/Comment';
// import mongoose from 'mongoose';
// import { IComment } from '../interfaces/comment.interface';
// // import { IPaginationOptions, IPaginatedResponse } from '../interfaces/pagination.interface';

// export class CommentRepository {
//   async findAll(options?: IPaginationOptions): Promise<IPaginatedResponse<IComment>> {
//     const page = options?.page || 1;
//     const limit = options?.limit || 10;
//     if (mongoose.connection.readyState !== 1) {
//       return { data: [], page, limit, total: 0, totalPages: 0 };
//     }
//     const skip = (page - 1) * limit;
//     const [data, total] = await Promise.all([
//       CommentModel.find().skip(skip).limit(limit),
//       CommentModel.countDocuments(),
//     ]);
//     return {
//       data: data as any,
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit) || 1,
//     };
//   }
//   async create(comment: Partial<IComment>): Promise<IComment> {
//     return CommentModel.create(comment) as any;
//   }
//   async delete(id: string): Promise<void> {
//     await CommentModel.findByIdAndDelete(id);
//   }
// }
