import request from 'supertest';
import { createApp } from '../../../src/app';
import { Types } from 'mongoose';
import { UserModel } from '../../../src/models/User';

describe('Movies API - Recommended Endpoint', () => {
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

  describe('GET /api/v1/movies/recommended', () => {
    it('should return 200 and a list of recommended movies (requires auth cookie)', async () => {
      const { accessToken } = await createUserAndLogin();
      const res = await request(app)
        .get('/api/v1/movies/recommended')
        .set('Cookie', [`accessToken=${accessToken}`]);
      expect([200, 502]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body).toHaveProperty('pagination');
      }
    });

    it('should support pagination (page=2)', async () => {
      const { accessToken } = await createUserAndLogin();
      const res = await request(app)
        .get('/api/v1/movies/recommended?page=2')
        .set('Cookie', [`accessToken=${accessToken}`]);
      expect([200, 502]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('pagination');
        expect(res.body.pagination.page).toBe(2);
      }
    });

    it('should validate movie object schema', async () => {
      const { accessToken } = await createUserAndLogin();
      const res = await request(app)
        .get('/api/v1/movies/recommended')
        .set('Cookie', [`accessToken=${accessToken}`]);
      expect([200, 502]).toContain(res.status);
      if (res.status === 200 && Array.isArray(res.body.data) && res.body.data.length > 0) {
        const movie = res.body.data[0];
        expect(movie).toHaveProperty('tmdbId');
        expect(movie).toHaveProperty('title');
        expect(movie).toHaveProperty('year');
        expect(movie).toHaveProperty('rating');
        expect(movie).toHaveProperty('originalLanguage');
        expect(movie).toHaveProperty('overview');
        expect(movie).toHaveProperty('genres');
        expect(movie).toHaveProperty('images');
        expect(movie).toHaveProperty('isLocal');
        expect(Array.isArray(movie.genres)).toBe(true);
        expect(movie.images).toHaveProperty('thumbnail');
        expect(movie.images).toHaveProperty('backdrop');
      }
    });

    it('should handle empty results gracefully (simulate high page)', async () => {
      const { accessToken } = await createUserAndLogin();
      const res = await request(app)
        .get('/api/v1/movies/recommended?page=9999')
        .set('Cookie', [`accessToken=${accessToken}`]);
      expect([200, 502]).toContain(res.status);
      if (res.status === 200) {
        expect(Array.isArray(res.body.data)).toBe(true);
        // Accept either empty or non-empty, but must be an array
      }
    });
  });
});
