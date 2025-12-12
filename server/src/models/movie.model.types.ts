import { Document, Model } from 'mongoose';
import { IMovie } from '../interfaces/movie.interface';

export interface IMovieDocument extends Omit<IMovie, 'id'>, Document {
  getMagnetLinks(): string[];
}

export interface IMovieModel extends Model<IMovieDocument> {}
