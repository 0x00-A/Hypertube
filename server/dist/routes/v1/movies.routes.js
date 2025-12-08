"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const movie_controller_1 = require("../../controllers/movie.controller");
const validate_1 = require("../../middleware/validate");
const movie_schema_1 = require("../../validators/movie.schema");
exports.router = (0, express_1.Router)();
/**
 * @openapi
 * /v1/movies:
 *   get:
 *     summary: List movies (placeholder)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated movies
 */
exports.router.get('/', (0, validate_1.validate)(movie_schema_1.MovieListQuerySchema), movie_controller_1.listMovies);
/**
 * @openapi
 * /v1/movies/{id}:
 *   get:
 *     summary: Get a movie (placeholder)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Movie found
 *       404:
 *         description: Not found
 */
exports.router.get('/:id', (0, validate_1.validate)(movie_schema_1.MovieIdParamSchema), movie_controller_1.getMovie);
