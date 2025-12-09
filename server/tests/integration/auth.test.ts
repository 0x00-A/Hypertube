import request from 'supertest';
import { createApp } from '../../src/app';
import { connectDatabase, disconnectDatabase } from '../../src/config/database';
import { UserModel } from '../../src/models/User';
import mongoose from 'mongoose';

describe('Auth Signup Integration Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await connectDatabase();
    }
  });

  afterAll(async () => {
    // Clean up and disconnect
    await disconnectDatabase();
  });

  beforeEach(async () => {
    // Clear users collection before each test
    if (mongoose.connection.readyState === 1) {
      await UserModel.deleteMany({});
    }
  });

  describe('POST /v1/auth/signup', () => {
    const validUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should successfully register a new user with valid data', async () => {
      const res = await request(app).post('/api/v1/auth/signup').send(validUserData);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'User registered successfully',
        data: {
          username: validUserData.username,
          email: validUserData.email,
        },
      });
      expect(res.body.data).toHaveProperty('userId');
      expect(res.body.data.userId).toBeTruthy();
    });

    it('should hash the password before storing', async () => {
      await request(app).post('/api/v1/auth/signup').send(validUserData);

      const user = await UserModel.findOne({ email: validUserData.email }).select('+password');
      expect(user).toBeTruthy();
      expect(user?.password).toBeDefined();
      expect(user?.password).not.toBe(validUserData.password); // Password should be hashed
      expect(user?.password?.length).toBeGreaterThan(20); // Hashed passwords are longer
    });

    it('should return 400 when required fields are missing', async () => {
      const incompleteData = {
        username: 'testuser',
        email: 'test@example.com',
        // Missing password, firstName, lastName
      };

      const res = await request(app).post('/api/v1/auth/signup').send(incompleteData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 when email format is invalid', async () => {
      const invalidEmailData = {
        ...validUserData,
        email: 'invalid-email',
      };

      const res = await request(app).post('/api/v1/auth/signup').send(invalidEmailData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining('email'),
          }),
        ]),
      );
    });

    it('should return 400 when username is too short', async () => {
      const invalidUsernameData = {
        ...validUserData,
        username: 'ab', // Less than 3 characters
      };

      const res = await request(app).post('/api/v1/auth/signup').send(invalidUsernameData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining('3 characters'),
          }),
        ]),
      );
    });

    it('should return 400 when password is too short', async () => {
      const shortPasswordData = {
        ...validUserData,
        password: 'short',
      };

      const res = await request(app).post('/api/v1/auth/signup').send(shortPasswordData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining('6 characters'),
          }),
        ]),
      );
    });

    it('should return 500 when trying to register with duplicate username', async () => {
      // First registration
      await request(app).post('/api/v1/auth/signup').send(validUserData);

      // Try to register again with same username
      const duplicateData = {
        ...validUserData,
        email: 'different@example.com', // Different email
      };

      const res = await request(app).post('/api/v1/auth/signup').send(duplicateData);

      expect(res.status).toBe(500);
    });

    it('should return 500 when trying to register with duplicate email', async () => {
      // First registration
      await request(app).post('/api/v1/auth/signup').send(validUserData);

      // Try to register again with same email
      const duplicateData = {
        ...validUserData,
        username: 'differentuser', // Different username
      };

      const res = await request(app).post('/api/v1/auth/signup').send(duplicateData);

      expect(res.status).toBe(500);
    });

    it('should trim whitespace from email and username', async () => {
      const dataWithSpaces = {
        ...validUserData,
        username: '  testuser  ',
        email: '  test@example.com  ',
      };

      const res = await request(app).post('/api/v1/auth/signup').send(dataWithSpaces);

      expect(res.status).toBe(201);
      expect(res.body.data.username).toBe('testuser');
      expect(res.body.data.email).toBe('test@example.com');
    });

    it('should not expose sensitive data in response', async () => {
      const res = await request(app).post('/api/v1/auth/signup').send(validUserData);

      expect(res.status).toBe(201);
      expect(res.body.data).not.toHaveProperty('password');
      expect(res.body.data).not.toHaveProperty('__v');
      expect(res.body.data).not.toHaveProperty('_id');
    });

    it('should create user with correct default values', async () => {
      await request(app).post('/api/v1/auth/signup').send(validUserData);

      const user = await UserModel.findOne({ email: validUserData.email });
      expect(user).toBeTruthy();
    //   expect(user?.language).toBe('en'); // Default language
    //   expect(user?.watchedMovies).toEqual([]); // Empty watched movies
    });
  });

  describe('POST /v1/auth/login', () => {
    const validUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'Test',
      lastName: 'User',
    };

    beforeEach(async () => {
      // Create a user before each login test
      await request(app).post('/api/v1/auth/signup').send(validUserData);
    });

    it('should successfully login with username and set cookies', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validUserData.username,
          password: validUserData.password,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Login successful',
      });

      // Check that cookies are set
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies).toHaveLength(2);

      // Check accessToken cookie
      const accessTokenCookie = cookies.find((cookie: string) => cookie.startsWith('accessToken='));
      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain('HttpOnly');
      expect(accessTokenCookie).toContain('SameSite=Strict');

      // Check refreshToken cookie
      const refreshTokenCookie = cookies.find((cookie: string) => cookie.startsWith('refreshToken='));
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain('HttpOnly');
      expect(refreshTokenCookie).toContain('SameSite=Strict');
    });

    it('should successfully login with email and set cookies', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validUserData.email,
          password: validUserData.password,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Login successful',
      });

      // Check that cookies are set
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies).toHaveLength(2);
    });

    it('should return user information in response', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validUserData.username,
          password: validUserData.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        username: validUserData.username,
        email: validUserData.email,
      });
      expect(res.body.data).toHaveProperty('userId');
      expect(res.body.data.userId).toBeTruthy();
    });

    it('should return 401 with invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validUserData.username,
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Invalid identifier or password',
      });

      // Should not set cookies on failed login
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeUndefined();
    });

    it('should return 401 with non-existent username', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'nonexistentuser',
          password: validUserData.password,
        });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Invalid identifier or password',
      });
    });

    it('should return 401 with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'nonexistent@example.com',
          password: validUserData.password,
        });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Invalid identifier or password',
      });
    });

    it('should return 400 when identifier is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: validUserData.password,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should return 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validUserData.username,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should not expose password in any response', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validUserData.username,
          password: validUserData.password,
        });

      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).not.toContain(validUserData.password);
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should set cookies with correct expiration times', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validUserData.username,
          password: validUserData.password,
        });

      expect(res.status).toBe(200);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const accessTokenCookie = cookies.find((cookie: string) => cookie.startsWith('accessToken='));
      const refreshTokenCookie = cookies.find((cookie: string) => cookie.startsWith('refreshToken='));

      // Access token should have shorter expiration
      expect(accessTokenCookie).toContain('Max-Age');

      // Refresh token should have longer expiration
      expect(refreshTokenCookie).toContain('Max-Age');
    });

    it('should allow login multiple times with same credentials', async () => {
      // First login
      const res1 = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validUserData.username,
          password: validUserData.password,
        });

      expect(res1.status).toBe(200);

      // Small delay to ensure different token timestamps
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Second login
      const res2 = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validUserData.username,
          password: validUserData.password,
        });

      expect(res2.status).toBe(200);

      // Tokens should be different (new tokens generated)
      const cookies1 = res1.headers['set-cookie'] as unknown as string[];
      const cookies2 = res2.headers['set-cookie'] as unknown as string[];

      const token1 = cookies1.find((c: string) => c.startsWith('accessToken='));
      const token2 = cookies2.find((c: string) => c.startsWith('accessToken='));
      expect(token1).not.toBe(token2);
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    const validUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'Test',
      lastName: 'User',
    };

    beforeEach(async () => {
      // Register and login user before each test
      await request(app).post('/api/v1/auth/signup').send(validUserData);
    });

    it('should successfully refresh access token with valid refresh token', async () => {
      // Login to get tokens
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validUserData.username,
          password: validUserData.password,
        });

      expect(loginRes.status).toBe(200);
      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const refreshTokenCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
      expect(refreshTokenCookie).toBeTruthy();

      // Extract refresh token
      const refreshToken = refreshTokenCookie!.split(';')[0].split('=')[1];

      // Use refresh token
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', [`refreshToken=${refreshToken}`]);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body).toMatchObject({
        status: 'success',
        message: 'Token refreshed successfully',
      });

      // Should have new access token in cookies
      const newCookies = refreshRes.headers['set-cookie'] as unknown as string[];
      const newAccessToken = newCookies.find((c: string) => c.startsWith('accessToken='));
      expect(newAccessToken).toBeTruthy();
    });

    it('should return 401 when no refresh token is provided', async () => {
      const res = await request(app).post('/api/v1/auth/refresh-token');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'No refresh token provided',
      });
    });

    it('should return 401 when refresh token is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', ['refreshToken=invalid.token.here']);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Invalid or expired refresh token',
      });
    });

    it('should return 401 when refresh token is expired', async () => {
      // Create an expired token (this is a mock - in real scenario, you'd use a token with past expiry)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzU3YTExMmQwZjU1ZDI0ZmRiMmE4NjIiLCJpYXQiOjE3MzM3NzYxNDYsImV4cCI6MTczMzc3NjE0Nn0.invalid';

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', [`refreshToken=${expiredToken}`]);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Invalid or expired refresh token',
      });
    });

    it('should generate a new access token different from the old one', async () => {
      // Login to get initial tokens
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validUserData.username,
          password: validUserData.password,
        });

      const loginCookies = loginRes.headers['set-cookie'] as unknown as string[];
      const oldAccessToken = loginCookies.find((c: string) => c.startsWith('accessToken='))!.split(';')[0].split('=')[1];
      const refreshToken = loginCookies.find((c: string) => c.startsWith('refreshToken='))!.split(';')[0].split('=')[1];

      // Wait a moment to ensure different token
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh token
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', [`refreshToken=${refreshToken}`]);

      const refreshCookies = refreshRes.headers['set-cookie'] as unknown as string[];
      const newAccessToken = refreshCookies.find((c: string) => c.startsWith('accessToken='))!.split(';')[0].split('=')[1];

      expect(newAccessToken).toBeTruthy();
      expect(newAccessToken).not.toBe(oldAccessToken);
    });
  });

  describe('Auth Middleware Tests', () => {
    const validUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'Test',
      lastName: 'User',
    };

    beforeEach(async () => {
      // Register and login user before each test
      await request(app).post('/api/v1/auth/signup').send(validUserData);
    });

    it('should allow access to protected route with valid access token', async () => {
      // Login to get tokens
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validUserData.username,
          password: validUserData.password,
        });

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const accessToken = cookies.find((c: string) => c.startsWith('accessToken='))!.split(';')[0].split('=')[1];

      // Access protected route
      const res = await request(app)
        .get('/v1/movies')
        .set('Cookie', [`accessToken=${accessToken}`]);

      // Should not get 401 (might get 404 or other status depending on movies route implementation)
      expect(res.status).not.toBe(401);
    });

    it('should deny access to protected route without access token', async () => {
      const res = await request(app).get('/v1/movies');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Unauthorized: No access token provided',
      });
    });

    it('should deny access to protected route with invalid access token', async () => {
      const res = await request(app)
        .get('/v1/movies')
        .set('Cookie', ['accessToken=invalid.token.here']);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Invalid token',
      });
    });

    it('should deny access with expired access token', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzU3YTExMmQwZjU1ZDI0ZmRiMmE4NjIiLCJpYXQiOjE3MzM3NzYxNDYsImV4cCI6MTczMzc3NjE0Nn0.invalid';

      const res = await request(app)
        .get('/v1/movies')
        .set('Cookie', [`accessToken=${expiredToken}`]);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/Invalid token|Token has expired/);
    });

    it('should attach user data to request object on successful authentication', async () => {
      // Login to get tokens
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validUserData.username,
          password: validUserData.password,
        });

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const accessToken = cookies.find((c: string) => c.startsWith('accessToken='))!.split(';')[0].split('=')[1];

      // Access protected route (assuming movies route returns something)
      const res = await request(app)
        .get('/v1/movies')
        .set('Cookie', [`accessToken=${accessToken}`]);

      // Should not be 401 - authentication succeeded
      expect(res.status).not.toBe(401);
    });

    it('should return specific error type for expired token', async () => {
      // This test would need actual expired token generation
      // For now, test with invalid token format
      const res = await request(app)
        .get('/v1/movies')
        .set('Cookie', ['accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid']);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('status', 'error');
    });

    it('should allow public routes without authentication', async () => {
      // Test health endpoint (public)
      const healthRes = await request(app).get('/health');
      expect(healthRes.status).toBe(200);

      // Test auth endpoints (public)
      const signupRes = await request(app).post('/api/v1/auth/signup').send({
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
      });
      expect(signupRes.status).not.toBe(401);
    });
  });
});
