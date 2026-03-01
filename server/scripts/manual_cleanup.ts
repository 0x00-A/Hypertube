import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { logger } from '../src/utils/logger';
import { cleanupService } from '../src/services/cleanup.service';

async function runCleanup() {
  try {
    if (!env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not set in env');
    }

    logger.info('Connecting to database...');
    await mongoose.connect(env.MONGODB_URI);

    logger.info('Connected to database. Starting manual cleanup...');
    const deletedCount = await cleanupService.run();

    logger.info(`Manual cleanup completed. Deleted ${deletedCount} movies.`);
    await mongoose.disconnect();
    logger.info('Disconnected from database.');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Manual cleanup failed');
    process.exit(1);
  }
}

runCleanup();
