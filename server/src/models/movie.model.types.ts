import { Document, Model } from 'mongoose';
import { IMovie } from '../interfaces/movie.interface';

export interface IMovieDocument extends Omit<IMovie, 'id'>, Document {}

export interface IMovieModel extends Model<IMovieDocument> {}
