import cron from 'node-cron';
import { ScraperEngine } from './ScraperEngine';
import { logger } from '../../utils/logger';

export class ScraperScheduler {
  private _engine = new ScraperEngine();
  private _isScraping: boolean = false;

  public init() {
    this.runStartupScrape();
    this.scheduleNightlyScrape();
  }

  private async runStartupScrape() {
    logger.info('Server Startup: Triggering initial quick scrape...');
    this.safeScrape(1, 1).catch((err) => logger.error(`Startup scrape failed: ${err.message}`));
  }

  private scheduleNightlyScrape() {
    cron.schedule('0 3 * * *', async () => {
      logger.info('Cron Job: Starting nightly deep scrape...');
      await this.safeScrape(1, 50);
    });
    logger.info('Nightly scrape scheduled for 03:00 AM');
  }

  private async safeScrape(startPage: number, endPage: number) {
    if (this._isScraping) {
      logger.warn('⚠️ Scrape skipped: Another scrape is already in progress.');
      return;
    }

    this._isScraping = true;
    let startTime = Date.now();

    try {
      for (let i = startPage; i <= endPage; i++) {
        await this._engine.scrapePage(i);

        if (i < endPage) await new Promise((r) => setTimeout(r, 3000));
      }

      let duration = ((Date.now() - startTime) / 1000).toFixed(1);
      logger.info(`Scrape Complete. Duration: ${duration}s`);
    } catch (error) {
      logger.error(`Critical Scraper Error: ${error}`);
    } finally {
      this._isScraping = false;
    }
  }
}
