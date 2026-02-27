import { MovieModel } from '../models/Movie';
import { IMovieDocument } from '../models/movie.model.types';
import {
  IPaginationOptions,
  MovieFilterOptions,
  IPaginatedResponse,
} from '../core/interfaces/IPagination';
import { IMovie, ISubtitle } from '../interfaces/movie.interface';
import { FilterQuery } from 'mongoose';

export class MovieRepository {
  async findAll(
    paginationOptions: IPaginationOptions,
    filterOptions: MovieFilterOptions = {},
    excludeFields: string[] = [
      'torrents',
      'cast',
      'trailer',
      'downloadStatus',
      'lastWatched',
      'userRatings',
      'metadataSource',
    ],
  ): Promise<IPaginatedResponse<IMovie>> {
    const page = paginationOptions.page || 1;
    const limit = paginationOptions.limit || 10;
    const sortBy = paginationOptions.sortBy || 'lastUpdated';
    const sortOrder = paginationOptions.sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    // Build filter query
    const filter: FilterQuery<IMovieDocument> = {};

    if (filterOptions.topRanked) {
      filter.topRank = { $ne: null };
    }

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

    const selectStr = excludeFields.length ? excludeFields.map((f) => `-${f}`).join(' ') : '';

    // Execute queries
    const [data, total] = await Promise.all([
      MovieModel.find(filter)
        .select(selectStr)
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

  async findById(id: string): Promise<IMovieDocument | null> {
    return MovieModel.findById(id);
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

  async findByTmdbId(tmdbId: number, excludeFields: string[] = []): Promise<IMovieDocument | null> {
    const selectStr = excludeFields.length ? excludeFields.map((f) => `-${f}`).join(' ') : '';
    return MovieModel.findOne({ tmdbId: tmdbId }).select(selectStr).exec();
  }

  async findByTmdbIds(tmdbIds: number[]): Promise<IMovieDocument[]> {
    return MovieModel.find({ tmdbId: { $in: tmdbIds } }).exec();
  }

  async searchByTitle(title: string, limit: number = 10): Promise<IMovie[]> {
    return MovieModel.find({ title: { $regex: title, $options: 'i' } })
      .limit(limit)
      .lean<IMovie[]>();
  }

  async updateByTmdbId(
    tmdbId: number,
    updateData: Partial<IMovie>,
  ): Promise<IMovieDocument | null> {
    return MovieModel.findOneAndUpdate({ tmdbId }, updateData, { new: true });
  }

  async findRandom(): Promise<IMovieDocument | null> {
    const count = await MovieModel.countDocuments({ topRank: { $ne: null } });
    if (count === 0) return null;
    const randomIndex = Math.floor(Math.random() * count);
    const randomMovie = await MovieModel.findOne({ topRank: { $ne: null } })
      .skip(randomIndex)
      .exec();
    return randomMovie;
  }

  async getDistinctGenres(): Promise<string[]> {
    const genres = await MovieModel.distinct('genres').exec();
    return genres as string[];
  }

  async addSubtitleToMovie(
    imdbId: string,
    language: string,
    subtitle: ISubtitle,
  ): Promise<IMovieDocument | null> {
    const movie = await this.findByImdbId(imdbId);
    if (!movie) return null;

    if (!movie.subtitles) {
      movie.subtitles = new Map();
    }

    const existingSubs = movie.subtitles.get(language) || [];

    // Replace any existing entry for the same torrent (hash + quality) to avoid duplicates.
    // This handles the case where a subtitle file was deleted and re-downloaded.
    const filteredSubs = existingSubs.filter(
      (s) => !(s.forHash === subtitle.forHash && s.forQuality === subtitle.forQuality),
    );
    filteredSubs.push(subtitle);

    movie.subtitles.set(language, filteredSubs);

    await movie.save();
    return movie;
  }
}
