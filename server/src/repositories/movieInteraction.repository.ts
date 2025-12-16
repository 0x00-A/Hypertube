import { MovieInteractionModel } from '../models/MovieInteraction';
import {
  ICreateMovieInteraction,
  IUpdateWatchProgress,
  IMovieInteractionStats,
  IUserInteractionStats,
} from '../interfaces/movieInteraction.interface';
import { Types, PipelineStage } from 'mongoose';
import { IMovieInteractionDocument } from '../models/movieInteraction.model.types';
import { IMovieDocument } from '../models/movie.model.types';
import { IMovie } from '../interfaces/movie.interface';
import {
  IPaginatedResponse,
  IPaginationOptions,
  MovieFilterOptions,
} from '../core/interfaces/IPagination';

export class MovieInteractionRepository {
  async create(data: ICreateMovieInteraction): Promise<IMovieInteractionDocument> {
    const interaction = new MovieInteractionModel(data);
    return await interaction.save();
  }

  async findByUserAndMovie(
    userId: Types.ObjectId,
    movieId: Types.ObjectId,
    interactionType: string,
  ): Promise<IMovieInteractionDocument | null> {
    return await MovieInteractionModel.findOne({ userId, movieId, interactionType });
  }

  async upsertWatchProgress(
    userId: Types.ObjectId,
    movieId: Types.ObjectId,
    progressData: IUpdateWatchProgress,
  ): Promise<IMovieInteractionDocument> {
    // Calculate watchProgress
    const watchProgress = Math.min(
      100,
      (progressData.lastWatchedPosition / progressData.duration) * 100,
    );
    const isCompleted = watchProgress >= 95;

    const updateData: Record<string, unknown> = {
      lastWatchedPosition: progressData.lastWatchedPosition,
      duration: progressData.duration,
      watchProgress,
      isCompleted,
      watchedAt: new Date(),
    };

    // Set completedAt if newly completed
    if (isCompleted) {
      updateData.completedAt = new Date();
    }

    const interaction = await MovieInteractionModel.findOneAndUpdate(
      { userId, movieId, interactionType: 'watched' },
      {
        $set: updateData,
      },
      { upsert: true, new: true },
    );

    return interaction;
  }

  async upsertRating(
    userId: Types.ObjectId,
    movieId: Types.ObjectId,
    rating: number,
  ): Promise<IMovieInteractionDocument> {
    const interaction = await MovieInteractionModel.findOneAndUpdate(
      { userId, movieId, interactionType: 'rated' },
      {
        $set: {
          rating,
        },
      },
      { upsert: true, new: true },
    );

    return interaction;
  }

  async addToWatchlist(
    userId: Types.ObjectId,
    movieId: Types.ObjectId,
  ): Promise<IMovieInteractionDocument> {
    const interaction = await MovieInteractionModel.findOneAndUpdate(
      { userId, movieId, interactionType: 'watchlist' },
      {
        $setOnInsert: {
          userId,
          movieId,
          interactionType: 'watchlist',
        },
      },
      { upsert: true, new: true },
    );

    return interaction;
  }

  async removeFromWatchlist(userId: Types.ObjectId, movieId: Types.ObjectId): Promise<boolean> {
    const result = await MovieInteractionModel.deleteOne({
      userId,
      movieId,
      interactionType: 'watchlist',
    });

    return result.deletedCount > 0;
  }

  async getUserWatchHistory(userId: Types.ObjectId, limit = 20): Promise<IMovie[]> {
    const interactions = await MovieInteractionModel.find({
      userId,
      interactionType: 'watched',
    })
      .sort({ watchedAt: -1 })
      .limit(limit)
      .populate('movieId')
      .exec();

    return interactions.map((interaction) => {
      const movieData =
        interaction.movieId instanceof Types.ObjectId
          ? interaction.movieId
          : (interaction.movieId as IMovieDocument).toObject();
      return movieData;
    });
  }

