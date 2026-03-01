jest.mock('../../../src/services/metadata/tmdb', () => ({
  getMetadata: jest.fn().mockImplementation((id: number | string) => {
    return Promise.resolve({
      tmdbId: typeof id === 'number' ? id : parseInt(id as string, 10) || 12345,
      imdbId: 'tt1234567',
      title: 'Mocked Movie',
      year: 2024,
      description: 'Mock desc.',
      rating: 8.5,
      genres: ['Action'],
      director: 'Mock Director',
      cast: [{ name: 'Actor 1', character: 'Hero', profileImageUrl: '' }],
      length: 120,
      images: {
        thumbnail: 'https://example.com/thumb.jpg',
        poster: 'https://example.com/poster.jpg',
        backdrop: 'https://example.com/backdrop.jpg',
      },
      trailer: 'https://youtube.com/watch?v=mock',
    });
  }),
  getImdbIdFromTmdbId: jest.fn().mockResolvedValue('tt1234567')
}));

jest.mock('axios', () => {
  const mockGet = jest.fn((url: string, config?: any) => {
    let page = 1;
    if (url.includes('page=')) {
        const match = url.match(/page=(\d+)/);
        if (match) page = parseInt(match[1], 10);
    } else if (config && config.params && config.params.page) {
        page = config.params.page;
    }

    if (url.includes('/trending/') || url.includes('/popular') || url.includes('/recommendations') || url.includes('/search/movie')) {
      return Promise.resolve({
        data: {
          page: page,
          total_results: 1,
          total_pages: 5,
          results: [
            {
              id: 278,
              title: 'The Shawshank Redemption',
              release_date: '1994-09-23',
              poster_path: '/poster.jpg',
              backdrop_path: '/backdrop.jpg',
              overview: 'Mocked overview',
              vote_average: 9.3,
              genre_ids: [18, 80],
              original_language: 'en'
            }
          ]
        }
      });
    }
    return Promise.resolve({ data: {} });
  });

  return {
    get: mockGet,
    create: jest.fn(() => ({
      get: mockGet,
      post: jest.fn(() => Promise.resolve({ data: {} })),
      put: jest.fn(() => Promise.resolve({ data: {} })),
      delete: jest.fn(() => Promise.resolve({ data: {} })),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() }
      }
    }))
  };
});

import request from 'supertest';
import { createApp } from '../../../src/app';
import mongoose from 'mongoose';
import { Types } from 'mongoose';
// Removed per-file MongoMemoryServer usage
import { scraperEngine } from '../../../src/services/scraper/ScraperEngine';
import { MovieRepository } from '../../../src/repositories/movie.repository';
import { BaseProvider } from '../../../src/services/scraper/providers/BaseProvider';
import { IScrapedMovie } from '../../../src/interfaces/movie.interface';
import { UserModel } from '../../../src/models/User';

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
        rating: 9.3,
        torrents: [],
      },
    ];
  }
}

describe('Movie Search API', () => {
  let app: ReturnType<typeof createApp>['app'];

  // Helper to create a user and get a valid access token via API
  async function createUserAndLogin(): Promise<{ accessToken: string; userId: Types.ObjectId }> {
    const crypto = await import('crypto');
    const { VerificationEmailModel } = await import('../../../src/models/VerificationEmail.model');

    const unique = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const testUsername = `u_${unique}`;
    const testEmail = `test_${unique}@example.com`;
    const password = 'SecurePass123!';

    // Sign up
    const signupRes = await request(app).post('/api/v1/auth/signup').send({
      email: testEmail,
      username: testUsername,
      password,
      firstName: 'Test',
      lastName: 'User',
    });

    if (signupRes.status !== 201) {
      throw new Error(
        `Signup failed with status ${signupRes.status}: ${JSON.stringify(signupRes.body)}`,
      );
    }

    // Get user and verify email using the endpoint
    const user = await UserModel.findOne({ username: testUsername });
    if (!user) throw new Error('User not found after signup');

    // Create a test token and verify email through the endpoint
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    await VerificationEmailModel.findOneAndUpdate({ userId: user._id }, { token: hashedToken });
    await request(app).post('/api/v1/auth/verify-email').send({ token: rawToken });

    // Login
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      identifier: testUsername,
      password,
    });
    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    const accessToken = cookies
      .find((cookie: string) => cookie.startsWith('accessToken='))
      ?.split(';')[0]
      .split('=')[1];
    if (!accessToken) throw new Error('No accessToken found in login response');
    return { accessToken, userId: user._id };
  }

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    // Replace providers in the singleton
    (scraperEngine as any)._providers = [new MockYtsProvider()];
    app = createApp().app;
  });

  it('should return movies from the search endpoint', async () => {
    const { accessToken } = await createUserAndLogin();
    // Pre-populate DB with a movie
    const repo = new MovieRepository();
    await repo.create({
      imdbId: 'tt0111161',
      tmdbId: 278,
      title: 'The Shawshank Redemption',
      year: 1994,
      images: { poster: '', backdrop: '', thumbnail: '' },
      torrents: [],
      downloadStatus: 'not_downloaded',
      lastUpdated: new Date(),
    });
    const res = await request(app)
      .get('/api/v1/movies/search')
      .set('Cookie', [`accessToken=${accessToken}`])
      .query({ search: 'Shawshank', page: 1, limit: 10 });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data[0].title).toBe('The Shawshank Redemption');
  });

  it('should return empty array if no match', async () => {
    const { accessToken } = await createUserAndLogin();
    const res = await request(app)
      .get('/api/v1/movies/search')
      .set('Cookie', [`accessToken=${accessToken}`])
      .query({ search: 'Nonexistent', page: 1, limit: 10 });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });
});
