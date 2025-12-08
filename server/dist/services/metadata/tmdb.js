"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetadata = getMetadata;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
const logger_1 = require("../../utils/logger");
const TMDB_KEY = env_1.env.TMDB_API_ACCESS_TOKEN;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';
/**
 * Fetches movie metadata from TMDB API using an IMDb ID
 * @param imdbId - The IMDb ID of the movie (e.g., "tt1234567")
 * @returns Movie metadata object with title, year, images, etc., or null if not found
 */
async function getMetadata(imdbId) {
    if (!imdbId || !/^tt\d+$/.test(imdbId)) {
        logger_1.logger.warn({ imdbId }, 'Invalid ID');
        return null;
    }
    // find is better than search because it guarantees the exact match
    const url = `${TMDB_BASE}/find/${imdbId}?external_source=imdb_id`;
    const { data } = await axios_1.default.get(url, {
        headers: {
            Authorization: `Bearer ${TMDB_KEY}`,
        },
    });
    const tmdbMovie = data.movie_results[0];
    if (!tmdbMovie)
        return null;
    // fetch Details and Trailer
    const detailUrl = `${TMDB_BASE}/movie/${tmdbMovie.id}?append_to_response=videos`;
    const detailRes = await axios_1.default.get(detailUrl, {
        headers: {
            Authorization: `Bearer ${TMDB_KEY}`,
        },
    });
    const details = detailRes.data;
    const youtubeTrailer = details.videos.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer');
    const trailerUrl = youtubeTrailer ? `https://www.youtube.com/watch?v=${youtubeTrailer.key}` : '';
    return {
        title: details.title,
        year: typeof details.release_date === 'string' && details.release_date.contains('-')
            ? parseInt(details.release_date.split('-')[0], 10)
            : 0,
        synopsis: details.overview,
        duration: details.runtime,
        rating: details.vote_average,
        genres: details.genres.map((g) => g.name),
        language: details.original_language,
        images: {
            poster: `${IMAGE_BASE}/w500${details.poster_path}`,
            backdrop: `${IMAGE_BASE}/original${details.backdrop_path}`,
            thumbnail: `${IMAGE_BASE}/w200${details.poster_path}`,
        },
        trailer: trailerUrl,
    };
}
