import request from 'supertest';
import { createApp } from '../../../src/app';
import mongoose, { Types } from 'mongoose';
import { UserModel } from '../../../src/models/User';
import { MovieModel } from '../../../src/models/Movie';
import { MovieInteractionModel } from '../../../src/models/MovieInteraction';

describe('Movie State Flags API (Optional Auth)', () => {
  let app: ReturnType<typeof createApp>['app'];

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

    // Get user and verify email
    const user = await UserModel.findOne({ username: testUsername });
    if (!user) throw new Error('User not found after signup');

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

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    app = createApp().app;
  });

  describe('Authenticated User - State Flags', () => {
    it('should return isWatched=true for completed movies', async () => {
      const { accessToken, userId } = await createUserAndLogin();

      // Create a movie
      const movie = await MovieModel.create({
        imdbId: 'tt0111161',
        tmdbId: 278,
        title: 'The Shawshank Redemption',
        year: 1994,
        images: { thumbnail: '', poster: '', backdrop: '' },
        torrents: [],
        downloadStatus: 'not_downloaded',
        lastUpdated: new Date(),
      });

      // Create a watched interaction (completed)
      await MovieInteractionModel.create({
        userId,
        movieId: movie._id,
        interactionType: 'watched',
        isCompleted: true,
        watchProgress: 100,
        duration: 7200,
        lastWatchedPosition: 7200,
      });

      const res = await request(app)
        .get('/api/v1/movies')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].isWatched).toBe(true);
      expect(res.body.data[0].inWatchlist).toBe(false);
      expect(res.body.data[0].userRating).toBeNull();
    });

    it('should return inWatchlist=true for watchlisted movies', async () => {
      const { accessToken, userId } = await createUserAndLogin();

      const movie = await MovieModel.create({
        imdbId: 'tt0068646',
        tmdbId: 238,
        title: 'The Godfather',
        year: 1972,
        images: { thumbnail: '', poster: '', backdrop: '' },
        torrents: [],
        downloadStatus: 'not_downloaded',
        lastUpdated: new Date(),
      });

      // Add to watchlist
      await MovieInteractionModel.create({
        userId,
        movieId: movie._id,
        interactionType: 'watchlist',
      });

      const res = await request(app)
        .get('/api/v1/movies')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data[0].isWatched).toBe(false);
      expect(res.body.data[0].inWatchlist).toBe(true);
      expect(res.body.data[0].userRating).toBeNull();
    });

    it('should return userRating for rated movies', async () => {
      const { accessToken, userId } = await createUserAndLogin();

      const movie = await MovieModel.create({
        imdbId: 'tt0071562',
        tmdbId: 240,
        title: 'The Godfather Part II',
        year: 1974,
        images: { thumbnail: '', poster: '', backdrop: '' },
        torrents: [],
        downloadStatus: 'not_downloaded',
        lastUpdated: new Date(),
      });

      // Rate the movie
      await MovieInteractionModel.create({
        userId,
        movieId: movie._id,
        interactionType: 'rated',
        rating: 9,
      });

      const res = await request(app)
        .get('/api/v1/movies')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data[0].isWatched).toBe(false);
      expect(res.body.data[0].inWatchlist).toBe(false);
      expect(res.body.data[0].userRating).toBe(9);
    });

    it('should return all state flags for a movie with multiple interactions', async () => {
      const { accessToken, userId } = await createUserAndLogin();

      const movie = await MovieModel.create({
        imdbId: 'tt0468569',
        tmdbId: 155,
        title: 'The Dark Knight',
        year: 2008,
        images: { thumbnail: '', poster: '', backdrop: '' },
        torrents: [],
        downloadStatus: 'not_downloaded',
        lastUpdated: new Date(),
      });

      // Multiple interactions
      await MovieInteractionModel.create([
        {
          userId,
          movieId: movie._id,
          interactionType: 'watchlist',
        },
        {
          userId,
          movieId: movie._id,
          interactionType: 'watched',
          isCompleted: true,
          watchProgress: 95,
        },
        {
          userId,
          movieId: movie._id,
          interactionType: 'rated',
          rating: 10,
        },
      ]);

      const res = await request(app)
        .get('/api/v1/movies')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data[0].isWatched).toBe(true);
      expect(res.body.data[0].inWatchlist).toBe(true);
      expect(res.body.data[0].userRating).toBe(10);
    });

    it('should return different states for different movies', async () => {
      const { accessToken, userId } = await createUserAndLogin();

      const movie1 = await MovieModel.create({
        imdbId: 'tt0111161',
        tmdbId: 278,
        title: 'The Shawshank Redemption',
        year: 1994,
        images: { thumbnail: '', poster: '', backdrop: '' },
        torrents: [],
        downloadStatus: 'not_downloaded',
        lastUpdated: new Date(),
      });

      const movie2 = await MovieModel.create({
        imdbId: 'tt0068646',
        tmdbId: 238,
        title: 'The Godfather',
        year: 1972,
        images: { thumbnail: '', poster: '', backdrop: '' },
        torrents: [],
        downloadStatus: 'not_downloaded',
        lastUpdated: new Date(),
      });

      // Movie1: watched
      await MovieInteractionModel.create({
        userId,
        movieId: movie1._id,
        interactionType: 'watched',
        isCompleted: true,
      });

      // Movie2: in watchlist
      await MovieInteractionModel.create({
        userId,
        movieId: movie2._id,
        interactionType: 'watchlist',
      });

      const res = await request(app)
        .get('/api/v1/movies')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);

      const shawshank = res.body.data.find((m: any) => m.imdbId === 'tt0111161');
      const godfather = res.body.data.find((m: any) => m.imdbId === 'tt0068646');

      expect(shawshank.isWatched).toBe(true);
      expect(shawshank.inWatchlist).toBe(false);

      expect(godfather.isWatched).toBe(false);
      expect(godfather.inWatchlist).toBe(true);
    });

    it('should work for GET /movies/trending endpoint', async () => {
      const { accessToken, userId } = await createUserAndLogin();

      // Create a local movie matching a TMDB trending movie
      const movie = await MovieModel.create({
        imdbId: 'tt0111161',
        tmdbId: 278,
        title: 'The Shawshank Redemption',
        year: 1994,
        images: { thumbnail: '', poster: '', backdrop: '' },
        torrents: [],
        downloadStatus: 'not_downloaded',
        lastUpdated: new Date(),
      });

      await MovieInteractionModel.create({
        userId,
        movieId: movie._id,
        interactionType: 'watchlist',
      });

      const res = await request(app)
        .get('/api/v1/movies/trending')
        .set('Cookie', [`accessToken=${accessToken}`])
        .query({ page: 1 });

      expect(res.status).toBe(200);
      // TMDB trending will return many movies, find ours
      const localMovie = res.body.data.find((m: any) => m.tmdbId === 278 && m.isLocal);
      if (localMovie) {
        expect(localMovie.inWatchlist).toBe(true);
      }
    });

    it('should work for GET /movies/:id endpoint', async () => {
      const { accessToken, userId } = await createUserAndLogin();

      const movie = await MovieModel.create({
        imdbId: 'tt0111161',
        tmdbId: 278,
        title: 'The Shawshank Redemption',
        year: 1994,
        images: { thumbnail: '', poster: '', backdrop: '' },
        torrents: [],
        downloadStatus: 'not_downloaded',
        lastUpdated: new Date(),
      });

      await MovieInteractionModel.create({
        userId,
        movieId: movie._id,
        interactionType: 'rated',
        rating: 8,
      });

      const res = await request(app)
        .get(`/api/v1/movies/${movie._id}`)
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.userRating).toBe(8);
    });

    it('should add a movie to the user watchlist via POST /movies/watchlist/:tmdbId', async () => {
      const { accessToken } = await createUserAndLogin();

      const movie = await MovieModel.create({
        imdbId: 'tt0137523',
        tmdbId: 550,
        title: 'Fight Club',
        year: 1999,
        images: { thumbnail: '', poster: '', backdrop: '' },
        torrents: [],
        downloadStatus: 'not_downloaded',
        lastUpdated: new Date(),
      });

      const res = await request(app)
        .post(`/api/v1/movies/watchlist/${movie.tmdbId}`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send();

      expect(res.status).toBe(201);
      expect(res.body.data.interactionType).toBe('watchlist');
      expect(res.body.data.movieId).toBe(movie._id.toString());

      // Verify the movie is marked inWatchlist on subsequent fetch
      const listRes = await request(app)
        .get('/api/v1/movies')
        .set('Cookie', [`accessToken=${accessToken}`]);
      expect(listRes.status).toBe(200);
      const added = listRes.body.data.find(
        (m: any) => m.tmdbId === movie.tmdbId || m.imdbId === movie.imdbId,
      );
      expect(added).toBeDefined();
      expect(added.inWatchlist).toBe(true);
    });
  });

  describe('Unauthenticated User - Default State Flags', () => {
    it('should return default state flags when no token provided', async () => {
      await MovieModel.create({
        imdbId: 'tt0111161',
        tmdbId: 278,
        title: 'The Shawshank Redemption',
        year: 1994,
        images: { thumbnail: '', poster: '', backdrop: '' },
        torrents: [],
        downloadStatus: 'not_downloaded',
        lastUpdated: new Date(),
      });

      const res = await request(app).get('/api/v1/movies');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].isWatched).toBe(false);
      expect(res.body.data[0].inWatchlist).toBe(false);
      expect(res.body.data[0].userRating).toBeNull();
    });

    it('should return default state flags for multiple movies', async () => {
      await MovieModel.create([
        {
          imdbId: 'tt0111161',
          tmdbId: 278,
          title: 'The Shawshank Redemption',
          year: 1994,
          images: { thumbnail: '', poster: '', backdrop: '' },
          torrents: [],
          downloadStatus: 'not_downloaded',
          lastUpdated: new Date(),
        },
        {
          imdbId: 'tt0068646',
          tmdbId: 238,
          title: 'The Godfather',
          year: 1972,
          images: { thumbnail: '', poster: '', backdrop: '' },
          torrents: [],
          downloadStatus: 'not_downloaded',
          lastUpdated: new Date(),
        },
      ]);

      const res = await request(app).get('/api/v1/movies');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);

      res.body.data.forEach((movie: any) => {
        expect(movie.isWatched).toBe(false);
        expect(movie.inWatchlist).toBe(false);
        expect(movie.userRating).toBeNull();
      });
    });

    it('should work for GET /movies/trending without auth', async () => {
      const res = await request(app).get('/api/v1/movies/trending').query({ page: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      // All movies should have default state flags
      res.body.data.forEach((movie: any) => {
        expect(movie.isWatched).toBe(false);
        expect(movie.inWatchlist).toBe(false);
        expect(movie.userRating).toBeNull();
      });
    });

    it('should work for GET /movies/popular without auth', async () => {
      const res = await request(app).get('/api/v1/movies/popular').query({ page: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      res.body.data.forEach((movie: any) => {
        expect(movie.isWatched).toBe(false);
        expect(movie.inWatchlist).toBe(false);
        expect(movie.userRating).toBeNull();
      });
    });

    it('should work for GET /movies/search without auth', async () => {
      await MovieModel.create({
        imdbId: 'tt0111161',
        tmdbId: 278,
        title: 'The Shawshank Redemption',
        year: 1994,
        images: { thumbnail: '', poster: '', backdrop: '' },
        torrents: [],
        downloadStatus: 'not_downloaded',
        lastUpdated: new Date(),
      });

      const res = await request(app)
        .get('/api/v1/movies/search')
        .query({ search: 'Shawshank', page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data[0].isWatched).toBe(false);
      expect(res.body.data[0].inWatchlist).toBe(false);
      expect(res.body.data[0].userRating).toBeNull();
    });

    // it('should work for GET /movies/:id without auth', async () => {
    //   const movie = await MovieModel.create({
    //     imdbId: 'tt0111161',
    //     tmdbId: 278,
    //     title: 'The Shawshank Redemption',
    //     year: 1994,
    //     images: { thumbnail: '', poster: '', backdrop: '' },
    //     torrents: [],
    //     downloadStatus: 'not_downloaded',
    //     lastUpdated: new Date(),
    //   });

    //   const res = await request(app).get(`/api/v1/movies/${movie._id}`);

    //   expect(res.status).toBe(200);
    //   expect(res.body.data.isWatched).toBe(false);
    //   expect(res.body.data.inWatchlist).toBe(false);
    //   expect(res.body.data.userRating).toBeNull();
    // });

    it('should treat invalid token as unauthenticated', async () => {
      await MovieModel.create({
        imdbId: 'tt0111161',
        tmdbId: 278,
        title: 'The Shawshank Redemption',
        year: 1994,
        images: { thumbnail: '', poster: '', backdrop: '' },
        torrents: [],
        downloadStatus: 'not_downloaded',
        lastUpdated: new Date(),
      });

      const res = await request(app)
        .get('/api/v1/movies')
        .set('Cookie', ['accessToken=invalid-token']);

      expect(res.status).toBe(200);
      expect(res.body.data[0].isWatched).toBe(false);
      expect(res.body.data[0].inWatchlist).toBe(false);
      expect(res.body.data[0].userRating).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should return isWatched=false for incomplete watch progress', async () => {
      const { accessToken, userId } = await createUserAndLogin();

      const movie = await MovieModel.create({
        imdbId: 'tt0111161',
        tmdbId: 278,
        title: 'The Shawshank Redemption',
        year: 1994,
        images: { thumbnail: '', poster: '', backdrop: '' },
        torrents: [],
        downloadStatus: 'not_downloaded',
        lastUpdated: new Date(),
      });

      // Partial watch (not completed)
      await MovieInteractionModel.create({
        userId,
        movieId: movie._id,
        interactionType: 'watched',
        isCompleted: false,
        watchProgress: 50,
      });

      const res = await request(app)
        .get('/api/v1/movies')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data[0].isWatched).toBe(false);
    });

    it('should handle movie with no interactions (authenticated user)', async () => {
      const { accessToken } = await createUserAndLogin();

      await MovieModel.create({
        imdbId: 'tt0111161',
        tmdbId: 278,
        title: 'The Shawshank Redemption',
        year: 1994,
        images: { thumbnail: '', poster: '', backdrop: '' },
        torrents: [],
        downloadStatus: 'not_downloaded',
        lastUpdated: new Date(),
      });

      const res = await request(app)
        .get('/api/v1/movies')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data[0].isWatched).toBe(false);
      expect(res.body.data[0].inWatchlist).toBe(false);
      expect(res.body.data[0].userRating).toBeNull();
    });
  });
});
