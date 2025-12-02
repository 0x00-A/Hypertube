import { Document, Model } from 'mongoose';
import { IUser } from '../interfaces/user.interface';

export interface IUserDocument extends Omit<IUser, 'id'>, Document {}

export interface IUserModel extends Model<IUserDocument> {}
