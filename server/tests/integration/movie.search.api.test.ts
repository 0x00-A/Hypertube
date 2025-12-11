import request from 'supertest';
import { createApp } from '../../src/app';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ScraperEngine } from '../../src/services/scraper/ScraperEngine';
import { MovieRepository } from '../../src/repositories/movie.repository';
import { BaseProvider } from '../../src/services/scraper/providers/BaseProvider';
import { IScrapedMovie } from '../../src/interfaces/movie.interface';

// Mock provider for search endpoint
class MockYtsProvider extends BaseProvider {
  constructor() {
    super('MockYTS', 'http://mock-yts.com');
  }
  async scrape(_page: number): Promise<IScrapedMovie[]> {
    return [];
  }
  async search(): Promise<IScrapedMovie[]> {
    return [
      {
        imdbId: 'tt0111161',
        title: 'The Shawshank Redemption',
        year: 1994,
        slug: 'the-shawshank-redemption-1994',
        torrents: [],
      },
    ];
  }
}

describe('Movie Search API', () => {
  let mongoServer: MongoMemoryServer;
  let app: ReturnType<typeof createApp>;
  let engine: ScraperEngine;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    engine = new ScraperEngine();
    // Replace providers with mock
    (engine as any)._providers = [new MockYtsProvider()];
    app = createApp();
  });

  it('should return movies from the search endpoint', async () => {
    // Pre-populate DB with a movie
    const repo = new MovieRepository();
    await repo.create({
      imdbId: 'tt0111161',
      //   tmdbId: '278',
      title: 'The Shawshank Redemption',
      year: 1994,
      images: { poster: '', backdrop: '', thumbnail: '' },
      torrents: [],
      downloadStatus: 'not_downloaded',
      lastUpdated: new Date(),
    });
    const res = await request(app)
      .get('/api/v1/movies/search')
      .query({ search: 'Shawshank', page: 1, limit: 10 });
    expect(res.status).toBe(200);
    expect(res.body.data.data).toBeDefined();
    expect(res.body.data.data[0].title).toBe('The Shawshank Redemption');
  });

  it('should return empty array if no match', async () => {
    const res = await request(app)
      .get('/api/v1/movies/search')
      .query({ search: 'Nonexistent', page: 1, limit: 10 });
    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBe(0);
  });
});
