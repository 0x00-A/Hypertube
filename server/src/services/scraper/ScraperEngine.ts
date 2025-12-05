import { YtsProvider } from './providers/YtsProvider';

export class ScraperEngine {
  private _providers = [new YtsProvider()];

  async scrapeAllSources(page: number) {
    console.log(`\n--- Scraping Page ${page} ---`);

    const promises = this._providers.map((provider) => provider.scrape(page));
    const results = await Promise.all(promises);

    const allMovies = results.flat();

    console.log(`Scraped ${allMovies.length} movies from all providers on page ${page}.`);
  }
}
