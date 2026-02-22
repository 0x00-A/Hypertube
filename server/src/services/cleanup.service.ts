import cron, { ScheduledTask } from 'node-cron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { MovieModel } from '../models/Movie';
import { logger } from '../utils/logger';

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * CleanupService — Automatically deletes locally-cached movie files
 * that have not been watched for more than one month.
 */
export class CleanupService {
  private _cronTask: ScheduledTask | null = null;
  private _isRunning = false;

  // Start the daily cleanup cron job (04:00 AM every day).
  public init(): void {
    this._cronTask = cron.schedule('0 4 * * *', () => {
      this.run().catch((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error({ err }, 'Cleanup cron job failed');
      });
    });

    logger.info('CleanupService: Daily cleanup scheduled for 04:00 AM');
  }

  public stop(): void {
    if (this._cronTask) {
      this._cronTask.stop();
      this._cronTask = null;
      logger.info('CleanupService: Cron job stopped');
    }
  }

  public async run(): Promise<number> {
    if (this._isRunning) {
      logger.warn('CleanupService: Cleanup already in progress, skipping');
      return 0;
    }

    this._isRunning = true;
    const cutoffDate = new Date(Date.now() - ONE_MONTH_MS);

    logger.info(
      { cutoffDate: cutoffDate.toISOString() },
      'CleanupService: Starting cleanup of unwatched movies',
    );

    try {
      const staleMovies = await MovieModel.find({
        downloadStatus: 'downloaded',
        lastWatched: { $lt: cutoffDate },
      }).select('_id title imdbId localPath lastWatched');

      if (staleMovies.length === 0) {
        logger.info('CleanupService: No stale movies to clean up');
        return 0;
      }

      logger.info({ count: staleMovies.length }, 'CleanupService: Found stale movies to delete');

      let deletedCount = 0;

      for (const movie of staleMovies) {
        try {
          // Delete the file/directory from disk
          if (movie.localPath) {
            await this.deleteFromDisk(movie.localPath);
          }

          // Reset the movie document
          movie.downloadStatus = 'not_downloaded';
          movie.localPath = undefined;
          await movie.save();

          deletedCount++;
          logger.info(
            { movieId: movie._id, title: movie.title, imdbId: movie.imdbId },
            'CleanupService: Deleted cached movie file',
          );
        } catch (movieError: unknown) {
          const err = movieError instanceof Error ? movieError : new Error(String(movieError));
          logger.error(
            { err, movieId: movie._id, title: movie.title },
            'CleanupService: Failed to clean up movie',
          );
        }
      }

      logger.info(
        { deletedCount, totalStale: staleMovies.length },
        'CleanupService: Cleanup complete',
      );

      return deletedCount;
    } finally {
      this._isRunning = false;
    }
  }

  private async deleteFromDisk(filePath: string): Promise<void> {
    try {
      const resolved = path.resolve(filePath);
      const stat = await fs.stat(resolved);

      if (stat.isDirectory()) {
        await fs.rm(resolved, { recursive: true, force: true });
      } else {
        await fs.unlink(resolved);
      }
    } catch (error: unknown) {
      // If the file is already gone, that's fine
      if (
        error instanceof Error &&
        'code' in error &&
        (error as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        logger.warn({ filePath }, 'CleanupService: File already removed from disk');
        return;
      }
      throw error;
    }
  }
}

export const cleanupService = new CleanupService();
