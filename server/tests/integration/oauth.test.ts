import request from 'supertest';
import { createApp } from '../../src/app';
import { connectDatabase, disconnectDatabase } from '../../src/config/database';
import { UserRepository } from '../../src/repositories/user.repository';
import { OAuthService } from '../../src/services/oauth.service';
import { UserModel } from '../../src/models/User';
import mongoose from 'mongoose';
import { Profile as GoogleProfile } from 'passport-google-oauth20';
import { PasswordService } from '../../src/services/password.service';
import { FortyTwoProfile } from '../../src/types/oauth.type';

// Helper function to create Google profile mock
const createGoogleProfile = (overrides: {
  id: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}): GoogleProfile => ({
  id: overrides.id,
  displayName: `${overrides.given_name || ''} ${overrides.family_name || ''}`.trim(),
  emails: overrides.email ? [{ value: overrides.email, verified: true }] : [],
  photos: overrides.picture ? [{ value: overrides.picture }] : [],
  profileUrl: `https://plus.google.com/${overrides.id}`,
  provider: 'google',
  _raw: '{}',
  _json: {
    iss: 'https://accounts.google.com',
    azp: 'test-client-id',
    aud: 'test-client-id',
    sub: overrides.id,
    at_hash: 'test-hash',
    iat: Date.now(),
    exp: Date.now() + 3600,
    email: overrides.email,
    email_verified: true,
    given_name: overrides.given_name,
    family_name: overrides.family_name,
    picture: overrides.picture,
  },
});

// Helper function to create 42 profile mock
const createFortyTwoProfile = (
  id: number,
  email: string,
  login: string,
  firstName: string,
  lastName: string,
): FortyTwoProfile => ({
  id: String(id),
  username: login,
  displayName: `${firstName} ${lastName}`.trim(),
  name: {
    familyName: lastName,
    givenName: firstName,
  },
  _json: {
    id,
    email,
    login,
    first_name: firstName,
    last_name: lastName,
  },
});

