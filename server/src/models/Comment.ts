import { Schema, model } from 'mongoose';
import { ICommentDocument, ICommentModel } from './comment.model.types';

const commentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
  content: { type: String, required: true, maxlength: 500 }, // Security: prevent massive payloads
  createdAt: { type: Date, default: Date.now },
});

export const CommentModel = model<ICommentDocument, ICommentModel>('Comment', commentSchema);