  async getUserWatchlist(
    userId: Types.ObjectId,
    paginationOptions: IPaginationOptions,
    filterOptions: MovieFilterOptions,
  ): Promise<IPaginatedResponse<IMovie>> {
    const { page, limit, sortBy, sortOrder } = paginationOptions;
    const skip = (page - 1) * limit;

    // Build filter pipeline (shared between count and data queries)
    const filterPipeline: PipelineStage[] = [
      { $match: { userId, interactionType: 'watchlist' } },
      {
        $lookup: {
          from: 'movies',
          localField: 'movieId',
          foreignField: '_id',
          as: 'movie',
        },
      },
      { $unwind: '$movie' },
    ];

    // Apply movie filters
    const movieFilters: Record<string, unknown> = {};

    if (filterOptions.search) {
      const sanitized = filterOptions.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      movieFilters.$or = [{ 'movie.title': { $regex: sanitized, $options: 'i' } }];
    }

    if (filterOptions.genre) {
      movieFilters['movie.genres'] = { $in: [filterOptions.genre] };
    }

    if (filterOptions.minRating !== undefined) {
      movieFilters['movie.rating'] = { $gte: filterOptions.minRating };
    }

    if (filterOptions.year) {
      movieFilters['movie.year'] = filterOptions.year;
    }

    if (Object.keys(movieFilters).length > 0) {
      filterPipeline.push({ $match: movieFilters });
    }

    // Use $facet to get both count and data in a single query
    let sortField: string;
    if (sortBy === 'lastUpdated') {
      // Sort by when the movie was added to watchlist (interaction's createdAt)
      sortField = 'createdAt';
    } else {
      // Sort by movie fields (year, rating, genre, etc.)
      sortField = `movie.${sortBy}`;
    }
    const sortObj: Record<string, 1 | -1> = {};
    sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

    const facetPipeline: PipelineStage[] = [
      ...filterPipeline,
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $sort: sortObj },
            { $skip: skip },
            { $limit: limit },
            { $replaceRoot: { newRoot: '$movie' } },
          ],
        },
      },
    ];

    const result = await MovieInteractionModel.aggregate(facetPipeline).exec();

    const total = result[0]?.metadata[0]?.total || 0;
    const movies: IMovie[] = result[0]?.data || [];
    const totalPages = Math.ceil(total / limit);

    return {
      data: movies as IMovie[],
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

  async getUserStats(userId: Types.ObjectId): Promise<IUserInteractionStats> {
    const watchCount = await MovieInteractionModel.countDocuments({
      userId,
      interactionType: 'watched',
      isCompleted: true,
    });

    const watchlistCount = await MovieInteractionModel.countDocuments({
      userId,
      interactionType: 'watchlist',
    });

    const ratingStats = await MovieInteractionModel.aggregate([
      { $match: { userId, interactionType: 'rated', rating: { $exists: true } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    return {
      totalWatches: watchCount,
      watchlistCount,
      averageRating: ratingStats[0]?.averageRating || undefined,
      totalRatings: ratingStats[0]?.totalRatings || 0,
    };
  }

  async getMovieStats(movieId: Types.ObjectId): Promise<IMovieInteractionStats> {
    const watchCount = await MovieInteractionModel.countDocuments({
      movieId,
      interactionType: 'watched',
    });

    const watchlistCount = await MovieInteractionModel.countDocuments({
      movieId,
      interactionType: 'watchlist',
    });

    const ratingStats = await MovieInteractionModel.aggregate([
      { $match: { movieId, interactionType: 'rated', rating: { $exists: true } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    return {
      totalWatches: watchCount,
      watchlistCount,
      averageRating: ratingStats[0]?.averageRating || undefined,
      totalRatings: ratingStats[0]?.totalRatings || 0,
    };
  }

  async getUserContinueWatching(
    userId: Types.ObjectId,
    limit = 10,
  ): Promise<({ watchProgress: number } & IMovie)[]> {
    const interactions = await MovieInteractionModel.find({
      userId,
      interactionType: 'watched',
      isCompleted: false,
      watchProgress: { $gt: 0 },
    })
      .sort({ watchedAt: -1 })
      .limit(limit)
      .populate('movieId')
      .exec();

    return interactions.map((interaction) => {
      const movieData =
        interaction.movieId instanceof Types.ObjectId
          ? interaction.movieId
          : (interaction.movieId as IMovieDocument).toObject();
      const interactionData = interaction.toObject();

      return {
        ...movieData,
        watchProgress: interactionData.watchProgress,
      };
    });
  }

  async delete(userId: Types.ObjectId, movieId: Types.ObjectId, interactionType: string) {
    return await MovieInteractionModel.deleteOne({ userId, movieId, interactionType });
  }
}
