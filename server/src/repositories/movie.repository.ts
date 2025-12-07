import { MovieModel } from '../models/Movie';
import mongoose from 'mongoose';
import { IMovieDocument } from '../models/movie.model.types';
import { IPaginationOptions, IPaginatedResponse } from '../interfaces/pagination.interface';
import { IMovie } from '../interfaces/movie.interface';

export class MovieRepository {
  async findAll(options?: IPaginationOptions): Promise<IPaginatedResponse<IMovie>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    if (mongoose.connection.readyState !== 1) {
      return { data: [], page, limit, total: 0, totalPages: 0 };
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      MovieModel.find().skip(skip).limit(limit),
      MovieModel.countDocuments(),
    ]);
    return {
      data: data as any,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string): Promise<IMovieDocument | null> {
    return MovieModel.findById(id) as any;
  }

  // async create(movieData: IMovie): Promise<IMovieDocument> {
  //   const movie = new MovieModel(movieData);
  //   return movie.save() as any;
  // }

  async upsert(movieData: Partial<IMovie>) {
    await MovieModel.findOneAndUpdate({ imdbId: movieData.imdbId }, movieData, {
      upsert: true,
      new: true,
    });
  }

  async create(movieData: Partial<IMovie>) {
    await MovieModel.create(movieData);
  }

  async findByImdbId(imdbId: string): Promise<IMovieDocument | null> {
    return MovieModel.findOne({ imdbId: imdbId });
  }
}
