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
    paginationOptions: IPaginationOptions,
    filterOptions: MovieFilterOptions = {},
  ): Promise<IPaginatedResponse<IMovie>> {
    const page = paginationOptions.page || 1;
    const limit = paginationOptions.limit || 10;
    const sortBy = paginationOptions.sortBy || 'lastUpdated';
    const sortOrder = paginationOptions.sortOrder === 'asc' ? 1 : -1;

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

    if (filterOptions.search) {
      const sanitizedSearch = filterOptions.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: sanitizedSearch, $options: 'i' } },
        // { synopsis: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }

    if (filterOptions.genre) {
      filter.genres = { $in: [filterOptions.genre] };
    }

    if (filterOptions.minRating !== undefined) {
      filter.rating = { $gte: filterOptions.minRating };
    }

    if (filterOptions.year) {
      filter.year = filterOptions.year;
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

  async searchByTitle(title: string, limit: number = 10): Promise<IMovie[]> {
    return MovieModel.find({ title: { $regex: title, $options: 'i' } })
      .limit(limit)
      .lean<IMovie[]>();
  }
}
