import mongoose from 'mongoose';
import pino from 'pino';
import { env } from './env';

const logger = pino();

let connectionAttempts = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.isDev,
      maxPoolSize: 20,
    });
    logger.info({ state: mongoose.connection.readyState }, 'MongoDB connected');
  } catch (err) {
    connectionAttempts++;
    logger.error({ err, attempts: connectionAttempts }, 'MongoDB connection error');
    if (connectionAttempts < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * connectionAttempts));
      return connectDatabase();
    }
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
  logger.info('MongoDB disconnected');
}

export function dbHealth() {
  return { readyState: mongoose.connection.readyState };
}