describe('OAuth Integration Tests', () => {
  const app = createApp();
  let userRepo: UserRepository;
  let oauthService: OAuthService;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDatabase();
    }
    userRepo = new UserRepository();
    oauthService = new OAuthService(userRepo, new PasswordService());
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

  describe('GET /api/v1/oauth', () => {
    it('should return health check message', async () => {
      const response = await request(app).get('/api/v1/oauth');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'OAuth route is working');
    });
  });

  describe('GET /api/v1/oauth/google', () => {
    it('should redirect to Google OAuth', async () => {
      const response = await request(app).get('/api/v1/oauth/google');

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('accounts.google.com');
    });
  });

  describe('GET /api/v1/oauth/42', () => {
    it('should redirect to 42 OAuth', async () => {
      const response = await request(app).get('/api/v1/oauth/42');

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('api.intra.42.fr');
    });
  });

  describe('OAuthService - handleGoogleOAuth', () => {
    it('should create a new user with Google OAuth', async () => {
      const unique = Math.random().toString(36).substring(2, 8) + Date.now();
      const email = `john_${unique}@example.com`;
      const mockGoogleProfile = createGoogleProfile({
        id: `google123_${unique}`,
        email,
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://example.com/photo.jpg',
      });
      const user = await oauthService.handleGoogleOAuth(mockGoogleProfile);
      expect(user).toBeDefined();
      expect(user._id).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.username).toBe(`john_${unique}`);
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      // Verify oauth was stored by querying directly
      const dbUser = await UserModel.findById(user._id).select('+oauth').exec();
      expect(dbUser?.oauth?.provider).toBe('google');
      expect(dbUser?.oauth?.id).toBe(`google123_${unique}`);
    });

    it('should return existing user if Google account already exists', async () => {
      const unique = Math.random().toString(36).substring(2, 8) + Date.now();
      const email = `john_${unique}@example.com`;
      const mockGoogleProfile = createGoogleProfile({
        id: `google123_${unique}`,
        email,
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://example.com/photo.jpg',
      });
      // Create user first time
      const firstUser = await oauthService.handleGoogleOAuth(mockGoogleProfile);
      // Try to create again with same profile
      const secondUser = await oauthService.handleGoogleOAuth(mockGoogleProfile);
      expect(firstUser._id).toEqual(secondUser._id);
      expect(secondUser.email).toBe(email);
    });

    it('should link Google account to existing user with same email', async () => {
      const unique = Math.random().toString(36).substring(2, 8) + Date.now();
      const email = `john_${unique}@example.com`;
      // Create a regular user first
      await userRepo.create({
        email,
        username: `johndoe_${unique}`,
        password: 'hashedpassword123',
        firstName: 'John',
        lastName: 'Doe',
      });
      const mockGoogleProfile = createGoogleProfile({
        id: `google123_${unique}`,
        email,
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://example.com/photo.jpg',
      });
      const user = await oauthService.handleGoogleOAuth(mockGoogleProfile);
      expect(user.email).toBe(email);
      expect(user.username).toBe(`johndoe_${unique}`);
      // Verify oauth was linked by querying database
      const dbUser = await UserModel.findById(user._id).select('+oauth').exec();
      expect(dbUser?.oauth?.provider).toBe('google');
      expect(dbUser?.oauth?.id).toBe(`google123_${unique}`);
    });

    it('should generate username from email if email exists', async () => {
      const mockGoogleProfile = createGoogleProfile({
        id: 'google456',
        email: 'jane.smith@example.com',
        given_name: 'Jane',
        family_name: 'Smith',
        picture: 'https://example.com/photo.jpg',
      });

      const user = await oauthService.handleGoogleOAuth(mockGoogleProfile);

      expect(user.username).toBe('janesmith'); // Dots are removed by sanitization
    });

    it('should throw error if Google profile has no email', async () => {
      const mockGoogleProfile = createGoogleProfile({
        id: 'google789',
        given_name: 'Anonymous',
        family_name: 'User',
      });

      await expect(oauthService.handleGoogleOAuth(mockGoogleProfile)).rejects.toThrow(
        'Google account must have an email address',
      );
    });

    it('should generate unique username when preferred username is taken', async () => {
      const unique = Math.random().toString(36).substring(2, 8) + Date.now();
      // Create a regular user with username 'john_<unique>'
      await userRepo.create({
        email: `john_regular_${unique}@example.com`,
        username: `john_${unique}`,
        password: 'hashedpassword123',
        firstName: 'John',
        lastName: 'Regular',
      });
      // Try to create OAuth user with same email prefix
      const mockGoogleProfile = createGoogleProfile({
        id: `google456_${unique}`,
        email: `john_${unique}@gmail.com`,
        given_name: 'John',
        family_name: 'OAuth',
      });
      const user = await oauthService.handleGoogleOAuth(mockGoogleProfile);
      expect(user.username).toBe(`john_${unique}2`); // Should append number to avoid collision
      expect(user.email).toBe(`john_${unique}@gmail.com`);
    });

    it('should handle multiple OAuth users with same email prefix', async () => {
      const unique = Math.random().toString(36).substring(2, 8) + Date.now();
      // Create first OAuth user
      const mockProfile1 = createGoogleProfile({
        id: `google111_${unique}`,
        email: `jane_${unique}@provider1.com`,
        given_name: 'Jane',
        family_name: 'Doe',
      });
      const user1 = await oauthService.handleGoogleOAuth(mockProfile1);
      // Create second OAuth user with same email prefix
      const mockProfile2 = createGoogleProfile({
        id: `google222_${unique}`,
        email: `jane_${unique}@provider2.com`,
        given_name: 'Jane',
        family_name: 'Smith',
      });
      const user2 = await oauthService.handleGoogleOAuth(mockProfile2);
      expect(user1.username).toBe(`jane_${unique}`);
      expect(user2.username).toBe(`jane_${unique}2`);
    });
  });

  describe('OAuthService - handleFortyTwoOAuth', () => {
    it('should create a new user with 42 OAuth', async () => {
      const unique = Math.random().toString(36).substring(2, 8) + Date.now();
      const login = `jdoe_${unique}`;
      const email = `${login}@student.42.fr`;
      const mockFortyTwoProfile = createFortyTwoProfile(12345, email, login, 'John', 'Doe');
      const user = await oauthService.handleFortyTwoOAuth(mockFortyTwoProfile);
      expect(user).toBeDefined();
      expect(user._id).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.username).toBe(login);
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      // Verify oauth was stored in database
      const dbUser = await UserModel.findById(user._id).select('+oauth').exec();
      expect(dbUser?.oauth?.provider).toBe('fortytwo');
      expect(dbUser?.oauth?.id).toBe('12345');
    });

    it('should return existing user if 42 account already exists', async () => {
      const unique = Math.random().toString(36).substring(2, 8) + Date.now();
      const login = `jdoe_${unique}`;
      const email = `${login}@student.42.fr`;
      const mockFortyTwoProfile = createFortyTwoProfile(12345, email, login, 'John', 'Doe');
      // Create user first time
      const firstUser = await oauthService.handleFortyTwoOAuth(mockFortyTwoProfile);
      // Try to create again with same profile
      const secondUser = await oauthService.handleFortyTwoOAuth(mockFortyTwoProfile);
      expect(firstUser._id).toEqual(secondUser._id);
      expect(secondUser.email).toBe(email);
    });

    it('should link 42 account to existing user with same email', async () => {
      const unique = Math.random().toString(36).substring(2, 8) + Date.now();
      const login = `jdoe_${unique}`;
      const email = `${login}@student.42.fr`;
      // Create a regular user first
      await userRepo.create({
        email,
        username: `johndoe_${unique}`,
        password: 'hashedpassword123',
        firstName: 'John',
        lastName: 'Doe',
      });
      const mockFortyTwoProfile = createFortyTwoProfile(12345, email, login, 'John', 'Doe');
      const user = await oauthService.handleFortyTwoOAuth(mockFortyTwoProfile);
      expect(user.email).toBe(email);
      expect(user.username).toBe(`johndoe_${unique}`);
      // Verify oauth was linked in database
      const dbUser = await UserModel.findById(user._id).select('+oauth').exec();
      expect(dbUser?.oauth?.provider).toBe('fortytwo');
      expect(dbUser?.oauth?.id).toBe('12345');
    });

    it('should use 42 login as username', async () => {
      const mockFortyTwoProfile = createFortyTwoProfile(
        67890,
        'jsmith@student.42.fr',
        'jsmith',
        'Jane',
        'Smith',
      );

      const user = await oauthService.handleFortyTwoOAuth(mockFortyTwoProfile);

      expect(user.username).toBe('jsmith');
    });

    it('should handle missing names with fallback values', async () => {
      const mockFortyTwoProfile = createFortyTwoProfile(
        99999,
        'noname@student.42.fr',
        'noname',
        '',
        '',
      );

      const user = await oauthService.handleFortyTwoOAuth(mockFortyTwoProfile);

      expect(user.firstName).toBe('User');
      expect(user.lastName).toBe('FortyTwo');
    });

    it('should generate unique username when 42 login is taken', async () => {
      const unique = Math.random().toString(36).substring(2, 8) + Date.now();
      // Create a regular user with username 'jsmith_<unique>'
      await userRepo.create({
        email: `jsmith_regular_${unique}@example.com`,
        username: `jsmith_${unique}`,
        password: 'hashedpassword123',
        firstName: 'John',
        lastName: 'Smith',
      });
      // Try to create 42 OAuth user with same login
      const login = `jsmith_${unique}`;
      const email = `${login}@student.42.fr`;
      const mockFortyTwoProfile = createFortyTwoProfile(67890, email, login, 'Jane', 'Smith');
      const user = await oauthService.handleFortyTwoOAuth(mockFortyTwoProfile);
      expect(user.username).toBe(`${login}2`); // Should append number to avoid collision
      expect(user.email).toBe(email);
    });
  });

  describe('OAuth Error Handling', () => {
    it('should handle database errors gracefully in Google OAuth', async () => {
      const mockGoogleProfile = createGoogleProfile({
        id: 'google_error',
        email: 'error@example.com',
        given_name: 'Error',
        family_name: 'User',
      });

      // Mock a database error by disconnecting
      await disconnectDatabase();

      await expect(oauthService.handleGoogleOAuth(mockGoogleProfile)).rejects.toThrow();

      // Reconnect for other tests
      await connectDatabase();
    });

    it('should handle non-existent user when linking OAuth account', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await userRepo.linkOAuthAccount(nonExistentId, {
        provider: 'google',
        id: 'google123',
      });

      expect(result).toBeNull();
    });

    it('should properly update OAuth fields without data loss', async () => {
      const unique = Math.random().toString(36).substring(2, 8) + Date.now();
      // Create a user with initial data
      const user = await userRepo.create({
        email: `test_${unique}@example.com`,
        username: `testuser_${unique}`,
        password: 'hashedpassword123',
        firstName: 'Test',
        lastName: 'User',
      });
      // Link OAuth account
      const linkedUser = await userRepo.linkOAuthAccount(user._id!, {
        provider: 'google',
        id: `google123_${unique}`,
      });
      expect(linkedUser).not.toBeNull();
      expect(linkedUser?.email).toBe(`test_${unique}@example.com`);
      expect(linkedUser?.username).toBe(`testuser_${unique}`);
      expect(linkedUser?.firstName).toBe('Test');
      expect(linkedUser?.lastName).toBe('User');
      // Verify oauth was set correctly in database
      const dbUser = await UserModel.findById(user._id).select('+oauth').exec();
      expect(dbUser?.oauth?.provider).toBe('google');
      expect(dbUser?.oauth?.id).toBe(`google123_${unique}`);
    });
  });
});
