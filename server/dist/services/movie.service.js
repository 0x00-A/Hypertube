"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieService = void 0;
const movie_repository_1 = require("../repositories/movie.repository");
const repo = new movie_repository_1.MovieRepository();
class MovieService {
    async list(page = 1, limit = 10) {
        return repo.findAll({ page, limit });
    }
    async get(id) {
        return repo.findById(id);
    }
}
exports.MovieService = MovieService;
