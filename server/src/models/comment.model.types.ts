import { Model, Document } from 'mongoose';
import { IComment } from '../interfaces/comment.interface';

export interface ICommentDocument extends Omit<IComment, 'id'>, Document {}

export interface ICommentModel extends Model<ICommentDocument> {}
