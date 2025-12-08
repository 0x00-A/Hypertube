"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperEngine = void 0;
const YtsProvider_1 = require("./providers/YtsProvider");
const movie_repository_1 = require("../../repositories/movie.repository");
const tmdb_1 = require("../metadata/tmdb");
const logger_1 = require("../../utils/logger");
class ScraperEngine {
    _providers = [new YtsProvider_1.YtsProvider()];
    _movieRepository = new movie_repository_1.MovieRepository();
    async scrapePage(page) {
        logger_1.logger.info(`\n--- Scraping Page ${page} ---`);
        const promises = this._providers.map((provider) => provider.scrape(page));
        const results = await Promise.all(promises);
        const partialMovies = results.flat();
        logger_1.logger.info(`Scraped ${partialMovies.length} movies from all providers on page ${page}.`);
        for (const partial of partialMovies) {
            await this.fillMetadataAndUpsertMovie(partial);
        }
    }
    // Add metadata to new scraped movie or update torrents for existing movie
    async fillMetadataAndUpsertMovie(partial) {
        if (!partial.imdbId)
            return;
        const existingMovie = await this._movieRepository.findByImdbId(partial.imdbId);
        if (existingMovie) {
            let hasNewTorrents = false;
            for (const t of partial.torrents) {
                const duplicate = existingMovie.torrents.some((et) => et.hash === t.hash);
                if (!duplicate) {
                    existingMovie.torrents.push(t);
                    hasNewTorrents = true;
                }
            }
            if (hasNewTorrents) {
                existingMovie.lastUpdated = new Date();
                await existingMovie.save();
                logger_1.logger.info(`Updated torrents for ${existingMovie.title}`);
            }
        }
        else {
            logger_1.logger.info(`✨ New Movie Found: ${partial.title}. Fetching metadata...`);
            const metadata = await (0, tmdb_1.getMetadata)(partial.imdbId);
            if (metadata) {
                const completeMovie = {
                    ...partial,
                    ...metadata,
                    torrents: partial.torrents,
                };
                await this._movieRepository.create(completeMovie);
                logger_1.logger.info(`Created DB Entry: ${completeMovie.title}`);
            }
            else {
                logger_1.logger.warn(`⚠️ Failed to find metadata for ${partial.imdbId}. Skipping.`);
            }
        }
    }
}
exports.ScraperEngine = ScraperEngine;
