import { Schema, model } from 'mongoose';
import { IUserDocument, IUserModel } from './user.model.types';

const userSchema = new Schema({
  username: { type: String, required: true, unique: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true }, // Private [cite: 49]
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String }, // Nullable if using OmniAuth only
  profilePicture: { type: String }, // URL to local image
  language: { type: String, default: 'en' }, // Defaults to English

  // Auth Provider Logic (42 + Secondary)
  oauth: {
    fortytwoId: { type: String, select: false }, // Store ID, don't expose
    googleId: { type: String, select: false },
  },

  // Track watched movies for the thumbnail UI [cite: 66]
  watchedMovies: [
    {
      movieId: { type: Schema.Types.ObjectId, ref: 'Movie' },
      date: Date,
    },
  ],
});

export const UserModel = model<IUserDocument, IUserModel>('User', userSchema);
