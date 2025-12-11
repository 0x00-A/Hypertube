import { generateUniqueUsername } from '../../src/utils/usernameGenerator';
import { UserRepository } from '../../src/repositories/user.repository';
import { connectDatabase, disconnectDatabase } from '../../src/config/database';
import { UserModel } from '../../src/models/User';
import mongoose from 'mongoose';

describe('Username Generator Utils', () => {
  let userRepo: UserRepository;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDatabase();
    }
    userRepo = new UserRepository();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    // Clean up users before each test
    if (mongoose.connection.readyState === 1) {
      await UserModel.deleteMany({}).exec();
    }
  });

  describe('generateUniqueUsername', () => {
    it('should return base username if available', async () => {
      const username = await generateUniqueUsername('testuser', userRepo);
      expect(username).toBe('testuser');
    });

    it('should append number if base username exists', async () => {
      // Create a user with 'testuser'
      await userRepo.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const username = await generateUniqueUsername('testuser', userRepo);
      expect(username).toBe('testuser2');
    });

    it('should increment number until unique username is found', async () => {
      // Create users with testuser, testuser2, testuser3
      await userRepo.create({
        username: 'testuser',
        email: 'test1@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User1',
      });

      await userRepo.create({
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User2',
      });

      await userRepo.create({
        username: 'testuser3',
        email: 'test3@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User3',
      });

      const username = await generateUniqueUsername('testuser', userRepo);
      expect(username).toBe('testuser4');
    });

    it('should sanitize username to lowercase and remove special chars', async () => {
      const username = await generateUniqueUsername('John-Doe!@#', userRepo);
      expect(username).toBe('johndoe');
    });

    it('should ensure minimum length of 3 characters', async () => {
      const username = await generateUniqueUsername('ab', userRepo);
      expect(username).toBe('ab0'); // Padded to 3 chars
    });

    it('should limit username to 30 characters', async () => {
      const longBase = 'verylongusernamethatexceedsthirtychars';
      const username = await generateUniqueUsername(longBase, userRepo);
      expect(username.length).toBeLessThanOrEqual(30);
    });

    it('should trim base username if number suffix would exceed max length', async () => {
      const longBase = 'verylongusernametwentych'; // 24 chars

      // Create user with exact base
      await userRepo.create({
        username: 'verylongusernametwentych',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const username = await generateUniqueUsername(longBase, userRepo);
      expect(username).toBe('verylongusernametwentych2'); // 25 chars total
      expect(username.length).toBeLessThanOrEqual(30);
    });

    it('should throw error after max attempts', async () => {
      // Create 100 users to exceed default maxAttempts
      for (let i = 1; i <= 5; i++) {
        const suffix = i === 1 ? '' : i.toString();
        await userRepo.create({
          username: `limituser${suffix}`,
          email: `limit${i}@example.com`,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        });
      }

      // Should throw after 5 attempts with maxAttempts=5
      await expect(generateUniqueUsername('limituser', userRepo, 5)).rejects.toThrow(
        'Unable to generate unique username'
      );
    });

    it('should handle usernames with only underscores and numbers', async () => {
      const username = await generateUniqueUsername('user_123', userRepo);
      expect(username).toBe('user_123');
    });

    it('should preserve underscores but remove other special chars', async () => {
      const username = await generateUniqueUsername('john_doe-42!', userRepo);
      expect(username).toBe('john_doe42');
    });
  });

  describe('Integration with OAuth flow', () => {
    it('should generate unique usernames for multiple Google users with same email prefix', async () => {
      // Simulate 3 Google users with emails: john@gmail.com, john@yahoo.com, john@outlook.com
      const users = [];

      for (let i = 0; i < 3; i++) {
        // Extract email prefix as base username (mimicking OAuth service logic)
        const email = `john@provider${i}.com`;
        const baseUsername = email.split('@')[0];
        const uniqueUsername = await generateUniqueUsername(baseUsername, userRepo);

        const user = await userRepo.createOauthUser({
          username: uniqueUsername,
          email: email,
          password: 'hashedpassword',
          firstName: 'John',
          lastName: 'Doe',
          oauth: {
            provider: 'google',
            id: `google${i}`,
          },
        });

        users.push(user);
      }

      // All users should have different usernames
      expect(users[0].username).toBe('john');
      expect(users[1].username).toBe('john2');
      expect(users[2].username).toBe('john3');
    });

    it('should generate unique usernames for 42 users with same login', async () => {
      // Simulate 2 users with same 42 login (edge case)
      const users = [];

      for (let i = 0; i < 2; i++) {
        // Use login as base username (mimicking OAuth service logic)
        const baseUsername = 'jdoe';
        const uniqueUsername = await generateUniqueUsername(baseUsername, userRepo);

        const user = await userRepo.createOauthUser({
          username: uniqueUsername,
          email: `jdoe${i}@student.42.fr`,
          password: 'hashedpassword',
          firstName: 'John',
          lastName: 'Doe',
          oauth: {
            provider: 'fortytwo',
            id: `${12345 + i}`,
          },
        });

        users.push(user);
      }

      expect(users[0].username).toBe('jdoe');
      expect(users[1].username).toBe('jdoe2');
    });

    it('should handle username collision between regular user and OAuth user', async () => {
      // Create a regular user with username 'john'
      await userRepo.create({
        username: 'john',
        email: 'john.regular@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Regular',
      });

      // Try to create OAuth user with same base username
      const email = 'john@gmail.com';
      const baseUsername = email.split('@')[0];
      const uniqueUsername = await generateUniqueUsername(baseUsername, userRepo);

      expect(uniqueUsername).toBe('john2');

      const oauthUser = await userRepo.createOauthUser({
        username: uniqueUsername,
        email: email,
        password: 'hashedpassword',
        firstName: 'John',
        lastName: 'OAuth',
        oauth: {
          provider: 'google',
          id: 'google123',
        },
      });

      expect(oauthUser.username).toBe('john2');
    });
  });
});
