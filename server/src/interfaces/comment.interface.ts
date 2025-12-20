import { Types } from 'mongoose';

export interface IComment {
  user: Types.ObjectId;
  tmdbId: number;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateCommentDTO {
  content: string;
  tmdbId: number;
}

export interface IUpdateCommentDTO {
  content: string;
}

export interface IPopulatedComment {
  user: {
    _id: Types.ObjectId | string;
    username: string;
    avatarUrl?: string;
  };
  tmdbId: number;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}
