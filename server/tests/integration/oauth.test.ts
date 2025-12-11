import request from 'supertest';
import { createApp } from '../../src/app';
import { connectDatabase, disconnectDatabase } from '../../src/config/database';
import { UserRepository } from '../../src/repositories/user.repository';
import { OAuthService } from '../../src/services/oauth.service';
import { UserModel } from '../../src/models/User';
import mongoose from 'mongoose';
import { Profile as GoogleProfile } from 'passport-google-oauth20';
import { PasswordService } from '../../src/services/password.service';

type FortyTwoProfile = {
  id: string;
  username: string;
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
  };
  _json: {
    id: number;
    email: string;
    login: string;
    first_name: string;
    last_name: string;
  };
};

// Helper function to create Google profile mock
const createGoogleProfile = (overrides: { id: string; email?: string; given_name?: string; family_name?: string; picture?: string }): GoogleProfile => ({
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
const createFortyTwoProfile = (id: number, email: string, login: string, firstName: string, lastName: string): FortyTwoProfile => ({
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
      const mockGoogleProfile = createGoogleProfile({
        id: 'google123',
        email: 'john@example.com',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://example.com/photo.jpg',
      });

      const user = await oauthService.handleGoogleOAuth(mockGoogleProfile);

      expect(user).toBeDefined();
      expect(user._id).toBeDefined();
      expect(user.email).toBe('john@example.com');
      expect(user.username).toBe('john');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');

      // Verify oauth was stored by querying directly
      const dbUser = await UserModel.findById(user._id).select('+oauth').exec();
      expect(dbUser?.oauth?.provider).toBe('google');
      expect(dbUser?.oauth?.id).toBe('google123');
    });

    it('should return existing user if Google account already exists', async () => {
      const mockGoogleProfile = createGoogleProfile({
        id: 'google123',
        email: 'john@example.com',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://example.com/photo.jpg',
      });

      // Create user first time
      const firstUser = await oauthService.handleGoogleOAuth(mockGoogleProfile);

      // Try to create again with same profile
      const secondUser = await oauthService.handleGoogleOAuth(mockGoogleProfile);

      expect(firstUser._id).toEqual(secondUser._id);
      expect(secondUser.email).toBe('john@example.com');
    });

    it('should link Google account to existing user with same email', async () => {
      // Create a regular user first
      await userRepo.create({
        email: 'john@example.com',
        username: 'johndoe',
        password: 'hashedpassword123',
        firstName: 'John',
        lastName: 'Doe',
      });

      const mockGoogleProfile = createGoogleProfile({
        id: 'google123',
        email: 'john@example.com',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://example.com/photo.jpg',
      });

      const user = await oauthService.handleGoogleOAuth(mockGoogleProfile);

      expect(user.email).toBe('john@example.com');
      expect(user.username).toBe('johndoe');

      // Verify oauth was linked by querying database
      const dbUser = await UserModel.findById(user._id).select('+oauth').exec();
      expect(dbUser?.oauth?.provider).toBe('google');
      expect(dbUser?.oauth?.id).toBe('google123');
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

      expect(user.username).toBe('jane.smith');
    });

    it('should throw error if Google profile has no email', async () => {
      const mockGoogleProfile = createGoogleProfile({
        id: 'google789',
        given_name: 'Anonymous',
        family_name: 'User',
      });

      await expect(oauthService.handleGoogleOAuth(mockGoogleProfile)).rejects.toThrow('Google account must have an email address');
    });
  });

  describe('OAuthService - handleFortyTwoOAuth', () => {
    it('should create a new user with 42 OAuth', async () => {
      const mockFortyTwoProfile = createFortyTwoProfile(12345, 'jdoe@student.42.fr', 'jdoe', 'John', 'Doe');

      const user = await oauthService.handleFortyTwoOAuth(mockFortyTwoProfile);

      expect(user).toBeDefined();
      expect(user._id).toBeDefined();
      expect(user.email).toBe('jdoe@student.42.fr');
      expect(user.username).toBe('jdoe');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');

      // Verify oauth was stored in database
      const dbUser = await UserModel.findById(user._id).select('+oauth').exec();
      expect(dbUser?.oauth?.provider).toBe('fortytwo');
      expect(dbUser?.oauth?.id).toBe('12345');
    });

    it('should return existing user if 42 account already exists', async () => {
      const mockFortyTwoProfile = createFortyTwoProfile(12345, 'jdoe@student.42.fr', 'jdoe', 'John', 'Doe');

      // Create user first time
      const firstUser = await oauthService.handleFortyTwoOAuth(mockFortyTwoProfile);

      // Try to create again with same profile
      const secondUser = await oauthService.handleFortyTwoOAuth(mockFortyTwoProfile);

      expect(firstUser._id).toEqual(secondUser._id);
      expect(secondUser.email).toBe('jdoe@student.42.fr');
    });

    it('should link 42 account to existing user with same email', async () => {
      // Create a regular user first
      await userRepo.create({
        email: 'jdoe@student.42.fr',
        username: 'johndoe',
        password: 'hashedpassword123',
        firstName: 'John',
        lastName: 'Doe',
      });

      const mockFortyTwoProfile = createFortyTwoProfile(12345, 'jdoe@student.42.fr', 'jdoe', 'John', 'Doe');

      const user = await oauthService.handleFortyTwoOAuth(mockFortyTwoProfile);

      expect(user.email).toBe('jdoe@student.42.fr');
      expect(user.username).toBe('johndoe');

      // Verify oauth was linked in database
      const dbUser = await UserModel.findById(user._id).select('+oauth').exec();
      expect(dbUser?.oauth?.provider).toBe('fortytwo');
      expect(dbUser?.oauth?.id).toBe('12345');
    });

    it('should use 42 login as username', async () => {
      const mockFortyTwoProfile = createFortyTwoProfile(67890, 'jsmith@student.42.fr', 'jsmith', 'Jane', 'Smith');

      const user = await oauthService.handleFortyTwoOAuth(mockFortyTwoProfile);

      expect(user.username).toBe('jsmith');
    });

    it('should handle missing names with fallback values', async () => {
      const mockFortyTwoProfile = createFortyTwoProfile(99999, 'noname@student.42.fr', 'noname', '', '');

      const user = await oauthService.handleFortyTwoOAuth(mockFortyTwoProfile);

      expect(user.firstName).toBe('User');
      expect(user.lastName).toBe('FortyTwo');
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
  });
});
