"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const ScraperEngine_1 = require("./ScraperEngine");
const logger_1 = require("../../utils/logger");
const movie_repository_1 = require("../../repositories/movie.repository");
class ScraperScheduler {
    _engine = new ScraperEngine_1.ScraperEngine();
    _movieRepository = new movie_repository_1.MovieRepository();
    _isScraping = false;
    init() {
        this.runStartupScrape();
        this.scheduleNightlyScrape();
    }
    async runStartupScrape() {
        const movieCount = (await this._movieRepository.findAll({ limit: 50, page: 1 })).total;
        if (movieCount < 50) {
            logger_1.logger.info('Server Startup: Triggering initial quick scrape...');
            this.safeScrape(1, 1).catch((err) => logger_1.logger.error(`Startup scrape failed: ${err.message}`));
        }
    }
    scheduleNightlyScrape() {
        node_cron_1.default.schedule('0 3 * * *', async () => {
            logger_1.logger.info('Cron Job: Starting nightly deep scrape...');
            await this.safeScrape(1, 50);
        });
        logger_1.logger.info('Nightly scrape scheduled for 03:00 AM');
    }
    async safeScrape(startPage, endPage) {
        if (this._isScraping) {
            logger_1.logger.warn('⚠️ Scrape skipped: Another scrape is already in progress.');
            return;
        }
        this._isScraping = true;
        let startTime = Date.now();
        try {
            for (let i = startPage; i <= endPage; i++) {
                await this._engine.scrapePage(i);
                if (i < endPage)
                    await new Promise((r) => setTimeout(r, 3000));
            }
            let duration = ((Date.now() - startTime) / 1000).toFixed(1);
            logger_1.logger.info(`Scrape Complete. Duration: ${duration}s`);
        }
        catch (error) {
            logger_1.logger.error(`Critical Scraper Error: ${error}`);
        }
        finally {
            this._isScraping = false;
        }
    }
}
exports.ScraperScheduler = ScraperScheduler;
