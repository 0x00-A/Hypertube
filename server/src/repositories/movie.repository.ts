import { MovieModel } from '../models/Movie';
import mongoose from 'mongoose';
import { IMovie } from '../interfaces/movie.interface';
import { IPaginationOptions, IPaginatedResponse } from '../interfaces/pagination.interface';

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

  async findById(id: string): Promise<IMovie | null> {
    return MovieModel.findById(id) as any;
  }
}
