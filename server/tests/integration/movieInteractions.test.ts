import request from 'supertest';
import { createApp } from '../../src/app';
import { MovieInteractionModel } from '../../src/models/MovieInteraction';
import { MovieModel } from '../../src/models/Movie';
import { UserModel } from '../../src/models/User';
import mongoose, { Types } from 'mongoose';
import { IMovie } from '../../src/interfaces/movie.interface';

describe('MovieInteraction API Integration Tests', () => {
  const app = createApp();
  let movieId: string;
  let movieId2: string;
  let movieId3: string;
  let movieId4: string;

  async function createUserAndLogin(): Promise<{ accessToken: string; userId: Types.ObjectId }> {
    const crypto = await import('crypto');
    const { VerificationEmailModel } = await import('../../src/models/VerificationEmail.model');

    const unique = Math.random().toString(36).substring(2, 10) + Date.now();
    const testUsername = `testuser_${unique}`;
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
      throw new Error(`Signup failed with status ${signupRes.status}: ${JSON.stringify(signupRes.body)}`);
    }

    // Get user and verify email using the endpoint
    const user = await UserModel.findOne({ username: testUsername });
    if (!user) throw new Error('User not found after signup');

    // Create a test token and verify email through the endpoint
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    await VerificationEmailModel.findOneAndUpdate(
      { userId: user._id },
      { token: hashedToken }
    );
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

  const sampleMovie: Partial<IMovie> = {
    imdbId: 'tt1234567',
    title: 'Test Movie',
    year: 2023,
    rating: 8.5,
    duration: 120,
    synopsis: 'A test movie for interaction testing',
    genres: ['Action', 'Thriller'],
    originalLanguage: 'en',
    images: {
      thumbnail: 'https://example.com/thumb.jpg',
      poster: 'https://example.com/poster.jpg',
      backdrop: 'https://example.com/backdrop.jpg',
    },
    torrents: [
      {
        url: 'magnet:?xt=urn:btih:test',
        hash: 'testhash',
        quality: '1080p',
        type: 'mp4',
        videoCodec: 'x264',
        seeds: 100,
        peers: 50,
        size: '1.5 GB',
        sizeBytes: 1610612736,
        provider: 'YTS',
      },
    ],
    downloadStatus: 'not_downloaded',
    lastUpdated: new Date(),
  };

  beforeAll(async () => {
    await UserModel.deleteMany({});
    await MovieModel.deleteMany({});
    await MovieInteractionModel.deleteMany({});

    // Create test movies (static, only once)
    const movie = await MovieModel.create(sampleMovie);
    movieId = movie._id.toString();
    const movie2 = await MovieModel.create({ ...sampleMovie, imdbId: 'tt9999999' });
    movieId2 = movie2._id.toString();
    const movie3 = await MovieModel.create({ ...sampleMovie, imdbId: 'tt8888888' });
    movieId3 = movie3._id.toString();
    const movie4 = await MovieModel.create({ ...sampleMovie, imdbId: 'tt7777777' });
    movieId4 = movie4._id.toString();
  });

  afterAll(async () => {
    await UserModel.deleteMany({});
    await MovieModel.deleteMany({});
    await MovieInteractionModel.deleteMany({});
  });

  describe('POST /api/v1/interactions/movies/:movieId/progress', () => {
    let accessToken: string;
    beforeEach(async () => {
      if (mongoose.connection.readyState === 1) {
        await MovieInteractionModel.deleteMany({});
      }
      const result = await createUserAndLogin();
      accessToken = result.accessToken;
    });
    it('should update watch progress successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/interactions/movies/${movieId}/progress`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          lastWatchedPosition: 1800, // 30 minutes
          duration: 7200, // 2 hours
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Watch progress updated successfully.');
      expect(res.body.data).toHaveProperty('lastWatchedPosition', 1800);
      expect(res.body.data).toHaveProperty('duration', 7200);
      expect(res.body.data).toHaveProperty('watchProgress');
      expect(res.body.data.isCompleted).toBe(false);
    });

    it('should mark as completed when progress >= 95%', async () => {
      const res = await request(app)
        .post(`/api/v1/interactions/movies/${movieId}/progress`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          lastWatchedPosition: 6900, // 115 minutes
          duration: 7200, // 2 hours
        });

      expect(res.status).toBe(200);
      expect(res.body.data.watchProgress).toBeGreaterThanOrEqual(95);
      expect(res.body.data.isCompleted).toBe(true);
      expect(res.body.data).toHaveProperty('completedAt');
    });

    it('should return 400 for negative position', async () => {
      const res = await request(app)
        .post(`/api/v1/interactions/movies/${movieId}/progress`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          lastWatchedPosition: -10,
          duration: 7200,
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 when position exceeds duration', async () => {
      const res = await request(app)
        .post(`/api/v1/interactions/movies/${movieId}/progress`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          lastWatchedPosition: 8000,
          duration: 7200,
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid movieId format', async () => {
      const res = await request(app)
        .post('/api/v1/interactions/movies/invalid-id/progress')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          lastWatchedPosition: 1800,
          duration: 7200,
        });

      expect(res.status).toBe(400);
    });
  });
  describe('GET /api/v1/interactions/movies/:movieId/progress', () => {
    let accessToken: string;
    let userId: Types.ObjectId;
    beforeEach(async () => {
      if (mongoose.connection.readyState === 1) {
        await MovieInteractionModel.deleteMany({});
      }
      const result = await createUserAndLogin();
      accessToken = result.accessToken;
      userId = result.userId;
      await MovieInteractionModel.create({
        userId,
        movieId: new Types.ObjectId(movieId),
        interactionType: 'watched',
        lastWatchedPosition: 1800,
        duration: 7200,
        watchProgress: 25,
        isCompleted: false,
      });
    });

    it('should get watch progress successfully', async () => {
      const res = await request(app)
        .get(`/api/v1/interactions/movies/${movieId}/progress`)
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Watch progress fetched successfully.');
      expect(res.body.data).toHaveProperty('lastWatchedPosition', 1800);
      expect(res.body.data).toHaveProperty('watchProgress', 25);
    });

    it('should return null for non-existent progress', async () => {
      const newMovieId = new Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/v1/interactions/movies/${newMovieId}/progress`)
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });
  });
  describe('POST /api/v1/interactions/movies/:movieId/rating', () => {
    let accessToken: string;
    beforeEach(async () => {
      if (mongoose.connection.readyState === 1) {
        await MovieInteractionModel.deleteMany({});
      }
      const result = await createUserAndLogin();
      accessToken = result.accessToken;
    });

    it('should rate a movie successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/interactions/movies/${movieId}/rating`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({ rating: 8 });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Movie rated successfully.');
      expect(res.body.data).toHaveProperty('rating', 8);
      expect(res.body.data.interactionType).toBe('rated');
    });

    it('should return 400 for rating below 1', async () => {
      const res = await request(app)
        .post(`/api/v1/interactions/movies/${movieId}/rating`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({ rating: 0 });

      expect(res.status).toBe(400);
    });

    it('should return 400 for rating above 10', async () => {
      const res = await request(app)
        .post(`/api/v1/interactions/movies/${movieId}/rating`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({ rating: 11 });

      expect(res.status).toBe(400);
    });

    it('should update existing rating', async () => {
      await request(app)
        .post(`/api/v1/interactions/movies/${movieId}/rating`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({ rating: 7 });

      const res = await request(app)
        .post(`/api/v1/interactions/movies/${movieId}/rating`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({ rating: 9 });

      expect(res.status).toBe(200);
      expect(res.body.data.rating).toBe(9);
    });
  });

  describe('GET /api/v1/interactions/movies/:movieId/rating', () => {
    let accessToken: string;
    let userId: Types.ObjectId;
    beforeEach(async () => {
      if (mongoose.connection.readyState === 1) {
        await MovieInteractionModel.deleteMany({});
      }
      const result = await createUserAndLogin();
      accessToken = result.accessToken;
      userId = result.userId;
      await MovieInteractionModel.create({
        userId,
        movieId: new Types.ObjectId(movieId),
        interactionType: 'rated',
        rating: 8,
      });
    });

    it('should get user rating successfully', async () => {
      const res = await request(app)
        .get(`/api/v1/interactions/movies/${movieId}/rating`)
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User rating fetched successfully.');
      expect(res.body.data.rating).toBe(8);
    });

    it('should return null for non-existent rating', async () => {
      const newMovieId = new Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/v1/interactions/movies/${newMovieId}/rating`)
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.rating).toBeNull();
    });
  });

  describe('POST /api/v1/interactions/movies/:movieId/watchlist', () => {
    let accessToken: string;
    beforeEach(async () => {
      if (mongoose.connection.readyState === 1) {
        await MovieInteractionModel.deleteMany({});
      }
      const result = await createUserAndLogin();
      accessToken = result.accessToken;
    });

    it('should add movie to watchlist successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/interactions/movies/${movieId}/watchlist`)
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Movie added to watchlist.');
      expect(res.body.data.interactionType).toBe('watchlist');
    });

    it('should handle duplicate watchlist additions gracefully', async () => {
      await request(app)
        .post(`/api/v1/interactions/movies/${movieId}/watchlist`)
        .set('Cookie', [`accessToken=${accessToken}`]);
      const res = await request(app)
        .post(`/api/v1/interactions/movies/${movieId}/watchlist`)
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(201);
      expect(res.body.data.interactionType).toBe('watchlist');
    });
  });

  describe('DELETE /api/v1/interactions/movies/:movieId/watchlist', () => {
    let accessToken: string;
    let userId: Types.ObjectId;
    beforeEach(async () => {
      if (mongoose.connection.readyState === 1) {
        await MovieInteractionModel.deleteMany({});
      }
      const result = await createUserAndLogin();
      accessToken = result.accessToken;
      userId = result.userId;
      await MovieInteractionModel.create({
        userId,
        movieId: new Types.ObjectId(movieId),
        interactionType: 'watchlist',
      });
    });

    it('should remove movie from watchlist successfully', async () => {
      const res = await request(app)
        .delete(`/api/v1/interactions/movies/${movieId}/watchlist`)
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Movie removed from watchlist.');
    });

    it('should return 404 when removing non-existent watchlist item', async () => {
      const newMovieId = new Types.ObjectId().toString();
      const res = await request(app)
        .delete(`/api/v1/interactions/movies/${newMovieId}/watchlist`)
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/interactions/movies/:movieId/stats', () => {
    let accessToken: string;
    beforeEach(async () => {
      if (mongoose.connection.readyState === 1) {
        await MovieInteractionModel.deleteMany({});
      }
      const result = await createUserAndLogin();
      accessToken = result.accessToken;
      // Create multiple interactions
      await MovieInteractionModel.create([
        {
          userId: new Types.ObjectId(),
          movieId: new Types.ObjectId(movieId),
          interactionType: 'watched',
        },
        {
          userId: new Types.ObjectId(),
          movieId: new Types.ObjectId(movieId),
          interactionType: 'watched',
        },
        {
          userId: new Types.ObjectId(),
          movieId: new Types.ObjectId(movieId),
          interactionType: 'rated',
          rating: 8,
        },
        {
          userId: new Types.ObjectId(),
          movieId: new Types.ObjectId(movieId),
          interactionType: 'rated',
          rating: 9,
        },
      ]);
    });

    it('should get movie stats successfully', async () => {
      const res = await request(app)
        .get(`/api/v1/interactions/movies/${movieId}/stats`)
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Movie statistics fetched successfully.');
      expect(res.body.data).toHaveProperty('totalWatches', 2);
      expect(res.body.data).toHaveProperty('totalRatings', 2);
      expect(res.body.data).toHaveProperty('averageRating', 8.5);
      expect(res.body.data).toHaveProperty('watchlistCount');
    });
  });

  describe('GET /api/v1/interactions/history', () => {
    let accessToken: string;
    let userId: Types.ObjectId;
    beforeEach(async () => {
      if (mongoose.connection.readyState === 1) {
        await MovieInteractionModel.deleteMany({});
      }
      const result = await createUserAndLogin();
      accessToken = result.accessToken;
      userId = result.userId;
      await MovieInteractionModel.create([
        {
          userId,
          movieId: new Types.ObjectId(movieId),
          interactionType: 'watched',
          watchedAt: new Date('2024-01-01'),
        },
        {
          userId,
          movieId: new Types.ObjectId(movieId2),
          interactionType: 'watched',
          watchedAt: new Date('2024-01-02'),
        },
      ]);
    });

    it('should get watch history successfully', async () => {
      const res = await request(app)
        .get('/api/v1/interactions/history')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User watch history fetched successfully.');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      // Returns Movie objects, not interactions
      expect(res.body.data[0]).toHaveProperty('imdbId');
      expect(res.body.data[0]).toHaveProperty('title');
    });

    it('should respect limit parameter', async () => {
      const res = await request(app)
        .get('/api/v1/interactions/history?limit=1')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('GET /api/v1/interactions/watchlist', () => {
    let accessToken: string;
    let userId: Types.ObjectId;
    beforeEach(async () => {
      if (mongoose.connection.readyState === 1) {
        await MovieInteractionModel.deleteMany({});
      }
      const result = await createUserAndLogin();
      accessToken = result.accessToken;
      userId = result.userId;
      await MovieInteractionModel.create([
        {
          userId,
          movieId: new Types.ObjectId(movieId),
          interactionType: 'watchlist',
          createdAt: new Date('2024-01-01'),
        },
        {
          userId,
          movieId: new Types.ObjectId(movieId3),
          interactionType: 'watchlist',
          createdAt: new Date('2024-01-02'),
        },
      ]);
    });

    it('should get watchlist successfully', async () => {
      const res = await request(app)
        .get('/api/v1/interactions/watchlist')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User watchlist fetched successfully.');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      // Returns Movie objects with pagination
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page', 1);
      expect(res.body.pagination).toHaveProperty('total', 2);
      expect(res.body.pagination).toHaveProperty('totalPages', 1);
      expect(res.body.data[0]).toHaveProperty('imdbId');
      expect(res.body.data[0]).toHaveProperty('title');
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/interactions/watchlist?page=1&limit=1')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(1);
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.pagination.totalPages).toBe(2);
      expect(res.body.pagination.hasNextPage).toBe(true);
      expect(res.body.pagination.hasPrevPage).toBe(false);
    });

    it('should support sorting by lastUpdated', async () => {
      const res = await request(app)
        .get('/api/v1/interactions/watchlist?sortBy=lastUpdated&sortOrder=desc')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      // Most recently added should be first (movieId3 added on 2024-01-02)
    });

    it('should support filtering by search', async () => {
      const res = await request(app)
        .get('/api/v1/interactions/watchlist?search=Test')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(0);
    });

    it('should support filtering by genre', async () => {
      const res = await request(app)
        .get('/api/v1/interactions/watchlist?genre=Action')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      // All test movies have Action genre
      expect(res.body.data.length).toBe(2);
    });

    it('should support filtering by minRating', async () => {
      const res = await request(app)
        .get('/api/v1/interactions/watchlist?minRating=8')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      // All test movies have rating 8.5
      expect(res.body.data.length).toBe(2);
    });

    it('should support filtering by year', async () => {
      const res = await request(app)
        .get('/api/v1/interactions/watchlist?year=2023')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      // All test movies are from 2023
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('GET /api/v1/interactions/continue-watching', () => {
    let accessToken: string;
    let userId: Types.ObjectId;
    beforeEach(async () => {
      if (mongoose.connection.readyState === 1) {
        await MovieInteractionModel.deleteMany({});
      }
      const result = await createUserAndLogin();
      accessToken = result.accessToken;
      userId = result.userId;
      await MovieInteractionModel.create([
        {
          userId,
          movieId: new Types.ObjectId(movieId),
          interactionType: 'watched',
          lastWatchedPosition: 1800,
          duration: 7200,
          watchProgress: 25,
          isCompleted: false,
          watchedAt: new Date('2024-01-01'),
        },
        {
          userId,
          movieId: new Types.ObjectId(movieId4),
          interactionType: 'watched',
          lastWatchedPosition: 6900,
          duration: 7200,
          watchProgress: 96,
          isCompleted: true,
          watchedAt: new Date('2024-01-02'),
        },
      ]);
    });

    it('should get continue watching list (exclude completed)', async () => {
      const res = await request(app)
        .get('/api/v1/interactions/continue-watching')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Continue watching list fetched successfully.');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      // Returns Movie objects with watchProgress property
      expect(res.body.data[0]).toHaveProperty('imdbId');
      expect(res.body.data[0]).toHaveProperty('title');
      expect(res.body.data[0]).toHaveProperty('watchProgress', 25);
    });

    it('should respect limit parameter', async () => {
      const res = await request(app)
        .get('/api/v1/interactions/continue-watching?limit=1')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/v1/interactions/user/stats', () => {
    let accessToken: string;
    let userId: Types.ObjectId;
    beforeEach(async () => {
      if (mongoose.connection.readyState === 1) {
        await MovieInteractionModel.deleteMany({});
      }
      const result = await createUserAndLogin();
      accessToken = result.accessToken;
      userId = result.userId;
      await MovieInteractionModel.create([
        {
          userId,
          movieId: new Types.ObjectId(movieId),
          interactionType: 'watched',
          isCompleted: true,
        },
        {
          userId,
          movieId: new Types.ObjectId(movieId2),
          interactionType: 'watched',
          isCompleted: true,
        },
        {
          userId,
          movieId: new Types.ObjectId(movieId3),
          interactionType: 'watchlist',
        },
        {
          userId,
          movieId: new Types.ObjectId(movieId4),
          interactionType: 'rated',
          rating: 7,
        },
        {
          userId,
          movieId: new Types.ObjectId(movieId),
          interactionType: 'rated',
          rating: 9,
        },
      ]);
    });

    it('should get user stats successfully', async () => {
      const res = await request(app)
        .get('/api/v1/interactions/user/stats')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User statistics fetched successfully.');
      expect(res.body.data).toHaveProperty('totalWatches', 2);
      expect(res.body.data).toHaveProperty('watchlistCount', 1);
      expect(res.body.data).toHaveProperty('totalRatings', 2);
      expect(res.body.data).toHaveProperty('averageRating', 8);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/v1/interactions/user/stats');

      expect(res.status).toBe(401);
    });
  });
});
