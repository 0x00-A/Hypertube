import { Schema, model } from 'mongoose';

const commentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

export const CommentModel = model('Comment', commentSchema);
