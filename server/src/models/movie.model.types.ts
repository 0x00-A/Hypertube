import { Document, Model } from 'mongoose';
import { IMovie } from '../interfaces/movie.interface';

export type MagnetLinkResult = {
  magnet: string;
  quality: string;
  type?: string;
  size: string;
  provider?: string;
  seeds: number;
  peers: number;
  videoCodec?: string;
};

export interface IMovieDocument extends Omit<IMovie, 'id'>, Document {
  getMagnetLinks(): MagnetLinkResult[];
}

export interface IMovieModel extends Model<IMovieDocument> {}
