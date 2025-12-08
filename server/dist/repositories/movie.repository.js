"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieRepository = void 0;
const Movie_1 = require("../models/Movie");
const mongoose_1 = __importDefault(require("mongoose"));
class MovieRepository {
    async findAll(options) {
        const page = options?.page || 1;
        const limit = options?.limit || 10;
        if (mongoose_1.default.connection.readyState !== 1) {
            return { data: [], page, limit, total: 0, totalPages: 0 };
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            Movie_1.MovieModel.find().skip(skip).limit(limit),
            Movie_1.MovieModel.countDocuments(),
        ]);
        return {
            data: data,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
    async findById(id) {
        return Movie_1.MovieModel.findById(id);
    }
    // async create(movieData: IMovie): Promise<IMovieDocument> {
    //   const movie = new MovieModel(movieData);
    //   return movie.save() as any;
    // }
    async upsert(movieData) {
        await Movie_1.MovieModel.findOneAndUpdate({ imdbId: movieData.imdbId }, movieData, {
            upsert: true,
            new: true,
        });
    }
    async create(movieData) {
        await Movie_1.MovieModel.create(movieData);
    }
    async findByImdbId(imdbId) {
        return Movie_1.MovieModel.findOne({ imdbId: imdbId });
    }
}
exports.MovieRepository = MovieRepository;
