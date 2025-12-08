"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMovies = listMovies;
exports.getMovie = getMovie;
const movie_service_1 = require("../services/movie.service");
const service = new movie_service_1.MovieService();
async function listMovies(req, res, next) {
    try {
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '10', 10);
        const result = await service.list(page, limit);
        res.json({
            data: result.data,
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        });
    }
    catch (err) {
        next(err);
    }
}
async function getMovie(req, res, next) {
    try {
        const movie = await service.get(req.params.id);
        if (!movie)
            return res.status(404).json({ message: 'Not found' });
        res.json(movie);
    }
    catch (err) {
        next(err);
    }
}
