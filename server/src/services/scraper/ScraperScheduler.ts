import cron, { ScheduledTask } from 'node-cron';
import { ScraperEngine } from './ScraperEngine';
import { logger } from '../../utils/logger';
import { MovieRepository } from '../../repositories/movie.repository';

export class ScraperScheduler {
  private _engine = new ScraperEngine();
  private _movieRepository = new MovieRepository();
  private _isScraping: boolean = false;
  private _cronTask: ScheduledTask | null = null;
  private _abortController: AbortController | null = null;

  public init(): void {
    this.runStartupScrape();
    this.scheduleNightlyScrape();
  }

  public stop(): void {
    logger.info('Stopping ScraperScheduler...');

    if (this._cronTask) {
      this._cronTask.stop();
      this._cronTask = null;
      logger.info('Cron job stopped successfully');
    }

    if (this._abortController) {
      this._abortController.abort();
      logger.info('Scrape operation aborted');
    }

    if (this._isScraping) {
      logger.warn('Scrape in progress will complete current page then exit');
    }
  }

  private async runStartupScrape(): Promise<void> {
    const movieCount = (
      await this._movieRepository.findAll({
        limit: 50,
        page: 1,
        sortBy: 'lastUpdated',
        sortOrder: 'desc',
      })
    ).pagination.total;

    if (movieCount < 50) {
      logger.info('Server Startup: Triggering initial quick scrape...');
      this.safeScrape(1, 1).catch((err) => logger.error({ err }, 'Startup scrape failed'));
    }
  }

  private scheduleNightlyScrape(): void {
    this._cronTask = cron.schedule('0 3 * * *', async () => {
      logger.info('Cron Job: Starting nightly deep scrape...');
      await this.safeScrape(1, 50);
    });

    logger.info('Nightly scrape scheduled for 03:00 AM');
  }

  private async safeScrape(startPage: number, endPage: number): Promise<void> {
    if (this._isScraping) {
      logger.warn('⚠️ Scrape skipped: Another scrape is already in progress.');
      return;
    }

    this._isScraping = true;
    this._abortController = new AbortController();
    const startTime = Date.now();

    try {
      for (let i = startPage; i <= endPage; i++) {
        // Check abort signal before each page
        if (this._abortController.signal.aborted) {
          logger.info('Scrape cancelled: Scheduler stopped');
          break;
        }

        await this._engine.scrapePage(i);

        // Check abort signal before delay
        if (i < endPage && !this._abortController.signal.aborted) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      logger.info(`Scrape Complete. Duration: ${duration}s`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error({ err }, 'Critical Scraper Error');
    } finally {
      this._isScraping = false;
      this._abortController = null;
    }
  }
}
