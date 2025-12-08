"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YtsProvider = void 0;
const BaseProvider_1 = require("./BaseProvider");
const env_1 = require("../../../config/env");
const logger_1 = require("../../../utils/logger");
class YtsProvider extends BaseProvider_1.BaseProvider {
    constructor() {
        super('YTS', env_1.env.YTS_BASE_API_URL);
    }
    async scrape(page) {
        try {
            const { data } = await this.api.get('/list_movies.json', {
                params: { page, limit: 50, sort_by: 'download_count' },
            });
            const movies = data.data.movies || [];
            return movies.map((m) => this.normalize(m));
        }
        catch (error) {
            logger_1.logger.error(`[YTS] Error scraping page ${page}: ${error.message}`);
            return [];
        }
    }
    normalize(m) {
        return {
            imdbId: m.imdb_code,
            title: m.title,
            year: m.year,
            slug: m.slug,
            torrents: (m.torrents ?? []).map((t) => ({
                url: t.url,
                hash: t.hash,
                quality: t.quality,
                type: t.type,
                videoCodec: t.video_codec,
                seeds: t.seeds,
                peers: t.peers,
                size: t.size,
                sizeBytes: t.size_bytes,
                provider: 'YTS',
            })),
        };
    }
}
exports.YtsProvider = YtsProvider;
