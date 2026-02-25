import request from 'supertest';
import { createApp } from '../../src/app';
import { CommentModel } from '../../src/models/Comment';
import { MovieModel } from '../../src/models/Movie';
import { UserModel } from '../../src/models/User';
import { IMovie } from '../../src/interfaces/movie.interface';
import { Types } from 'mongoose';

describe('Comment API Integration Tests', () => {
  const { app } = createApp();
  let tmdbId: number;

  // Helper to create a user and get a valid access token via API
  async function createUserAndLogin(): Promise<{ accessToken: string; userId: Types.ObjectId }> {
    const crypto = await import('crypto');
    const { VerificationEmailModel } = await import('../../src/models/VerificationEmail.model');

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

  const sampleMovie: Partial<IMovie> = {
    tmdbId: 550,
    imdbId: 'tt0137523',
    title: 'Fight Club',
    year: 1999,
    rating: 8.8,
    duration: 139,
    synopsis:
      'An insomniac office worker and a devil-may-care soapmaker form an underground fight club.',
    genres: ['Drama'],
    originalLanguage: 'en',
    images: {
      thumbnail: 'https://example.com/thumb.jpg',
      poster: 'https://example.com/poster.jpg',
      backdrop: 'https://example.com/backdrop.jpg',
    },
    torrents: [
      {
        url: 'magnet:?xt=urn:btih:test',
        hash: 'testhash',
        quality: '1080p',
        type: 'mp4',
        videoCodec: 'x264',
        seeds: 100,
        peers: 50,
        size: '1.5 GB',
        sizeBytes: 1610612736,
        provider: 'YTS',
      },
    ],
    downloadStatus: 'not_downloaded',
    lastUpdated: new Date(),
  };

  beforeAll(async () => {
    await UserModel.deleteMany({});
    await MovieModel.deleteMany({});
    await CommentModel.deleteMany({});

    // Create a test movie
    const movie = await MovieModel.create(sampleMovie);
    tmdbId = movie.tmdbId;
  });

  afterAll(async () => {
    await UserModel.deleteMany({});
    await MovieModel.deleteMany({});
    await CommentModel.deleteMany({});
  });

  beforeEach(async () => {
    await CommentModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  describe('GET /api/v1/comments - List all comments (public)', () => {
    it('should return empty list when no comments exist', async () => {
      const res = await request(app).get('/api/v1/comments');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });

    it('should return paginated list of comments', async () => {
      const { accessToken } = await createUserAndLogin();

      // Create multiple comments
      await request(app)
        .post('/api/v1/comments')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({ content: 'First comment', tmdbId });

      await request(app)
        .post('/api/v1/comments')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({ content: 'Second comment', tmdbId });

      const res = await request(app).get('/api/v1/comments?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.data[0]).toHaveProperty('user');
      expect(res.body.data[0].user).toHaveProperty('username');
    });

    it('should support sorting by createdAt', async () => {
      const { accessToken } = await createUserAndLogin();

      await request(app)
        .post('/api/v1/comments')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({ content: 'First comment', tmdbId });

      await new Promise((resolve) => setTimeout(resolve, 100));

      await request(app)
        .post('/api/v1/comments')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({ content: 'Second comment', tmdbId });

      const resDesc = await request(app).get('/api/v1/comments?sortBy=createdAt&sortOrder=desc');
      expect(resDesc.status).toBe(200);
      expect(resDesc.body.data[0].content).toBe('Second comment');

      const resAsc = await request(app).get('/api/v1/comments?sortBy=createdAt&sortOrder=asc');
      expect(resAsc.status).toBe(200);
      expect(resAsc.body.data[0].content).toBe('First comment');
    });
  });

  describe('POST /api/v1/comments - Create comment', () => {
    it('should create a comment with valid data and auth', async () => {
      const { accessToken } = await createUserAndLogin();

      const res = await request(app)
        .post('/api/v1/comments')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          content: 'Great movie!',
          tmdbId,
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Comment created successfully.');
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.content).toBe('Great movie!');
      expect(res.body.data.tmdbId).toBe(tmdbId);
      expect(res.body.data).toHaveProperty('user');
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/v1/comments').send({
        content: 'Great movie!',
        tmdbId,
      });

      expect(res.status).toBe(401);
    });

    it('should return 400 when content is missing', async () => {
      const { accessToken } = await createUserAndLogin();

      const res = await request(app)
        .post('/api/v1/comments')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          tmdbId,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should return 400 when tmdbId is missing', async () => {
      const { accessToken } = await createUserAndLogin();

      const res = await request(app)
        .post('/api/v1/comments')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          content: 'Great movie!',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('validationErrors');
    });

    it('should return 400 when content exceeds max length', async () => {
      const { accessToken } = await createUserAndLogin();

      const res = await request(app)
        .post('/api/v1/comments')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          content: 'a'.repeat(501),
          tmdbId,
        });

      expect(res.status).toBe(400);
    });

    it('should create movie data if movie does not exist', async () => {
      const { accessToken } = await createUserAndLogin();
      const newTmdbId = 999999;

      const res = await request(app)
        .post('/api/v1/comments')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          content: 'Comment on new movie',
          tmdbId: newTmdbId,
        });

      expect(res.status).toBe(201);
      const movie = await MovieModel.findOne({ tmdbId: newTmdbId });
      expect(movie).toBeTruthy();
    });
  });

  describe('GET /api/v1/comments/:id - Get comment by ID', () => {
    it('should return comment by ID when authenticated', async () => {
      const { accessToken } = await createUserAndLogin();

      const createRes = await request(app)
        .post('/api/v1/comments')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          content: 'Test comment',
          tmdbId,
        });

      const commentId = createRes.body.data._id;

      const res = await request(app)
        .get(`/api/v1/comments/${commentId}`)
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(commentId);
      expect(res.body.data.content).toBe('Test comment');
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get(`/api/v1/comments/${new Types.ObjectId()}`);

      expect(res.status).toBe(401);
    });

    it('should return 404 when comment does not exist', async () => {
      const { accessToken } = await createUserAndLogin();

      const res = await request(app)
        .get(`/api/v1/comments/${new Types.ObjectId()}`)
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/comments/movie/:tmdbId - List comments by movie', () => {
    it('should return comments for a specific movie', async () => {
      const { accessToken } = await createUserAndLogin();

      await request(app)
        .post('/api/v1/comments')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({ content: 'Comment 1', tmdbId });

      await request(app)
        .post('/api/v1/comments')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({ content: 'Comment 2', tmdbId });

      const res = await request(app)
        .get(`/api/v1/comments/movie/${tmdbId}`)
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get(`/api/v1/comments/movie/${tmdbId}`);

      expect(res.status).toBe(401);
    });

    it('should return empty list when movie has no comments', async () => {
      const { accessToken } = await createUserAndLogin();

      const res = await request(app)
        .get(`/api/v1/comments/movie/123456`)
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should support pagination', async () => {
      const { accessToken } = await createUserAndLogin();

      // Create 5 comments
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/v1/comments')
          .set('Cookie', [`accessToken=${accessToken}`])
          .send({ content: `Comment ${i}`, tmdbId });
      }

      const res = await request(app)
        .get(`/api/v1/comments/movie/${tmdbId}?page=1&limit=3`)
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.pagination.total).toBe(5);
      expect(res.body.pagination.hasNextPage).toBe(true);
    });
  });

  describe('PATCH /api/v1/comments/:id - Update comment', () => {
    it('should update comment when user is owner', async () => {
      const { accessToken } = await createUserAndLogin();

      const createRes = await request(app)
        .post('/api/v1/comments')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          content: 'Original content',
          tmdbId,
        });

      const commentId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/comments/${commentId}`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          content: 'Updated content',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Comment updated successfully.');
      expect(res.body.data.content).toBe('Updated content');
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).patch(`/api/v1/comments/${new Types.ObjectId()}`).send({
        content: 'Updated content',
      });

      expect(res.status).toBe(401);
    });

    it('should return 401 when user is not the owner', async () => {
      const { accessToken: accessToken1 } = await createUserAndLogin();
      const { accessToken: accessToken2 } = await createUserAndLogin();

      const createRes = await request(app)
        .post('/api/v1/comments')
        .set('Cookie', [`accessToken=${accessToken1}`])
        .send({
          content: 'Original content',
          tmdbId,
        });

      const commentId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/comments/${commentId}`)
        .set('Cookie', [`accessToken=${accessToken2}`])
        .send({
          content: 'Hacked content',
        });

      expect(res.status).toBe(401);
    });

    it('should return 404 when comment does not exist', async () => {
      const { accessToken } = await createUserAndLogin();

      const res = await request(app)
        .patch(`/api/v1/comments/${new Types.ObjectId()}`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          content: 'Updated content',
        });

      expect(res.status).toBe(404);
    });

    it('should return 400 when content is missing', async () => {
      const { accessToken } = await createUserAndLogin();

      const createRes = await request(app)
        .post('/api/v1/comments')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          content: 'Original content',
          tmdbId,
        });

      const commentId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/comments/${commentId}`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/comments/:id - Delete comment', () => {
    it('should delete comment when user is owner', async () => {
      const { accessToken } = await createUserAndLogin();

      const createRes = await request(app)
        .post('/api/v1/comments')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          content: 'To be deleted',
          tmdbId,
        });

      const commentId = createRes.body.data._id;

      const res = await request(app)
        .delete(`/api/v1/comments/${commentId}`)
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(204);

      const comment = await CommentModel.findById(commentId);
      expect(comment).toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).delete(`/api/v1/comments/${new Types.ObjectId()}`);

      expect(res.status).toBe(401);
    });

    it('should return 401 when user is not the owner', async () => {
      const { accessToken: accessToken1 } = await createUserAndLogin();
      const { accessToken: accessToken2 } = await createUserAndLogin();

      const createRes = await request(app)
        .post('/api/v1/comments')
        .set('Cookie', [`accessToken=${accessToken1}`])
        .send({
          content: 'My comment',
          tmdbId,
        });

      const commentId = createRes.body.data._id;

      const res = await request(app)
        .delete(`/api/v1/comments/${commentId}`)
        .set('Cookie', [`accessToken=${accessToken2}`]);

      expect(res.status).toBe(401);

      const comment = await CommentModel.findById(commentId);
      expect(comment).toBeTruthy();
    });

    it('should return 404 when comment does not exist', async () => {
      const { accessToken } = await createUserAndLogin();

      const res = await request(app)
        .delete(`/api/v1/comments/${new Types.ObjectId()}`)
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(404);
    });
  });
});
