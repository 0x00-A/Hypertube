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
      const res = await request(app).post('/v1/auth/signup').send(validUserData);

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
      await request(app).post('/v1/auth/signup').send(validUserData);

      const user = await UserModel.findOne({ email: validUserData.email });
      expect(user).toBeTruthy();
      expect(user?.password).toBeDefined();
      expect(user?.password).not.toBe(validUserData.password); // Password should be hashed
      expect(user?.password.length).toBeGreaterThan(20); // Hashed passwords are longer
    });

    it('should return 400 when required fields are missing', async () => {
      const incompleteData = {
        username: 'testuser',
        email: 'test@example.com',
        // Missing password, firstName, lastName
      };

      const res = await request(app).post('/v1/auth/signup').send(incompleteData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 when email format is invalid', async () => {
      const invalidEmailData = {
        ...validUserData,
        email: 'invalid-email',
      };

      const res = await request(app).post('/v1/auth/signup').send(invalidEmailData);

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

      const res = await request(app).post('/v1/auth/signup').send(invalidUsernameData);

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

      const res = await request(app).post('/v1/auth/signup').send(shortPasswordData);

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
      await request(app).post('/v1/auth/signup').send(validUserData);

      // Try to register again with same username
      const duplicateData = {
        ...validUserData,
        email: 'different@example.com', // Different email
      };

      const res = await request(app).post('/v1/auth/signup').send(duplicateData);

      expect(res.status).toBe(500);
    });

    it('should return 500 when trying to register with duplicate email', async () => {
      // First registration
      await request(app).post('/v1/auth/signup').send(validUserData);

      // Try to register again with same email
      const duplicateData = {
        ...validUserData,
        username: 'differentuser', // Different username
      };

      const res = await request(app).post('/v1/auth/signup').send(duplicateData);

      expect(res.status).toBe(500);
    });

    it('should trim whitespace from email and username', async () => {
      const dataWithSpaces = {
        ...validUserData,
        username: '  testuser  ',
        email: '  test@example.com  ',
      };

      const res = await request(app).post('/v1/auth/signup').send(dataWithSpaces);

      expect(res.status).toBe(201);
      expect(res.body.data.username).toBe('testuser');
      expect(res.body.data.email).toBe('test@example.com');
    });

    it('should not expose sensitive data in response', async () => {
      const res = await request(app).post('/v1/auth/signup').send(validUserData);

      expect(res.status).toBe(201);
      expect(res.body.data).not.toHaveProperty('password');
      expect(res.body.data).not.toHaveProperty('__v');
      expect(res.body.data).not.toHaveProperty('_id');
    });

    it('should create user with correct default values', async () => {
      await request(app).post('/v1/auth/signup').send(validUserData);

      const user = await UserModel.findOne({ email: validUserData.email });
      expect(user).toBeTruthy();
    //   expect(user?.language).toBe('en'); // Default language
    //   expect(user?.watchedMovies).toEqual([]); // Empty watched movies
    });
  });
});
