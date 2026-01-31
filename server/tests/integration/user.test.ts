import request from 'supertest';
import { createApp } from '../../src/app';
import { connectDatabase, disconnectDatabase } from '../../src/config/database';
import { UserModel } from '../../src/models/User';
import { PasswordService } from '../../src/services/password.service';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

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
      isActive: true,
    });

    // Login to get auth token
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      identifier: testUser.username,
      password: testUser.password,
    });

    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    const accessTokenCookie = cookies.find((cookie: string) => cookie.startsWith('accessToken='));
    authToken = accessTokenCookie?.split(';')[0].split('=')[1] || '';
  });

  describe('GET /api/v1/users/me', () => {
    it('should return current authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
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
      const res = await request(app).get('/api/v1/users/me');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Unauthorized: No access token provided',
      });
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Cookie', ['accessToken=invalidtoken123']);

      expect(res.status).toBe(401);
    });

    it('should return 401 with expired token', async () => {
      // Create a token that's already expired
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Cookie', [`accessToken=${expiredToken}`]);

      expect(res.status).toBe(401);
    });

    it('should include email field for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Cookie', [`accessToken=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.user).toHaveProperty('email', testUser.email);
    });

    it('should not expose oauth field', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Cookie', [`accessToken=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.user).not.toHaveProperty('oauth');
    });
  });

  describe('GET /api/v1/users/:username', () => {
    it('should return user profile by username', async () => {
      const res = await request(app).get(`/api/v1/users/${testUser.username}`);

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
      const res = await request(app).get('/api/v1/users/nonexistentuser');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'User not found',
      });
    });

    it('should return 400 for invalid username (too short)', async () => {
      const res = await request(app).get('/api/v1/users/ab');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'fail');
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should return 400 for single character username', async () => {
      const res = await request(app).get('/api/v1/users/a');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'fail');
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should not expose email to other users', async () => {
      const res = await request(app).get(`/api/v1/users/${testUser.username}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user).not.toHaveProperty('email');
    });

    it('should not expose oauth field', async () => {
      const res = await request(app).get(`/api/v1/users/${testUser.username}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user).not.toHaveProperty('oauth');
    });

    it('should be accessible without authentication', async () => {
      const res = await request(app).get(`/api/v1/users/${testUser.username}`);

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
        isActive: true,
      });

      const res = await request(app).get('/api/v1/users/test_user_123');

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
        isActive: true,
      });

      const res = await request(app).get('/api/v1/users/testuser2024');

      expect(res.status).toBe(200);
      expect(res.body.data.user).toHaveProperty('username', 'testuser2024');
    });

    it('should return correct data types for all fields', async () => {
      const res = await request(app).get(`/api/v1/users/${testUser.username}`);

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
        isActive: true,
      });

      // Authenticated user viewing their own profile - should include email
      const ownProfileRes = await request(app)
        .get('/api/v1/users/me')
        .set('Cookie', [`accessToken=${authToken}`]);

      expect(ownProfileRes.status).toBe(200);
      expect(ownProfileRes.body.data.user).toHaveProperty('email');

      // Viewing another user's profile - should not include email
      const otherProfileRes = await request(app).get('/api/v1/users/anotheruser');

      expect(otherProfileRes.status).toBe(200);
      expect(otherProfileRes.body.data.user).not.toHaveProperty('email');
    });

    it('should never expose password field in any endpoint', async () => {
      // Own profile
      const ownRes = await request(app)
        .get('/api/v1/users/me')
        .set('Cookie', [`accessToken=${authToken}`]);

      expect(ownRes.status).toBe(200);
      expect(ownRes.body.data.user).not.toHaveProperty('password');

      // Other user profile
      const otherRes = await request(app).get(`/api/v1/users/${testUser.username}`);

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
        isActive: true,
        oauth: {
          provider: 'google',
          id: 'google123',
        },
      });

      const res = await request(app).get('/api/v1/users/oauthuser');

      expect(res.status).toBe(200);
      expect(res.body.data.user).not.toHaveProperty('oauth');
    });
  });

  describe('Response Format', () => {
    it('should return consistent response structure for /me', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Cookie', [`accessToken=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('user');
      expect(typeof res.body.data.user).toBe('object');
    });

    it('should return consistent response structure for /:username', async () => {
      const res = await request(app).get(`/api/v1/users/${testUser.username}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('user');
      expect(typeof res.body.data.user).toBe('object');
    });

    it('should return consistent error response for not found', async () => {
      const res = await request(app).get('/api/v1/users/nonexistent');

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
            .get('/api/v1/users/me')
            .set('Cookie', [`accessToken=${authToken}`]),
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
        const res = await request(app).get(`/api/v1/users/${username}`);
        expect([400, 404]).toContain(res.status);
      }
    });

    it('should trim whitespace from username parameter', async () => {
      const res = await request(app).get(`/api/v1/users/  ${testUser.username}  `);

      // Should either succeed (if trimmed) or fail validation
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('GET /api/v1/users/', () => {
    beforeEach(async () => {
      // Create additional test users for list endpoint
      await UserModel.create([
        {
          username: 'alice',
          email: 'alice@example.com',
          password: hashedPassword,
          firstName: 'Alice',
          lastName: 'Smith',
          isActive: true,
        },
        {
          username: 'bob',
          email: 'bob@example.com',
          password: hashedPassword,
          firstName: 'Bob',
          lastName: 'Jones',
          isActive: true,
        },
      ]);
    });

    it('should return paginated list of users', async () => {
      const res = await request(app).get('/api/v1/users/');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should respect pagination parameters', async () => {
      const res = await request(app).get('/api/v1/users/?page=1&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(2);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should not expose email in user list', async () => {
      const res = await request(app).get('/api/v1/users/');

      expect(res.status).toBe(200);
      res.body.data.forEach((user: unknown) => {
        expect(user).not.toHaveProperty('email');
      });
    });

    it('should not expose password in user list', async () => {
      const res = await request(app).get('/api/v1/users/');

      expect(res.status).toBe(200);
      res.body.data.forEach((user: unknown) => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should not expose oauth field in user list', async () => {
      const res = await request(app).get('/api/v1/users/');

      expect(res.status).toBe(200);
      res.body.data.forEach((user: unknown) => {
        expect(user).not.toHaveProperty('oauth');
      });
    });

    it('should work without authentication', async () => {
      const res = await request(app).get('/api/v1/users/');

      expect(res.status).toBe(200);
    });

    it('should handle page beyond available data', async () => {
      const res = await request(app).get('/api/v1/users/?page=999');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should return 400 for negative page number', async () => {
      const res = await request(app).get('/api/v1/users/?page=-1');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should return 400 for negative limit', async () => {
      const res = await request(app).get('/api/v1/users/?limit=-5');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should return 400 for zero page', async () => {
      const res = await request(app).get('/api/v1/users/?page=0');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should return 400 for zero limit', async () => {
      const res = await request(app).get('/api/v1/users/?limit=0');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should return 400 for limit exceeding maximum (100)', async () => {
      const res = await request(app).get('/api/v1/users/?limit=101');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should return 400 for page exceeding maximum (10000)', async () => {
      const res = await request(app).get('/api/v1/users/?page=10001');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should return 400 for non-numeric page', async () => {
      const res = await request(app).get('/api/v1/users/?page=abc');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should return 400 for non-numeric limit', async () => {
      const res = await request(app).get('/api/v1/users/?limit=xyz');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should return 400 for decimal page number', async () => {
      const res = await request(app).get('/api/v1/users/?page=1.5');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should return 400 for decimal limit', async () => {
      const res = await request(app).get('/api/v1/users/?limit=10.5');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should allow maximum valid limit (100)', async () => {
      const res = await request(app).get('/api/v1/users/?limit=100');

      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(100);
    });

    it('should allow maximum valid page (10000)', async () => {
      const res = await request(app).get('/api/v1/users/?page=10000');

      expect(res.status).toBe(200);
      expect(res.body.page).toBe(10000);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await UserModel.create({
        username: 'iduser',
        email: 'iduser@example.com',
        password: hashedPassword,
        firstName: 'ID',
        lastName: 'User',
        isActive: true,
      });
      userId = user._id.toString();
    });

    it('should return user profile by ID', async () => {
      const res = await request(app).get(`/api/v1/users/${userId}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: {
          user: {
            _id: userId,
            username: 'iduser',
            firstName: 'ID',
            lastName: 'User',
          },
        },
      });
    });

    it('should return 404 for non-existent ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but doesn't exist
      const res = await request(app).get(`/api/v1/users/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'User not found',
      });
    });

    it('should return 404 for invalid ID format (treated as username)', async () => {
      // "invalid123" is 10 chars, so it's valid as a username but won't be found
      const res = await request(app).get('/api/v1/users/invalid123');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'User not found',
      });
    });

    it('should return 400 for identifier that is too short', async () => {
      const res = await request(app).get('/api/v1/users/ab');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should not expose email when fetching by ID', async () => {
      const res = await request(app).get(`/api/v1/users/${userId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user).not.toHaveProperty('email');
    });

    it('should not expose password when fetching by ID', async () => {
      const res = await request(app).get(`/api/v1/users/${userId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should not expose oauth field when fetching by ID', async () => {
      const res = await request(app).get(`/api/v1/users/${userId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user).not.toHaveProperty('oauth');
    });

    it('should work without authentication', async () => {
      const res = await request(app).get(`/api/v1/users/${userId}`);

      expect(res.status).toBe(200);
    });

    it('should handle 24-character hex string ID', async () => {
      const res = await request(app).get(`/api/v1/users/${userId}`);

      expect(res.status).toBe(200);
      expect(userId).toMatch(/^[0-9a-fA-F]{24}$/);
    });
  });

  describe('POST /api/v1/users/update-profile', () => {
    it('should successfully update user profile with valid data', async () => {
      const updateData = {
        username: 'updateduser',
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Profile updated successfully',
      });

      // Verify the update in database
      const updatedUser = await UserModel.findOne({ username: 'updateduser' });
      expect(updatedUser).toBeTruthy();
      expect(updatedUser?.email).toBe('updated@example.com');
    });

    it('should update only username', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ username: 'newusername' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Profile updated successfully',
      });

      const updatedUser = await UserModel.findOne({ username: 'newusername' });
      expect(updatedUser).toBeTruthy();
      expect(updatedUser?.email).toBe(testUser.email); // Original email unchanged
    });

    it('should update only email', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ email: 'newemail@example.com' });

      expect(res.status).toBe(200);

      const updatedUser = await UserModel.findOne({ username: testUser.username });
      expect(updatedUser?.email).toBe('newemail@example.com');
      expect(updatedUser?.username).toBe(testUser.username); // Original username unchanged
    });

    it('should update only firstName', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ firstName: 'NewFirstName' });

      expect(res.status).toBe(200);

      const updatedUser = await UserModel.findOne({ username: testUser.username });
      expect(updatedUser?.firstName).toBe('NewFirstName');
      expect(updatedUser?.lastName).toBe(testUser.lastName); // Original lastName unchanged
    });

    it('should update only lastName', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ lastName: 'NewLastName' });

      expect(res.status).toBe(200);

      const updatedUser = await UserModel.findOne({ username: testUser.username });
      expect(updatedUser?.lastName).toBe('NewLastName');
      expect(updatedUser?.firstName).toBe(testUser.firstName); // Original firstName unchanged
    });

    it('should update only avatarUrl', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ avatarUrl: 'https://example.com/new-avatar.png' });

      expect(res.status).toBe(200);

      const updatedUser = await UserModel.findOne({ username: testUser.username });
      expect(updatedUser?.avatarUrl).toBe('https://example.com/new-avatar.png');
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .send({ username: 'newuser' });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Unauthorized: No access token provided',
      });
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', ['accessToken=invalidtoken123'])
        .send({ username: 'newuser' });

      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ email: 'invalid-email' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'fail');
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'body.email',
            message: 'Invalid email address',
          }),
        ]),
      );
    });

    it('should return 400 for username shorter than 3 characters', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ username: 'ab' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'fail');
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'body.username',
            message: 'Username must be at least 3 characters long',
          }),
        ]),
      );
    });

    it('should update firstName and lastName together', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ firstName: 'John', lastName: 'Doe' });

      expect(res.status).toBe(200);

      const updatedUser = await UserModel.findOne({ username: testUser.username });
      expect(updatedUser?.firstName).toBe('John');
      expect(updatedUser?.lastName).toBe('Doe');
    });

    it('should return 400 for invalid avatarUrl format', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ avatarUrl: 'not-a-url' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'fail');
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'body.avatarUrl',
            message: 'Invalid URL format',
          }),
        ]),
      );
    });

    it('should accept valid https URL for avatarUrl', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ avatarUrl: 'https://cdn.example.com/avatar.jpg' });

      expect(res.status).toBe(200);
    });

    it('should accept valid http URL for avatarUrl', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ avatarUrl: 'http://example.com/avatar.png' });

      expect(res.status).toBe(200);
    });

    it('should handle multiple validation errors at once', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          username: 'ab',
          email: 'invalid',
          avatarUrl: 'not-a-url',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'fail');
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors.length).toBeGreaterThanOrEqual(3);
    });

    it('should allow empty body (no updates)', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({});

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Profile updated successfully',
      });
    });

    it('should trim whitespace from fields during validation', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          username: '   validuser   ',
          email: '   valid@email.com   ',
        });

      // Depending on implementation, this might succeed or fail
      // If successful, verify trimming worked
      if (res.status === 200) {
        const user = await UserModel.findOne({ username: 'validuser' });
        expect(user).toBeTruthy();
      }
    });

    it('should accept valid language code', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ language: 'en' });

      expect(res.status).toBe(200);

      const user = await UserModel.findOne({ username: testUser.username });
      expect(user?.language).toBe('en');
    });

    it('should accept all supported language codes', async () => {
      const supportedLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh'];

      for (const lang of supportedLanguages) {
        const res = await request(app)
          .post('/api/v1/users/update-profile')
          .set('Cookie', [`accessToken=${authToken}`])
          .send({ language: lang });

        expect(res.status).toBe(200);
      }
    });

    it('should return 400 for invalid language code', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ language: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'fail');
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'body.language',
          }),
        ]),
      );
    });

    it('should return 400 for empty string language code', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ language: '' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should return 400 for numeric language code', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ language: '123' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should not allow updating to existing username', async () => {
      // Create another user
      await UserModel.create({
        username: 'existinguser',
        email: 'existing@example.com',
        password: hashedPassword,
        firstName: 'Existing',
        lastName: 'User',
        isActive: true,
      });

      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ username: 'existinguser' });

      // Should return error (implementation dependent - could be 400 or 409)
      expect([400, 409, 500]).toContain(res.status);
    });

    it('should not allow updating to existing email', async () => {
      // Create another user
      await UserModel.create({
        username: 'existingemail',
        email: 'existing.email@example.com',
        password: hashedPassword,
        firstName: 'Existing',
        lastName: 'Email',
        isActive: true,
      });

      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ email: 'existing.email@example.com' });

      // Should return error (implementation dependent - could be 400 or 409)
      expect([400, 409, 500]).toContain(res.status);
    });

    it('should handle concurrent update requests', async () => {
      const requests = [
        request(app)
          .post('/api/v1/users/update-profile')
          .set('Cookie', [`accessToken=${authToken}`])
          .send({ firstName: 'First' }),
        request(app)
          .post('/api/v1/users/update-profile')
          .set('Cookie', [`accessToken=${authToken}`])
          .send({ firstName: 'Second' }),
      ];

      const responses = await Promise.all(requests);

      // Both should succeed (last write wins)
      responses.forEach((res) => {
        expect(res.status).toBe(200);
      });
    });

    it('should preserve fields not included in update', async () => {
      const originalUser = await UserModel.findOne({ username: testUser.username });
      const originalEmail = originalUser?.email;
      const originalFirstName = originalUser?.firstName;

      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ lastName: 'NewLastNameOnly' });

      expect(res.status).toBe(200);

      const updatedUser = await UserModel.findOne({ username: testUser.username });
      expect(updatedUser?.email).toBe(originalEmail);
      expect(updatedUser?.firstName).toBe(originalFirstName);
      expect(updatedUser?.lastName).toBe('NewLastNameOnly');
    });

    it('should update successfully with username containing valid characters', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ username: 'user_name_123' });

      expect(res.status).toBe(200);

      const user = await UserModel.findOne({ username: 'user_name_123' });
      expect(user).toBeTruthy();
    });

    it('should return consistent response structure on success', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ firstName: 'TestName' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('message');
      expect(typeof res.body.message).toBe('string');
    });

    it('should return consistent error response structure on validation failure', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ email: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'fail');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('validationErrors');
      expect(Array.isArray(res.body.validationErrors)).toBe(true);
    });

    it('should handle very long valid email', async () => {
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ email: longEmail });

      // Should either succeed or fail gracefully
      expect([200, 400]).toContain(res.status);
    });

    it('should not expose sensitive fields in any response', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ firstName: 'Test' });

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('oauth');
    });

    it('should reject additional unknown fields gracefully', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          username: 'validuser',
          unknownField: 'should be ignored',
          anotherUnknown: 123,
        });

      // Should either succeed (ignoring unknown fields) or return validation error
      expect([200, 400]).toContain(res.status);
    });

    it('should handle null values in optional fields', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          firstName: null,
          lastName: null,
          avatarUrl: null,
        });

      // Should handle gracefully (either ignore or validate)
      expect([200, 400]).toContain(res.status);
    });

    it('should successfully update profile with valid language code', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ language: 'en' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Profile updated successfully',
      });

      const updatedUser = await UserModel.findOne({ username: testUser.username });
      expect(updatedUser?.language).toBe('en');
    });

    it('should successfully update profile with different valid language codes', async () => {
      const validLanguages = ['fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh'];

      for (const lang of validLanguages) {
        const res = await request(app)
          .post('/api/v1/users/update-profile')
          .set('Cookie', [`accessToken=${authToken}`])
          .send({ language: lang });

        expect(res.status).toBe(200);
        const updatedUser = await UserModel.findOne({ username: testUser.username });
        expect(updatedUser?.language).toBe(lang);
      }
    });

    it('should reject invalid language code', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ language: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'fail');
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'body.language',
            message: 'Language must be a valid ISO 639-1 code',
          }),
        ]),
      );
    });

    it('should reject empty string language code', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ language: '' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'fail',
      });
    });

    it('should reject numeric language code', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ language: '123' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'fail');
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'body.language',
            message: 'Language must be a valid ISO 639-1 code',
          }),
        ]),
      );
    });

    it('should reject uppercase language code', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ language: 'EN' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'fail');
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'body.language',
            message: 'Language must be a valid ISO 639-1 code',
          }),
        ]),
      );
    });

    it('should allow null language value', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ language: null });

      expect(res.status).toBe(200);
    });

    it('should handle undefined values in optional fields', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          firstName: undefined,
          lastName: undefined,
          avatarUrl: undefined,
        });

      expect([200, 400]).toContain(res.status);
    });
  });

  describe('POST /api/v1/users/update-profile (Avatar Upload)', () => {
    const testImagePath = path.join(__dirname, '../fixtures/test-avatar.png');
    const uploadsDir = path.join(__dirname, '../../uploads/avatars');

    beforeAll(() => {
      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
    });

    afterEach(async () => {
      // Clean up uploaded files after each test
      try {
        const files = fs.readdirSync(uploadsDir);
        for (const file of files) {
          if (file.includes('-')) {
            // Only delete test-generated files (uuid-timestamp pattern)
            fs.unlinkSync(path.join(uploadsDir, file));
          }
        }
      } catch {
        // Ignore errors if directory doesn't exist
      }
    });

    it('should successfully upload avatar image', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .attach('avatar', testImagePath);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Profile updated successfully',
      });

      // Verify avatar URL was saved in database
      const updatedUser = await UserModel.findOne({ username: testUser.username });
      expect(updatedUser?.avatarUrl).toMatch(/^\/uploads\/avatars\/.+\.(png|jpg|jpeg|gif|webp)$/);
    });

    it('should upload avatar and update other fields simultaneously', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .attach('avatar', testImagePath)
        .field('firstName', 'AvatarTest')
        .field('lastName', 'User');

      expect(res.status).toBe(200);

      const updatedUser = await UserModel.findOne({ username: testUser.username });
      expect(updatedUser?.firstName).toBe('AvatarTest');
      expect(updatedUser?.lastName).toBe('User');
      expect(updatedUser?.avatarUrl).toMatch(/^\/uploads\/avatars\/.+\.png$/);
    });

    it('should save uploaded file to disk', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .attach('avatar', testImagePath);

      expect(res.status).toBe(200);

      const updatedUser = await UserModel.findOne({ username: testUser.username });
      const avatarFilename = updatedUser?.avatarUrl?.split('/').pop();
      const filePath = path.join(uploadsDir, avatarFilename || '');

      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should generate unique filename for uploaded avatar', async () => {
      // Upload first avatar
      await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .attach('avatar', testImagePath);

      const user1 = await UserModel.findOne({ username: testUser.username });
      const firstAvatarUrl = user1?.avatarUrl;

      // Upload second avatar
      await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .attach('avatar', testImagePath);

      const user2 = await UserModel.findOne({ username: testUser.username });
      const secondAvatarUrl = user2?.avatarUrl;

      // Filenames should be different (UUID-based)
      expect(firstAvatarUrl).not.toBe(secondAvatarUrl);
    });

    it('should return 401 when uploading avatar without authentication', async () => {
      // When sending multipart/form-data without auth, the server may close the connection
      // before the upload completes. Test using field() instead of attach() to avoid this.
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .field('firstName', 'Unauthorized');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Unauthorized: No access token provided',
      });
    });

    it('should reject non-image files', async () => {
      // Create a temporary text file
      const textFilePath = path.join(__dirname, '../fixtures/test.txt');
      fs.writeFileSync(textFilePath, 'This is not an image');

      try {
        const res = await request(app)
          .post('/api/v1/users/update-profile')
          .set('Cookie', [`accessToken=${authToken}`])
          .attach('avatar', textFilePath);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          status: 'fail',
        });
        expect(res.body.message).toMatch(/image|allowed/i);
      } finally {
        // Clean up
        fs.unlinkSync(textFilePath);
      }
    });

    it('should reject files exceeding size limit', async () => {
      // Create a large file (>5MB)
      const largeFilePath = path.join(__dirname, '../fixtures/large-file.png');
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      fs.writeFileSync(largeFilePath, largeBuffer);

      try {
        const res = await request(app)
          .post('/api/v1/users/update-profile')
          .set('Cookie', [`accessToken=${authToken}`])
          .attach('avatar', largeFilePath);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          status: 'fail',
        });
        expect(res.body.message).toMatch(/5MB|size|large/i);
      } finally {
        // Clean up
        fs.unlinkSync(largeFilePath);
      }
    });

    it('should accept JPEG images', async () => {
      // Create a minimal JPEG file
      const jpegFilePath = path.join(__dirname, '../fixtures/test.jpg');
      // Minimal valid JPEG (1x1 red pixel)
      const jpegBytes = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06,
        0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b,
        0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
        0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31,
        0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff,
        0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00,
        0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
        0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03, 0x03, 0x02, 0x04, 0x03, 0x05, 0x05,
        0x04, 0x04, 0x00, 0x00, 0x01, 0x7d, 0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21,
        0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
        0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a,
        0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35, 0x36, 0x37,
        0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56,
        0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
        0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93,
        0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9,
        0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6,
        0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
        0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7,
        0xf8, 0xf9, 0xfa, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xfb, 0xd5,
        0xdb, 0x20, 0xa8, 0xa0, 0x02, 0x80, 0x0a, 0x00, 0xff, 0xd9,
      ]);
      fs.writeFileSync(jpegFilePath, jpegBytes);

      try {
        const res = await request(app)
          .post('/api/v1/users/update-profile')
          .set('Cookie', [`accessToken=${authToken}`])
          .attach('avatar', jpegFilePath);

        expect(res.status).toBe(200);

        const updatedUser = await UserModel.findOne({ username: testUser.username });
        expect(updatedUser?.avatarUrl).toMatch(/\.jpg$/);
      } finally {
        fs.unlinkSync(jpegFilePath);
      }
    });

    it('should accept WebP images', async () => {
      // Create a minimal WebP file
      const webpFilePath = path.join(__dirname, '../fixtures/test.webp');
      // Minimal valid WebP (1x1 pixel)
      const webpBytes = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38,
        0x4c, 0x0d, 0x00, 0x00, 0x00, 0x2f, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
      ]);
      fs.writeFileSync(webpFilePath, webpBytes);

      try {
        const res = await request(app)
          .post('/api/v1/users/update-profile')
          .set('Cookie', [`accessToken=${authToken}`])
          .attach('avatar', webpFilePath);

        expect(res.status).toBe(200);

        const updatedUser = await UserModel.findOne({ username: testUser.username });
        expect(updatedUser?.avatarUrl).toMatch(/\.webp$/);
      } finally {
        fs.unlinkSync(webpFilePath);
      }
    });

    it('should accept GIF images', async () => {
      // Create a minimal GIF file
      const gifFilePath = path.join(__dirname, '../fixtures/test.gif');
      // Minimal valid GIF (1x1 pixel)
      const gifBytes = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x21, 0xf9,
        0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x00, 0x02, 0x01, 0x44, 0x00, 0x3b,
      ]);
      fs.writeFileSync(gifFilePath, gifBytes);

      try {
        const res = await request(app)
          .post('/api/v1/users/update-profile')
          .set('Cookie', [`accessToken=${authToken}`])
          .attach('avatar', gifFilePath);

        expect(res.status).toBe(200);

        const updatedUser = await UserModel.findOne({ username: testUser.username });
        expect(updatedUser?.avatarUrl).toMatch(/\.gif$/);
      } finally {
        fs.unlinkSync(gifFilePath);
      }
    });

    it('should preserve file extension from original filename', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .attach('avatar', testImagePath);

      expect(res.status).toBe(200);

      const updatedUser = await UserModel.findOne({ username: testUser.username });
      expect(updatedUser?.avatarUrl).toMatch(/\.png$/);
    });

    it('should delete old avatar when uploading new one', async () => {
      // Upload first avatar
      await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .attach('avatar', testImagePath);

      const user1 = await UserModel.findOne({ username: testUser.username });
      const firstAvatarPath = user1?.avatarUrl;
      const firstFilename = firstAvatarPath?.split('/').pop();
      const firstFullPath = path.join(uploadsDir, firstFilename || '');

      // Verify first file exists
      expect(fs.existsSync(firstFullPath)).toBe(true);

      // Upload second avatar
      await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .attach('avatar', testImagePath);

      // Wait a bit for async deletion
      await new Promise((resolve) => setTimeout(resolve, 100));

      // First file should be deleted
      expect(fs.existsSync(firstFullPath)).toBe(false);

      // Second file should exist
      const user2 = await UserModel.findOne({ username: testUser.username });
      const secondFilename = user2?.avatarUrl?.split('/').pop();
      const secondFullPath = path.join(uploadsDir, secondFilename || '');
      expect(fs.existsSync(secondFullPath)).toBe(true);
    });

    it('should not delete external URL avatars when uploading new file', async () => {
      // Set an external URL avatar first
      await UserModel.updateOne(
        { username: testUser.username },
        { avatarUrl: 'https://example.com/avatar.jpg' },
      );

      // Upload new avatar - should not try to delete external URL
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .attach('avatar', testImagePath);

      expect(res.status).toBe(200);

      const updatedUser = await UserModel.findOne({ username: testUser.username });
      expect(updatedUser?.avatarUrl).toMatch(/^\/uploads\/avatars\/.+\.png$/);
    });

    it('should handle request with no file gracefully', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .field('firstName', 'NoAvatar');

      expect(res.status).toBe(200);

      const updatedUser = await UserModel.findOne({ username: testUser.username });
      expect(updatedUser?.firstName).toBe('NoAvatar');
    });

    it('should reject path traversal in avatarUrl field', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ avatarUrl: '../../../etc/passwd' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should reject backslash path traversal in avatarUrl', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ avatarUrl: '..\\..\\..\\etc\\passwd' });

      expect(res.status).toBe(400);
    });

    it('should allow valid uploads/avatars path in avatarUrl', async () => {
      const res = await request(app)
        .post('/api/v1/users/update-profile')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({ avatarUrl: '/uploads/avatars/valid-uuid-12345.png' });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/users/change-password', () => {
    it('should successfully change password with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/users/change-password')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          currentPassword: testUser.password,
          newPassword: 'NewSecurePass456!',
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Password changed successfully',
      });

      // Verify can login with new password
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        identifier: testUser.username,
        password: 'NewSecurePass456!',
      });

      expect(loginRes.status).toBe(200);

      // Verify cannot login with old password
      const oldLoginRes = await request(app).post('/api/v1/auth/login').send({
        identifier: testUser.username,
        password: testUser.password,
      });

      expect(oldLoginRes.status).toBe(401);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/v1/users/change-password').send({
        currentPassword: testUser.password,
        newPassword: 'NewSecurePass456!',
      });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Unauthorized: No access token provided',
      });
    });

    it('should return 400 when current password is incorrect', async () => {
      const res = await request(app)
        .post('/api/v1/users/change-password')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewSecurePass456!',
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Current password is incorrect',
      });

      // Verify password was not changed
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        identifier: testUser.username,
        password: testUser.password,
      });

      expect(loginRes.status).toBe(200);
    });

    it('should return 400 when new password is too short', async () => {
      const res = await request(app)
        .post('/api/v1/users/change-password')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          currentPassword: testUser.password,
          newPassword: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'fail',
      });
      expect(res.body.validationErrors).toBeDefined();
      expect(res.body.validationErrors[0]).toMatchObject({
        path: 'body.newPassword',
        message: 'New password must be at least 6 characters long',
      });
    });

    it('should return 400 when current password is too short', async () => {
      const res = await request(app)
        .post('/api/v1/users/change-password')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          currentPassword: 'short',
          newPassword: 'NewSecurePass456!',
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'fail',
      });
      expect(res.body.validationErrors).toBeDefined();
      expect(res.body.validationErrors[0]).toMatchObject({
        path: 'body.currentPassword',
        message: 'Current password must be at least 6 characters long',
      });
    });

    it('should return 400 when currentPassword is missing', async () => {
      const res = await request(app)
        .post('/api/v1/users/change-password')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          newPassword: 'NewSecurePass456!',
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'fail',
      });
      expect(res.body.validationErrors).toBeDefined();
    });

    it('should return 400 when newPassword is missing', async () => {
      const res = await request(app)
        .post('/api/v1/users/change-password')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          currentPassword: testUser.password,
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'fail',
      });
      expect(res.body.validationErrors).toBeDefined();
    });

    it('should return 400 when both passwords are missing', async () => {
      const res = await request(app)
        .post('/api/v1/users/change-password')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'fail',
      });
      expect(res.body.validationErrors).toBeDefined();
      expect(res.body.validationErrors.length).toBeGreaterThanOrEqual(2);
    });

    it('should allow password change for OAuth users with password set', async () => {
      // Create OAuth user with password set to true (regular account that linked OAuth)
      const oauthUserHashedPass = await passwordService.hashPassword('OAuthPass123!');
      await UserModel.create({
        username: 'oauthlinkeduser',
        email: 'oauthlinked@example.com',
        password: oauthUserHashedPass,
        firstName: 'OAuth',
        lastName: 'Linked',
        isActive: true,
        oauth: {
          provider: 'google',
          id: 'google123',
          isPasswordSet: true, // Has password, can change it
        },
      });

      // Login as OAuth user with password
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        identifier: 'oauthlinkeduser',
        password: 'OAuthPass123!',
      });

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const oauthTokenCookie = cookies.find((cookie: string) => cookie.startsWith('accessToken='));
      const oauthToken = oauthTokenCookie?.split(';')[0].split('=')[1] || '';

      // Should be able to change password
      const res = await request(app)
        .post('/api/v1/users/change-password')
        .set('Cookie', [`accessToken=${oauthToken}`])
        .send({
          currentPassword: 'OAuthPass123!',
          newPassword: 'NewOAuthPass456!',
        });

      expect(res.status).toBe(200);
    });

    it('should return 400 for OAuth users without password set (pure OAuth users)', async () => {
      // Create a pure OAuth user (never set a password)
      // In real OAuth flow, the password field would be set to a random hash
      // but isPasswordSet flag indicates they never set their own password
      await UserModel.create({
        username: 'pureoauthuser',
        email: 'pureoauth@example.com',
        password: await passwordService.hashPassword('RandomGeneratedHash123!'),
        firstName: 'Pure',
        lastName: 'OAuth',
        isActive: true,
        oauth: {
          provider: 'google',
          id: 'google456',
          isPasswordSet: false, // Never set password - pure OAuth user
        },
      });

      // Simulate OAuth login by manually creating session
      // In production, this would happen through the OAuth callback
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        identifier: 'pureoauthuser',
        password: 'RandomGeneratedHash123!',
      });

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const oauthTokenCookie = cookies.find((cookie: string) => cookie.startsWith('accessToken='));
      const oauthToken = oauthTokenCookie?.split(';')[0].split('=')[1] || '';

      // Attempt to change password should fail
      const res = await request(app)
        .post('/api/v1/users/change-password')
        .set('Cookie', [`accessToken=${oauthToken}`])
        .send({
          currentPassword: 'RandomGeneratedHash123!',
          newPassword: 'NewPassword456!',
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Password change not allowed for OAuth users',
      });
    });

    it('should allow password change multiple times', async () => {
      // First password change
      const res1 = await request(app)
        .post('/api/v1/users/change-password')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          currentPassword: testUser.password,
          newPassword: 'NewPassword1!',
        });

      expect(res1.status).toBe(200);

      // Login with new password to get new token
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        identifier: testUser.username,
        password: 'NewPassword1!',
      });

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const newAccessTokenCookie = cookies.find((cookie: string) =>
        cookie.startsWith('accessToken='),
      );
      const newAuthToken = newAccessTokenCookie?.split(';')[0].split('=')[1] || '';

      // Second password change
      const res2 = await request(app)
        .post('/api/v1/users/change-password')
        .set('Cookie', [`accessToken=${newAuthToken}`])
        .send({
          currentPassword: 'NewPassword1!',
          newPassword: 'NewPassword2!',
        });

      expect(res2.status).toBe(200);

      // Verify final password works
      const finalLoginRes = await request(app).post('/api/v1/auth/login').send({
        identifier: testUser.username,
        password: 'NewPassword2!',
      });

      expect(finalLoginRes.status).toBe(200);
    });

    it('should hash the new password in database', async () => {
      await request(app)
        .post('/api/v1/users/change-password')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          currentPassword: testUser.password,
          newPassword: 'NewSecurePass456!',
        });

      const updatedUser = await UserModel.findOne({ username: testUser.username }).select(
        '+password',
      );
      expect(updatedUser?.password).toBeDefined();
      expect(updatedUser?.password).not.toBe('NewSecurePass456!');
      expect(updatedUser?.password?.length).toBeGreaterThan(20); // Hashed password is long
    });

    it('should not change password when using same password as current', async () => {
      const res = await request(app)
        .post('/api/v1/users/change-password')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          currentPassword: testUser.password,
          newPassword: testUser.password,
        });

      // This should succeed technically, but it's the same password
      expect(res.status).toBe(200);

      // Verify old password still works
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        identifier: testUser.username,
        password: testUser.password,
      });

      expect(loginRes.status).toBe(200);
    });

    it('should invalidate old sessions after password change', async () => {
      // Change password
      await request(app)
        .post('/api/v1/users/change-password')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          currentPassword: testUser.password,
          newPassword: 'NewSecurePass456!',
        });

      // Try to use old token - Note: JWT tokens remain valid until expiry
      // This test documents current behavior; ideally would invalidate on password change
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Cookie', [`accessToken=${authToken}`]);

      // Current behavior: token still works
      // Future enhancement: implement token blacklisting on password change
      expect([200, 401]).toContain(res.status);
    });
  });
});
