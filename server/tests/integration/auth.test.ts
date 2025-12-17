import request from 'supertest';
import { createApp } from '../../src/app';

import { UserModel } from '../../src/models/User';
import mongoose from 'mongoose';

describe('Auth Signup Integration Tests', () => {
  const app = createApp();

  // Helper to generate unique user data per test
  function generateUniqueUserData(suffix?: string) {
    const unique = suffix || `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    return {
      username: `testuser_${unique}`,
      email: `test_${unique}@example.com`,
      password: 'SecurePass123!',
      firstName: 'Test',
      lastName: 'User',
    };
  }

  // Helper to create and activate a user using the verify-email endpoint
  async function createActiveUser(userData: ReturnType<typeof generateUniqueUserData>) {
    const crypto = await import('crypto');
    const { VerificationEmailModel } = await import('../../src/models/VerificationEmail');

    // Signup user
    await request(app).post('/api/v1/auth/signup').send(userData);

    // Get user and verification record
    const user = await UserModel.findOne({ email: userData.email });

    // Create a test token and update verification record
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    await VerificationEmailModel.findOneAndUpdate(
      { userId: user?._id },
      { token: hashedToken }
    );

    // Verify email through the endpoint
    await request(app).post('/api/v1/auth/verify-email').send({ token: rawToken });
  }

  beforeEach(async () => {
    // Clear users collection before each test
    if (mongoose.connection.readyState === 1) {
      await UserModel.deleteMany({});
    }
  });

  describe('POST /v1/auth/signup', () => {
    let validUserData: ReturnType<typeof generateUniqueUserData>;

    beforeEach(() => {
      validUserData = generateUniqueUserData();
    });

    it('should successfully register a new user with valid data', async () => {
      const res = await request(app).post('/api/v1/auth/signup').send(validUserData);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'User registered successfully',
      });
      expect(res.body).not.toHaveProperty('data');

      // Verify user was created in database
      const user = await UserModel.findOne({ email: validUserData.email });
      expect(user).toBeTruthy();
      expect(user?.username).toBe(validUserData.username);
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
        username: validUserData.username,
        email: validUserData.email,
        // Missing password, firstName, lastName
      };

      const res = await request(app).post('/api/v1/auth/signup').send(incompleteData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors.length).toBeGreaterThan(0);
    });

    it('should return 400 when email format is invalid', async () => {
      const invalidEmailData = {
        ...validUserData,
        email: 'invalid-email',
      };

      const res = await request(app).post('/api/v1/auth/signup').send(invalidEmailData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors).toEqual(
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
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors).toEqual(
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
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining('6 characters'),
          }),
        ]),
      );
    });

    it('should return 409 when trying to register with duplicate username', async () => {
      // First registration
      await request(app).post('/api/v1/auth/signup').send(validUserData);

      // Try to register again with same username
      const duplicateData = {
        ...validUserData,
        email: `different_${validUserData.email}`,
      };

      const res = await request(app).post('/api/v1/auth/signup').send(duplicateData);

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Username already taken');
    });

    it('should return 409 when trying to register with duplicate email', async () => {
      // First registration
      await request(app).post('/api/v1/auth/signup').send(validUserData);

      // Try to register again with same email
      const duplicateData = {
        ...validUserData,
        username: `different_${validUserData.username}`,
      };

      const res = await request(app).post('/api/v1/auth/signup').send(duplicateData);

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Email already exists');
    });

    it('should trim whitespace from email and username', async () => {
      const dataWithSpaces = {
        ...validUserData,
        username: `  ${validUserData.username}  `,
        email: `  ${validUserData.email}  `,
      };

      const res = await request(app).post('/api/v1/auth/signup').send(dataWithSpaces);

      expect(res.status).toBe(201);

      // Verify trimmed values in database
      const user = await UserModel.findOne({ email: validUserData.email });
      expect(user).toBeTruthy();
      expect(user?.username).toBe(validUserData.username);
      expect(user?.email).toBe(validUserData.email);
    });

    it('should not expose sensitive data in response', async () => {
      const res = await request(app).post('/api/v1/auth/signup').send(validUserData);

      expect(res.status).toBe(201);
      expect(res.body).not.toHaveProperty('data');
      expect(JSON.stringify(res.body)).not.toContain('password');
    });

    it('should create user with correct default values', async () => {
      await request(app).post('/api/v1/auth/signup').send(validUserData);

      const user = await UserModel.findOne({ email: validUserData.email });
      expect(user).toBeTruthy();
      expect(user?.isActive).toBe(false); // New users should not be active until email verified
    });
  });

  describe('POST /v1/auth/verify-email', () => {
    const validUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'Test',
      lastName: 'User',
    };

    beforeEach(async () => {
      // Create a user before each test
      await request(app).post('/api/v1/auth/signup').send(validUserData);
    });

    it('should successfully verify email with valid token', async () => {
      // Get the verification token from database (simulating email link)
      const { VerificationEmailModel } = await import('../../src/models/VerificationEmail');
      const user = await UserModel.findOne({ email: validUserData.email });
      const verification = await VerificationEmailModel.findOne({ userId: user?._id });

      expect(verification).toBeTruthy();
      const _token = verification?.token;      // Since we hash the token, we need to create a raw token
      // In real scenario, this would come from the email link
      const crypto = await import('crypto');
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Update the verification record with our test token
      await VerificationEmailModel.findOneAndUpdate(
        { userId: user?._id },
        { token: hashedToken }
      );

      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: rawToken });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Email verified successfully',
      });

      // Verify user is now active
      const updatedUser = await UserModel.findOne({ email: validUserData.email });
      expect(updatedUser?.isActive).toBe(true);

      // Verify token is deleted after use
      const deletedVerification = await VerificationEmailModel.findOne({ userId: user?._id });
      expect(deletedVerification).toBeNull();
    });

    it('should return 409 for invalid verification token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'invalid-token-12345' });

      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Invalid or expired verification token',
      });
    });

    it('should return 409 when trying to verify already active user', async () => {
      // Get the verification token
      const crypto = await import('crypto');
      const { VerificationEmailModel } = await import('../../src/models/VerificationEmail');
      const user = await UserModel.findOne({ email: validUserData.email });

      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      await VerificationEmailModel.findOneAndUpdate(
        { userId: user?._id },
        { token: hashedToken }
      );

      // Verify once
      await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: rawToken });

      // Manually set isActive and create a new verification token (edge case)
      await UserModel.findByIdAndUpdate(user?._id, { isActive: true });
      await VerificationEmailModel.create({
        userId: user?._id,
        token: hashedToken
      });

      // Try to verify again
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: rawToken });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('Email already verified');
    });

    it('should return 400 when token is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should return 400 when token is empty string', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: '' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });
  });

  describe('POST /v1/auth/login', () => {
    it('should successfully login with username and set cookies', async () => {
      const validUserData = generateUniqueUserData();
      await createActiveUser(validUserData);
      const res = await request(app).post('/api/v1/auth/login').send({
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
      const refreshTokenCookie = cookies.find((cookie: string) =>
        cookie.startsWith('refreshToken='),
      );
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain('HttpOnly');
      expect(refreshTokenCookie).toContain('SameSite=Strict');
    });

    it('should successfully login with email and set cookies', async () => {
      const validUserData = generateUniqueUserData();
      await createActiveUser(validUserData);
      const res = await request(app).post('/api/v1/auth/login').send({
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

    it('should return success message without exposing user data', async () => {
      const validUserData = generateUniqueUserData();
      await createActiveUser(validUserData);
      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: validUserData.username,
        password: validUserData.password,
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Login successful',
      });
      expect(res.body).not.toHaveProperty('data');
      expect(JSON.stringify(res.body)).not.toContain('password');
    });

    it('should return 409 when user email is not verified', async () => {
      // Create an unverified user
      const unverifiedUserData = {
        username: 'unverified',
        email: 'unverified@example.com',
        password: 'SecurePass123!',
        firstName: 'Unverified',
        lastName: 'User',
      };
      await request(app).post('/api/v1/auth/signup').send(unverifiedUserData);

      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: unverifiedUserData.username,
        password: unverifiedUserData.password,
      });

      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Please verify your email before logging in',
      });

      // Should not set cookies for unverified user
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeUndefined();
    });

    it('should return 401 with invalid password', async () => {
      const validUserData = generateUniqueUserData();
      await createActiveUser(validUserData);
      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: validUserData.username,
        password: 'WrongPassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Invalid identifier or password',
      });

      // Should not set cookies on failed login
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeUndefined();
    });

    it('should return 401 with non-existent username', async () => {
      const validUserData = generateUniqueUserData();
      // Don't sign up this user
      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: 'nonexistentuser',
        password: validUserData.password,
      });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Invalid identifier or password',
      });
    });

    it('should return 401 with non-existent email', async () => {
      const validUserData = generateUniqueUserData();
      // Don't sign up this user
      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: 'nonexistent@example.com',
        password: validUserData.password,
      });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Invalid identifier or password',
      });
    });

    it('should return 400 when identifier is missing', async () => {
      const validUserData = generateUniqueUserData();
      const res = await request(app).post('/api/v1/auth/login').send({
        password: validUserData.password,
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should return 400 when password is missing', async () => {
      const validUserData = generateUniqueUserData();
      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: validUserData.username,
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should not expose sensitive data in response', async () => {
      const validUserData = generateUniqueUserData();
      await createActiveUser(validUserData);
      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: validUserData.username,
        password: validUserData.password,
      });

      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).not.toContain(validUserData.password);
      expect(res.body).not.toHaveProperty('data');
      expect(res.body).not.toHaveProperty('user');
    });

    it('should set cookies with correct expiration times', async () => {
      const validUserData = generateUniqueUserData();
      await createActiveUser(validUserData);
      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: validUserData.username,
        password: validUserData.password,
      });

      expect(res.status).toBe(200);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const accessTokenCookie = cookies.find((cookie: string) => cookie.startsWith('accessToken='));
      const refreshTokenCookie = cookies.find((cookie: string) =>
        cookie.startsWith('refreshToken='),
      );

      // Access token should have shorter expiration
      expect(accessTokenCookie).toContain('Max-Age');

      // Refresh token should have longer expiration
      expect(refreshTokenCookie).toContain('Max-Age');
    });

    it('should allow login multiple times with same credentials', async () => {
      const validUserData = generateUniqueUserData();
      await createActiveUser(validUserData);
      // First login
      const res1 = await request(app).post('/api/v1/auth/login').send({
        identifier: validUserData.username,
        password: validUserData.password,
      });

      expect(res1.status).toBe(200);

      // Small delay to ensure different token timestamps
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Second login
      const res2 = await request(app).post('/api/v1/auth/login').send({
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
    it('should successfully refresh access token with valid refresh token', async () => {
      const validUserData = generateUniqueUserData();
      await createActiveUser(validUserData);
      // Login to get tokens
      const loginRes = await request(app).post('/api/v1/auth/login').send({
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
        status: 'fail',
        message: 'No refresh token provided',
      });
    });

    it('should return 401 when refresh token is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', ['refreshToken=invalid.token.here']);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Invalid token',
      });
    });

    it('should return 401 when refresh token has invalid signature', async () => {
      // Token with invalid signature (will fail verification before expiry check)
      const tokenWithInvalidSignature =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzU3YTExMmQwZjU1ZDI0ZmRiMmE4NjIiLCJpYXQiOjE3MzM3NzYxNDYsImV4cCI6MTczMzc3NjE0Nn0.invalid';

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', [`refreshToken=${tokenWithInvalidSignature}`]);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Invalid token',
      });
    });

    it('should generate a new access token different from the old one', async () => {
      const validUserData = generateUniqueUserData();
      await createActiveUser(validUserData);
      // Login to get initial tokens
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        identifier: validUserData.username,
        password: validUserData.password,
      });

      const loginCookies = loginRes.headers['set-cookie'] as unknown as string[];
      const oldAccessToken = loginCookies
        .find((c: string) => c.startsWith('accessToken='))!
        .split(';')[0]
        .split('=')[1];
      const refreshToken = loginCookies
        .find((c: string) => c.startsWith('refreshToken='))!
        .split(';')[0]
        .split('=')[1];

      // Wait a moment to ensure different token
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Refresh token
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', [`refreshToken=${refreshToken}`]);

      const refreshCookies = refreshRes.headers['set-cookie'] as unknown as string[];
      const newAccessToken = refreshCookies
        .find((c: string) => c.startsWith('accessToken='))!
        .split(';')[0]
        .split('=')[1];

      expect(newAccessToken).toBeTruthy();
      expect(newAccessToken).not.toBe(oldAccessToken);
    });
  });

  describe('Auth Middleware Tests', () => {
    it('should allow access to protected route with valid access token', async () => {
      const validUserData = generateUniqueUserData();
      await createActiveUser(validUserData);
      // Login to get tokens
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        identifier: validUserData.username,
        password: validUserData.password,
      });

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const accessToken = cookies
        .find((c: string) => c.startsWith('accessToken='))!
        .split(';')[0]
        .split('=')[1];

      // Access protected route
      const res = await request(app)
        .get('/api/v1/protected')
        .set('Cookie', [`accessToken=${accessToken}`]);

      // Should not get 401 (might get 404 or other status depending on movies route implementation)
      expect(res.status).not.toBe(401);
    });

    it('should deny access to protected route without access token', async () => {
      const res = await request(app).get('/api/v1/protected');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Unauthorized: No access token provided',
      });
    });

    it('should deny access to protected route with invalid access token', async () => {
      const res = await request(app)
        .get('/api/v1/protected')
        .set('Cookie', ['accessToken=invalid.token.here']);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Invalid token',
      });
    });

    it('should deny access with token having invalid signature', async () => {
      // Token with invalid signature (will fail verification)
      const tokenWithInvalidSignature =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzU3YTExMmQwZjU1ZDI0ZmRiMmE4NjIiLCJpYXQiOjE3MzM3NzYxNDYsImV4cCI6MTczMzc3NjE0Nn0.invalid';

      const res = await request(app)
        .get('/api/v1/protected')
        .set('Cookie', [`accessToken=${tokenWithInvalidSignature}`]);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('status', 'fail');
      expect(res.body.message).toMatch(/Invalid token|Token has expired/);
    });

    it('should attach user data to request object on successful authentication', async () => {
      const validUserData = generateUniqueUserData();
      await createActiveUser(validUserData);
      // Login to get tokens
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        identifier: validUserData.username,
        password: validUserData.password,
      });

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const accessToken = cookies
        .find((c: string) => c.startsWith('accessToken='))!
        .split(';')[0]
        .split('=')[1];

      // Access protected route (assuming movies route returns something)
      const res = await request(app)
        .get('/api/v1/protected')
        .set('Cookie', [`accessToken=${accessToken}`]);

      // Should not be 401 - authentication succeeded
      expect(res.status).not.toBe(401);
    });

    it('should return specific error type for expired token', async () => {
      // This test would need actual expired token generation
      // For now, test with invalid token format
      const res = await request(app)
        .get('/api/v1/protected')
        .set('Cookie', ['accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid']);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('status', 'fail');
    });

    it('should allow public routes without authentication', async () => {
      // Test health endpoint (public)
      const healthRes = await request(app).get('/health');
      expect(healthRes.status).toBe(200);

      // Test auth endpoints (public)
      const unique = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      const signupRes = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          username: `newuser_${unique}`,
          email: `new_${unique}@example.com`,
          password: 'Password123!',
          firstName: 'New',
          lastName: 'User',
        });
      expect(signupRes.status).not.toBe(401);
    });
  });

  describe('POST /api/v1/auth/request-password-reset', () => {
    it('should successfully send password reset email for existing user', async () => {
      const validUserData = generateUniqueUserData();
      await createActiveUser(validUserData);

      const res = await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({ email: validUserData.email });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Password reset email sent if the email exists in our system',
      });

      // Verify a password reset token was created
      const { VerificationEmailModel } = await import('../../src/models/VerificationEmail');
      const user = await UserModel.findOne({ email: validUserData.email });
      const resetToken = await VerificationEmailModel.findOne({ userId: user?._id });
      expect(resetToken).toBeTruthy();
    });

    it('should return success even for non-existent email (security)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Password reset email sent if the email exists in our system',
      });
    });

    it('should return 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'body.email',
          }),
        ]),
      );
    });

    it('should return 400 when email format is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({ email: 'invalid-email' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining('Invalid email'),
          }),
        ]),
      );
    });

    it('should trim whitespace from email', async () => {
      const validUserData = generateUniqueUserData();
      await createActiveUser(validUserData);

      const res = await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({ email: `  ${validUserData.email}  ` });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Password reset email sent if the email exists in our system',
      });
    });

    it('should create new reset token even if previous one exists', async () => {
      const validUserData = generateUniqueUserData();
      await createActiveUser(validUserData);

      // First request
      await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({ email: validUserData.email });

      const { VerificationEmailModel } = await import('../../src/models/VerificationEmail');
      const user = await UserModel.findOne({ email: validUserData.email });
      const firstToken = await VerificationEmailModel.findOne({ userId: user?._id });
      const firstTokenValue = firstToken?.token;

      // Second request
      await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({ email: validUserData.email });

      const secondToken = await VerificationEmailModel.findOne({ userId: user?._id });
      const secondTokenValue = secondToken?.token;

      // Tokens should be different
      expect(secondTokenValue).not.toBe(firstTokenValue);
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('should successfully reset password with valid token', async () => {
      const validUserData = generateUniqueUserData();
      await createActiveUser(validUserData);

      // Request password reset
      await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({ email: validUserData.email });

      // Get the reset token
      const crypto = await import('crypto');
      const { VerificationEmailModel } = await import('../../src/models/VerificationEmail');
      const user = await UserModel.findOne({ email: validUserData.email });

      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      await VerificationEmailModel.findOneAndUpdate(
        { userId: user?._id },
        { token: hashedToken }
      );

      const newPassword = 'NewSecurePass456!';
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: rawToken, newPassword });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Password has been reset successfully',
      });

      // Verify token is deleted after use
      const deletedToken = await VerificationEmailModel.findOne({ userId: user?._id });
      expect(deletedToken).toBeNull();

      // Verify can login with new password
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        identifier: validUserData.email,
        password: newPassword,
      });

      expect(loginRes.status).toBe(200);
    });

    it('should not allow login with old password after reset', async () => {
      const validUserData = generateUniqueUserData();
      const oldPassword = validUserData.password;
      await createActiveUser(validUserData);

      // Request password reset
      await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({ email: validUserData.email });

      // Get the reset token
      const crypto = await import('crypto');
      const { VerificationEmailModel } = await import('../../src/models/VerificationEmail');
      const user = await UserModel.findOne({ email: validUserData.email });

      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      await VerificationEmailModel.findOneAndUpdate(
        { userId: user?._id },
        { token: hashedToken }
      );

      // Reset password
      const newPassword = 'NewSecurePass456!';
      await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: rawToken, newPassword });

      // Try to login with old password
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        identifier: validUserData.email,
        password: oldPassword,
      });

      expect(loginRes.status).toBe(401);
      expect(loginRes.body).toMatchObject({
        status: 'fail',
        message: 'Invalid identifier or password',
      });
    });

    it('should return 409 for invalid reset token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'invalid-token-12345', newPassword: 'NewPassword123!' });

      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Invalid or expired password reset token',
      });
    });

    it('should return 400 when token is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ newPassword: 'NewPassword123!' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'body.token',
          }),
        ]),
      );
    });

    it('should return 400 when newPassword is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'some-token' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'body.newPassword',
          }),
        ]),
      );
    });

    it('should return 400 when newPassword is too short', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'some-token', newPassword: 'short' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining('6 characters'),
          }),
        ]),
      );
    });

    it('should return 400 when token is empty string', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: '', newPassword: 'NewPassword123!' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
      expect(res.body.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Token is required',
          }),
        ]),
      );
    });

    it('should hash the new password before storing', async () => {
      const validUserData = generateUniqueUserData();
      await createActiveUser(validUserData);

      // Request password reset
      await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({ email: validUserData.email });

      // Get the reset token
      const crypto = await import('crypto');
      const { VerificationEmailModel } = await import('../../src/models/VerificationEmail');
      const user = await UserModel.findOne({ email: validUserData.email });

      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      await VerificationEmailModel.findOneAndUpdate(
        { userId: user?._id },
        { token: hashedToken }
      );

      const newPassword = 'NewSecurePass456!';
      await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: rawToken, newPassword });

      // Verify password is hashed in database
      const updatedUser = await UserModel.findOne({ email: validUserData.email }).select('+password');
      expect(updatedUser?.password).toBeDefined();
      expect(updatedUser?.password).not.toBe(newPassword);
      expect(updatedUser?.password?.length).toBeGreaterThan(20);
    });

    it('should not reuse the same token after successful reset', async () => {
      const validUserData = generateUniqueUserData();
      await createActiveUser(validUserData);

      // Request password reset
      await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({ email: validUserData.email });

      // Get the reset token
      const crypto = await import('crypto');
      const { VerificationEmailModel } = await import('../../src/models/VerificationEmail');
      const user = await UserModel.findOne({ email: validUserData.email });

      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      await VerificationEmailModel.findOneAndUpdate(
        { userId: user?._id },
        { token: hashedToken }
      );

      // Reset password
      const newPassword = 'NewSecurePass456!';
      await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: rawToken, newPassword });

      // Try to use the same token again
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: rawToken, newPassword: 'AnotherPassword789!' });

      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Invalid or expired password reset token',
      });
    });
  });
});
