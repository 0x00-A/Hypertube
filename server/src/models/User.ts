import { Schema, model } from 'mongoose';
import { IUserDocument, IUserModel } from './user.model.types';

const userSchema = new Schema({
  username: { type: String, required: true, unique: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  avatarUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  password: { type: String, select: false, required: true },
  isActive: { type: Boolean, default: false },
  oauth: {
    type: {
      provider: { type: String, enum: ['google', 'fortytwo'] },
      id: { type: String },
      isPasswordSet: { type: Boolean, default: false },
      // Indicates whether an OAuth user has explicitly set a local password.
      // true  -> user has set a password and can use password login / reset.
      // false -> user relies solely on OAuth; password-based reset is not allowed.
    },
    _id: false,
    select: false,
  },

  language: { type: String, default: 'en' },
});

export const UserModel = model<IUserDocument, IUserModel>('User', userSchema);
