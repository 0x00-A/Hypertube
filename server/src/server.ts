import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './utils/logger';
import http from 'http';
import { scraperScheduler as scheduler } from './services/scraper/ScraperScheduler';

let server: http.Server | null = null;
let isShuttingDown = false;

const shutdown = async (signal: string) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  logger.info({ signal }, 'Received shutdown signal');

  try {
    if (scheduler) {
      scheduler.stop();
      logger.info('Scheduler stopped');
    }

    // Close server and wait for existing connections
    if (server) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          logger.warn('Forcing server close after timeout');
          server!.closeAllConnections();
          resolve();
        }, 3000);

        server!.close((err) => {
          clearTimeout(timeout);
          if (err) {
            logger.error({ err }, 'Error closing server');
            reject(err);
          } else {
            logger.info('HTTP server closed');
            resolve();
          }
        });
      });
    }

    // Disconnect database
    await disconnectDatabase();
    logger.info('Database disconnected');
    logger.info('Graceful shutdown complete');

    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
};

// These handlers ensure graceful shutdown instead of ugly crashes
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error | unknown, promise: Promise<unknown>) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logger.error(
    {
      error: err.message,
      stack: err.stack,
      promise,
    },
    '💥 UNHANDLED REJECTION! Shutting down gracefully...',
  );
  void shutdown('UNHANDLED_REJECTION');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error(
    {
      error: err.message,
      stack: err.stack,
    },
    '💥 UNCAUGHT EXCEPTION! Shutting down immediately...',
  );
  void shutdown('UNCAUGHT_EXCEPTION');
});

// Handle termination signals (Docker/Kubernetes)
process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

(async () => {
  try {
    await connectDatabase();
    const app = createApp();
    const port = env.PORT;
    server = app.listen(port, () => logger.info({ port }, 'Server started'));

    // scheduler.init();
  } catch (err) {
    logger.error({ err }, 'Startup failure');
    process.exit(1);
  }
})();
