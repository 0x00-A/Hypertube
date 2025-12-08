import { MovieModel } from '../models/Movie';
import mongoose, { FilterQuery } from 'mongoose';
import { IMovieDocument } from '../models/movie.model.types';
import {
  IPaginationOptions,
  MovieFilterOptions,
  IPaginatedResponse,
} from '../core/interfaces/IPagination';
import { IMovie } from '../interfaces/movie.interface';

export class MovieRepository {
  async findAll(
    options: IPaginationOptions & MovieFilterOptions,
  ): Promise<IPaginatedResponse<IMovie>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const sortBy = options.sortBy || 'lastUpdated';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    if (mongoose.connection.readyState !== 1) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    const skip = (page - 1) * limit;

    // Build filter query
    const filter: FilterQuery<IMovieDocument> = {};

    if (options.search) {
      filter.$or = [
        { title: { $regex: options.search, $options: 'i' } },
        { synopsis: { $regex: options.search, $options: 'i' } },
      ];
    }

    if (options.genre) {
      filter.genres = { $in: [options.genre] };
    }

    if (options.minRating !== undefined) {
      filter.rating = { $gte: options.minRating };
    }

    if (options.year) {
      filter.year = options.year;
    }

    // Execute queries
    const [data, total] = await Promise.all([
      MovieModel.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean<IMovie[]>(),
      MovieModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: data as IMovie[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findById(id: string): Promise<IMovie | null> {
    return MovieModel.findById(id).lean<IMovie>();
  }

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
    return MovieModel.findOne({ imdbId: imdbId }).exec();
  }
}
