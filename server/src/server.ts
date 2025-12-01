import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';
import pino from 'pino';

const logger = pino();

(async () => {
  try {
    await connectDatabase();
    const app = createApp();
    const port = env.PORT;
    const server = app.listen(port, () => logger.info({ port }, 'Server started'));

    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Received shutdown signal');
      server.close(async () => {
        await disconnectDatabase();
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.error({ err }, 'Startup failure');
    process.exit(1);
  }
})();
