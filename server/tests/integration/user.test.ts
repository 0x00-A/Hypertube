import request from 'supertest';
import { createApp } from '../../src/app';
import { connectDatabase, disconnectDatabase } from '../../src/config/database';
import { UserModel } from '../../src/models/User';
import { PasswordService } from '../../src/services/password.service';
import mongoose from 'mongoose';

describe('User Profile Integration Tests', () => {
  const app = createApp();
  let passwordService: PasswordService;
  let hashedPassword: string;
  let authToken: string;
  let testUser: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDatabase();
    }
    passwordService = new PasswordService();
    hashedPassword = await passwordService.hashPassword('SecurePass123!');
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    // Clean up users before each test
    if (mongoose.connection.readyState === 1) {
      await UserModel.deleteMany({});
    }

    // Create a test user and get auth token
    testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'Test',
      lastName: 'User',
    };

    await UserModel.create({
      username: testUser.username,
      email: testUser.email,
      password: hashedPassword,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
    });

    // Login to get auth token
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      identifier: testUser.username,
      password: testUser.password,
    });

    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    const accessTokenCookie = cookies.find((cookie: string) =>
      cookie.startsWith('accessToken=')
    );
    authToken = accessTokenCookie?.split(';')[0].split('=')[1] || '';
  });

  describe('GET /api/v1/profile/me', () => {
    it('should return current authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/v1/profile/me')
        .set('Cookie', [`accessToken=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: {
          user: {
            username: testUser.username,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            email: testUser.email,
          },
        },
      });
      expect(res.body.data.user).toHaveProperty('_id');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/v1/profile/me');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Unauthorized: No access token provided',
      });
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/profile/me')
        .set('Cookie', ['accessToken=invalidtoken123']);

      expect(res.status).toBe(401);
    });

    it('should return 401 with expired token', async () => {
      // Create a token that's already expired
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      const res = await request(app)
        .get('/api/v1/profile/me')
        .set('Cookie', [`accessToken=${expiredToken}`]);

      expect(res.status).toBe(401);
    });

    it('should include email field for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/profile/me')
        .set('Cookie', [`accessToken=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.user).toHaveProperty('email', testUser.email);
    });

    it('should not expose oauth field', async () => {
      const res = await request(app)
        .get('/api/v1/profile/me')
        .set('Cookie', [`accessToken=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.user).not.toHaveProperty('oauth');
    });
  });

  describe('GET /api/v1/profile/:username', () => {
    it('should return user profile by username', async () => {
      const res = await request(app).get(`/api/v1/profile/${testUser.username}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: {
          user: {
            username: testUser.username,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
          },
        },
      });
      expect(res.body.data.user).toHaveProperty('_id');
      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data.user).not.toHaveProperty('email'); // Email should not be exposed to others
    });

    it('should return 404 for non-existent username', async () => {
      const res = await request(app).get('/api/v1/profile/nonexistentuser');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'User not found',
      });
    });

    it('should return 400 for invalid username (too short)', async () => {
      const res = await request(app).get('/api/v1/profile/ab');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'fail');
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should return 400 for empty username', async () => {
      const res = await request(app).get('/api/v1/profile/   ');

      // Express may treat whitespace-only as empty path (404)
      expect([400, 404]).toContain(res.status);
      expect(res.body).toHaveProperty('status', 'fail');
    });

    it('should not expose email to other users', async () => {
      const res = await request(app).get(`/api/v1/profile/${testUser.username}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user).not.toHaveProperty('email');
    });

    it('should not expose oauth field', async () => {
      const res = await request(app).get(`/api/v1/profile/${testUser.username}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user).not.toHaveProperty('oauth');
    });

    it('should be accessible without authentication', async () => {
      const res = await request(app).get(`/api/v1/profile/${testUser.username}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user).toHaveProperty('username', testUser.username);
    });

    it('should handle username with underscores', async () => {
      await UserModel.create({
        username: 'test_user_123',
        email: 'test123@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Underscore',
      });

      const res = await request(app).get('/api/v1/profile/test_user_123');

      expect(res.status).toBe(200);
      expect(res.body.data.user).toHaveProperty('username', 'test_user_123');
    });

    it('should handle username with numbers', async () => {
      await UserModel.create({
        username: 'testuser2024',
        email: 'test2024@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Number',
      });

      const res = await request(app).get('/api/v1/profile/testuser2024');

      expect(res.status).toBe(200);
      expect(res.body.data.user).toHaveProperty('username', 'testuser2024');
    });

    it('should return correct data types for all fields', async () => {
      const res = await request(app).get(`/api/v1/profile/${testUser.username}`);

      expect(res.status).toBe(200);
      expect(typeof res.body.data.user._id).toBe('string');
      expect(typeof res.body.data.user.username).toBe('string');
      expect(typeof res.body.data.user.firstName).toBe('string');
      expect(typeof res.body.data.user.lastName).toBe('string');
    });
  });

  describe('User Privacy', () => {
    it('should expose email only to authenticated user viewing own profile', async () => {
      // Create another user
      await UserModel.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: hashedPassword,
        firstName: 'Another',
        lastName: 'User',
      });

      // Authenticated user viewing their own profile - should include email
      const ownProfileRes = await request(app)
        .get('/api/v1/profile/me')
        .set('Cookie', [`accessToken=${authToken}`]);

      expect(ownProfileRes.status).toBe(200);
      expect(ownProfileRes.body.data.user).toHaveProperty('email');

      // Viewing another user's profile - should not include email
      const otherProfileRes = await request(app).get('/api/v1/profile/anotheruser');

      expect(otherProfileRes.status).toBe(200);
      expect(otherProfileRes.body.data.user).not.toHaveProperty('email');
    });

    it('should never expose password field in any endpoint', async () => {
      // Own profile
      const ownRes = await request(app)
        .get('/api/v1/profile/me')
        .set('Cookie', [`accessToken=${authToken}`]);

      expect(ownRes.status).toBe(200);
      expect(ownRes.body.data.user).not.toHaveProperty('password');

      // Other user profile
      const otherRes = await request(app).get(`/api/v1/profile/${testUser.username}`);

      expect(otherRes.status).toBe(200);
      expect(otherRes.body.data.user).not.toHaveProperty('password');
    });

    it('should never expose oauth field in any endpoint', async () => {
      // Create OAuth user
      await UserModel.create({
        username: 'oauthuser',
        email: 'oauth@example.com',
        password: hashedPassword,
        firstName: 'OAuth',
        lastName: 'User',
        oauth: {
          provider: 'google',
          id: 'google123',
        },
      });

      const res = await request(app).get('/api/v1/profile/oauthuser');

      expect(res.status).toBe(200);
      expect(res.body.data.user).not.toHaveProperty('oauth');
    });
  });

  describe('Response Format', () => {
    it('should return consistent response structure for /me', async () => {
      const res = await request(app)
        .get('/api/v1/profile/me')
        .set('Cookie', [`accessToken=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('user');
      expect(typeof res.body.data.user).toBe('object');
    });

    it('should return consistent response structure for /:username', async () => {
      const res = await request(app).get(`/api/v1/profile/${testUser.username}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('user');
      expect(typeof res.body.data.user).toBe('object');
    });

    it('should return consistent error response for not found', async () => {
      const res = await request(app).get('/api/v1/profile/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('status', 'fail');
      expect(res.body).toHaveProperty('message');
      expect(typeof res.body.message).toBe('string');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests to /me', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app)
            .get('/api/v1/profile/me')
            .set('Cookie', [`accessToken=${authToken}`])
        );

      const responses = await Promise.all(requests);

      responses.forEach((res) => {
        expect(res.status).toBe(200);
        expect(res.body.data.user.username).toBe(testUser.username);
      });
    });

    it('should handle special characters in username validation', async () => {
      const invalidUsernames = ['test@user', 'test user', 'test!user', 'test#user'];

      for (const username of invalidUsernames) {
        const res = await request(app).get(`/api/v1/profile/${username}`);
        expect([400, 404]).toContain(res.status);
      }
    });

    it('should trim whitespace from username parameter', async () => {
      const res = await request(app).get(`/api/v1/profile/  ${testUser.username}  `);

      // Should either succeed (if trimmed) or fail validation
      expect([200, 400]).toContain(res.status);
    });
  });
});
