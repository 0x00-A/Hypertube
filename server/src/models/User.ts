import { Schema, model } from 'mongoose';
import { IUserDocument, IUserModel } from './user.model.types';

const userSchema = new Schema({
  username: { type: String, required: true, unique: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, select: false, required: true },
  oauth: {
    provider: { type: String, enum: ['google', 'fortytwo'] },
    id: { type: String },
    _id: false,
  },

  // Track watched movies for the thumbnail UI [cite: 66]
  // watchedMovies: [
  //   {
  //     movieId: { type: Schema.Types.ObjectId, ref: 'Movie' },
  //     date: Date,
  //   },
  // ],
});

export const UserModel = model<IUserDocument, IUserModel>('User', userSchema);
