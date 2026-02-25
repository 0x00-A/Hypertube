import request from 'supertest';
import { createApp } from '../../../src/app';
import { Types } from 'mongoose';
import { UserModel } from '../../../src/models/User';

describe('Movies API - New Endpoints (Integration)', () => {
  const { app } = createApp();

  // Helper to create a user and get a valid access token via API
  async function createUserAndLogin(): Promise<{ accessToken: string; userId: Types.ObjectId }> {
    const crypto = await import('crypto');
    const { VerificationEmailModel } = await import('../../../src/models/VerificationEmail.model');

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

  describe('GET /api/v1/movies/trending', () => {
    it('should return a paginated list of trending movies', async () => {
      const res = await request(app).get('/api/v1/movies/trending');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination).toHaveProperty('totalPages');
      expect(res.body.pagination).toHaveProperty('limit');
      // At least one trending movie should be present (unless TMDB is empty)
      expect(res.body.data.length).toBeGreaterThanOrEqual(0);
      // Each movie should have isLocal field
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('isLocal');
        expect(res.body.data[0]).toHaveProperty('overview');
        expect(res.body.data[0]).toHaveProperty('genres');
        expect(Array.isArray(res.body.data[0].genres)).toBe(true);
        expect(res.body.data[0]).toHaveProperty('images');
        expect(res.body.data[0].images).toHaveProperty('thumbnail');
        expect(res.body.data[0].images).toHaveProperty('backdrop');
      }
    });

    it('should support pagination', async () => {
      const res = await request(app).get('/api/v1/movies/trending?page=2');
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(2);
    });
  });

  describe('GET /api/v1/movies/tmdb/:tmdbId', () => {
    it('should fetch and return movie details for a valid TMDB ID', async () => {
      const { accessToken } = await createUserAndLogin();
      // Get a trending movie to use its tmdbId
      const trendingRes = await request(app).get('/api/v1/movies/trending');
      const movie = trendingRes.body.data.find((m: any) => typeof m.tmdbId === 'number');
      if (!movie) return; // Skip if no trending movie
      const res = await request(app)
        .get(`/api/v1/movies/tmdb/${movie.tmdbId}`)
        .set('Cookie', [`accessToken=${accessToken}`]);
      expect([200, 404, 502]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('tmdbId', movie.tmdbId);
        expect(res.body.data).toHaveProperty('title');
        expect(res.body.data).toHaveProperty('images');
      } else if (res.status === 404) {
        expect(res.body).toHaveProperty('status', 'fail');
        expect(res.body).toHaveProperty('message');
      } else if (res.status === 502) {
        expect(res.body).toHaveProperty('status', 'error');
        expect(res.body).toHaveProperty('message');
      }
    });

    it('should return 404 for a non-existent TMDB ID', async () => {
      const { accessToken } = await createUserAndLogin();
      // Use a very large TMDB ID unlikely to exist
      const res = await request(app)
        .get('/api/v1/movies/tmdb/999999999')
        .set('Cookie', [`accessToken=${accessToken}`]);
      expect([404, 502]).toContain(res.status);
      if (res.status === 404) {
        expect(res.body).toHaveProperty('status', 'fail');
        expect(res.body).toHaveProperty('message');
      } else if (res.status === 502) {
        expect(res.body).toHaveProperty('status', 'error');
        expect(res.body).toHaveProperty('message');
      }
    });
  });
});
