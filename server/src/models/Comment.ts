import { Schema, model } from 'mongoose';
import { ICommentDocument, ICommentModel } from './comment.model.types';

const commentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tmdbId: { type: Number, required: true },
    content: { type: String, required: true, maxlength: 500 },
  },
  {
    timestamps: true,
  },
);

commentSchema.index({ tmdbId: 1, createdAt: -1 });
commentSchema.index({ tmdbId: 1 });
export const CommentModel = model<ICommentDocument, ICommentModel>('Comment', commentSchema);
