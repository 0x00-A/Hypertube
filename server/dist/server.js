"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const pino_1 = __importDefault(require("pino"));
const ScraperScheduler_1 = require("./services/scraper/ScraperScheduler");
const logger = (0, pino_1.default)();
(async () => {
    try {
        await (0, database_1.connectDatabase)();
        const app = (0, app_1.createApp)();
        const port = env_1.env.PORT;
        const server = app.listen(port, () => logger.info({ port }, 'Server started'));
        const scheduler = new ScraperScheduler_1.ScraperScheduler();
        scheduler.init();
        const shutdown = async (signal) => {
            logger.info({ signal }, 'Received shutdown signal');
            // Set a timeout to force exit if graceful shutdown takes too long
            const forceExitTimeout = setTimeout(() => {
                logger.warn('Forcing exit after timeout');
                process.exit(1);
            }, 2000); // 5 seconds max for graceful shutdown
            server.close(async () => {
                await (0, database_1.disconnectDatabase)();
                logger.info('HTTP server closed');
                clearTimeout(forceExitTimeout);
                process.exit(0);
            });
            // Force close if no active connections after 2 seconds
            setTimeout(() => {
                logger.warn('Forcefully closing remaining connections');
                server.closeAllConnections();
            }, 2000);
        };
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    }
    catch (err) {
        logger.error({ err }, 'Startup failure');
        process.exit(1);
    }
})();
