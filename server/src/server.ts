import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';
import pino from 'pino';
import { ScraperScheduler } from './services/scraper/ScraperScheduler';

const logger = pino();

(async () => {
  try {
    await connectDatabase();
    const app = createApp();
    const port = env.PORT;
    const server = app.listen(port, () => logger.info({ port }, 'Server started'));

    const scheduler = new ScraperScheduler();
    scheduler.init();

    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Received shutdown signal');

      // Set a timeout to force exit if graceful shutdown takes too long
      const forceExitTimeout = setTimeout(() => {
        logger.warn('Forcing exit after timeout');
        process.exit(1);
      }, 2000); // 5 seconds max for graceful shutdown

      server.close(async () => {
        await disconnectDatabase();
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
  } catch (err) {
    logger.error({ err }, 'Startup failure');
    process.exit(1);
  }
})();
