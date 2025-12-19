import request from 'supertest';
import { createApp } from '../../src/app';

import { MovieModel } from '../../src/models/Movie';
import mongoose from 'mongoose';
import { IMovie } from '../../src/interfaces/movie.interface';

afterEach(async () => {
  // Ensure no leftover movies between tests
  if (mongoose.connection.readyState === 1) {
    await MovieModel.deleteMany({});
  }
});

describe('Movies API Integration Tests', () => {
  const app = createApp();

  // Use a unique suffix for all sample movies in this test run
  const unique = Math.random().toString(36).substring(2, 8) + Date.now();
  const sampleMovie1: Partial<IMovie> = {
    imdbId: `tt1234567_${unique}`,
    tmdbId: 1001,
    title: `Test Movie 1 ${unique}`,
    year: 2023,
    rating: 8.5,
    duration: 120,
    synopsis: 'A test movie for integration testing',
    genres: ['Action', 'Thriller'],
    originalLanguage: 'en',
    trailer: 'https://youtube.com/watch?v=test1',
    images: {
      thumbnail: 'https://example.com/thumb1.jpg',
      poster: 'https://example.com/poster1.jpg',
      backdrop: 'https://example.com/backdrop1.jpg',
    },
    torrents: [
      {
        url: 'magnet:?xt=urn:btih:test1',
        hash: 'testhash1',
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

  const sampleMovie2: Partial<IMovie> = {
    imdbId: `tt7654321_${unique}`,
    tmdbId: 1002,
    title: `Test Movie 2 ${unique}`,
    year: 2022,
    rating: 7.2,
    duration: 95,
    synopsis: 'Another test movie',
    genres: ['Comedy', 'Drama'],
    originalLanguage: 'en',
    trailer: 'https://youtube.com/watch?v=test2',
    images: {
      thumbnail: 'https://example.com/thumb2.jpg',
      poster: 'https://example.com/poster2.jpg',
      backdrop: 'https://example.com/backdrop2.jpg',
    },
    torrents: [
      {
        url: 'magnet:?xt=urn:btih:test2',
        hash: 'testhash2',
        quality: '720p',
        type: 'mp4',
        videoCodec: 'x264',
        seeds: 80,
        peers: 30,
        size: '900 MB',
        sizeBytes: 943718400,
        provider: 'YTS',
      },
    ],
    downloadStatus: 'not_downloaded',
    lastUpdated: new Date(),
  };

  const sampleMovie3: Partial<IMovie> = {
    imdbId: `tt9999944_${unique}`,
    tmdbId: 1003,
    title: `Searchable Movie Title ${unique}`,
    year: 2021,
    rating: 6.8,
    duration: 110,
    synopsis: 'Movie for search testing',
    genres: ['Horror'],
    originalLanguage: 'en',
    images: {
      thumbnail: 'https://example.com/thumb3.jpg',
      poster: 'https://example.com/poster3.jpg',
      backdrop: 'https://example.com/backdrop3.jpg',
    },
    torrents: [
      {
        url: 'magnet:?xt=urn:btih:test3',
        hash: 'testhash3',
        quality: '1080p',
        type: 'mp4',
        videoCodec: 'x264',
        seeds: 120,
        peers: 60,
        size: '2.1 GB',
        sizeBytes: 2254857830,
        provider: 'YTS',
      },
    ],
    downloadStatus: 'not_downloaded',
    lastUpdated: new Date(),
  };

  beforeEach(async () => {
    // Clear movies collection before each test
    if (mongoose.connection.readyState === 1) {
      await MovieModel.deleteMany({});
    }
  });

  describe('GET /api/v1/movies', () => {
    beforeEach(async () => {
      // Insert sample movies for list tests (already unique)
      await MovieModel.create([sampleMovie1, sampleMovie2, sampleMovie3]);
    });

    it('should return paginated list of movies with default parameters', async () => {
      const res = await request(app).get('/api/v1/movies');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(20);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 3,
        totalPages: 1,
      });
    });

    it('should return movies with custom pagination (page 1, limit 2)', async () => {
      const res = await request(app).get('/api/v1/movies?page=1&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
    });

    it('should return second page with custom pagination', async () => {
      const res = await request(app).get('/api/v1/movies?page=2&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination).toMatchObject({
        page: 2,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
    });

    it('should filter movies by search term (title)', async () => {
      const res = await request(app).get('/api/v1/movies?search=Searchable');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toContain('Searchable');
    });

    it('should filter movies by genre', async () => {
      const res = await request(app).get('/api/v1/movies?genre=Action');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].genres).toContain('Action');
    });

    it('should filter movies by minimum rating', async () => {
      const res = await request(app).get('/api/v1/movies?minRating=8.0');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((movie: IMovie) => {
        expect(movie.rating).toBeGreaterThanOrEqual(8.0);
      });
    });

    it('should filter movies by year', async () => {
      const res = await request(app).get('/api/v1/movies?year=2023');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].year).toBe(2023);
    });

    it('should sort movies by rating descending', async () => {
      const res = await request(app).get('/api/v1/movies?sortBy=rating&sortOrder=desc');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data[0].rating).toBeGreaterThanOrEqual(res.body.data[1].rating);
      expect(res.body.data[1].rating).toBeGreaterThanOrEqual(res.body.data[2].rating);
    });

    it('should sort movies by year ascending', async () => {
      const res = await request(app).get('/api/v1/movies?sortBy=year&sortOrder=asc');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data[0].year).toBeLessThanOrEqual(res.body.data[1].year);
      expect(res.body.data[1].year).toBeLessThanOrEqual(res.body.data[2].year);
    });

    it('should sort movies by title ascending', async () => {
      const res = await request(app).get('/api/v1/movies?sortBy=title&sortOrder=asc');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      // Verify alphabetical order
      for (let i = 0; i < res.body.data.length - 1; i++) {
        expect(
          res.body.data[i].title.localeCompare(res.body.data[i + 1].title),
        ).toBeLessThanOrEqual(0);
      }
    });

    it('should combine multiple filters (genre + minRating + year)', async () => {
      const res = await request(app).get('/api/v1/movies?genre=Action&minRating=8.0&year=2023');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((movie: IMovie) => {
        expect(movie.genres).toContain('Action');
        expect(movie.rating).toBeGreaterThanOrEqual(8.0);
        expect(movie.year).toBe(2023);
      });
    });

    it('should return 400 for invalid page parameter', async () => {
      const res = await request(app).get('/api/v1/movies?page=0');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Validation Error',
      });
      expect(res.body.validationErrors).toBeDefined();
    });

    it('should return 400 for invalid limit parameter (exceeds max)', async () => {
      const res = await request(app).get('/api/v1/movies?limit=200');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Validation Error',
      });
    });

    it('should return 400 for invalid minRating parameter', async () => {
      const res = await request(app).get('/api/v1/movies?minRating=15');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Validation Error',
      });
    });

    it('should return 400 for invalid year parameter', async () => {
      const res = await request(app).get('/api/v1/movies?year=1800');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Validation Error',
      });
    });

    it('should return 400 for invalid sortBy parameter', async () => {
      const res = await request(app).get('/api/v1/movies?sortBy=invalid');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Validation Error',
      });
    });

    it('should return 400 for invalid sortOrder parameter', async () => {
      const res = await request(app).get('/api/v1/movies?sortOrder=invalid');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Validation Error',
      });
    });

    it('should return empty array when no movies match filters', async () => {
      const res = await request(app).get('/api/v1/movies?genre=NonExistentGenre');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    it('should return empty array for page beyond total pages', async () => {
      const res = await request(app).get('/api/v1/movies?page=999');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should handle search with special characters', async () => {
      const res = await request(app).get('/api/v1/movies?search=Test%20Movie');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should return movies sorted by lastUpdated (default)', async () => {
      const res = await request(app).get('/api/v1/movies?sortBy=lastUpdated&sortOrder=desc');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      // Most recently updated should be first
      for (let i = 0; i < res.body.data.length - 1; i++) {
        const date1 = new Date(res.body.data[i].lastUpdated);
        const date2 = new Date(res.body.data[i + 1].lastUpdated);
        expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
      }
    });
  });

  describe('GET /api/v1/movies/:id', () => {
    let movieId: string;

    beforeEach(async () => {
      // Insert a sample movie and get its ID (already unique)
      const movie = await MovieModel.create(sampleMovie1);
      movieId = movie._id.toString();
    });

    it('should return a movie by valid ID', async () => {
      const res = await request(app).get(`/api/v1/movies/${movieId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toMatchObject({
        imdbId: sampleMovie1.imdbId,
        title: sampleMovie1.title,
        year: sampleMovie1.year,
        rating: sampleMovie1.rating,
      });
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('torrents');
      expect(Array.isArray(res.body.data.torrents)).toBe(true);
      expect(res.body.data.torrents.length).toBeGreaterThan(0);
    });

    it('should return movie with all required fields', async () => {
      const res = await request(app).get(`/api/v1/movies/${movieId}`);

      expect(res.status).toBe(200);
      const movie = res.body.data;

      // Check required fields
      expect(movie).toHaveProperty('imdbId');
      expect(movie).toHaveProperty('title');
      expect(movie).toHaveProperty('year');
      expect(movie).toHaveProperty('images');
      expect(movie.images).toHaveProperty('thumbnail');
      expect(movie.images).toHaveProperty('poster');
      expect(movie.images).toHaveProperty('backdrop');
      expect(movie).toHaveProperty('torrents');
      expect(movie).toHaveProperty('downloadStatus');
      expect(movie).toHaveProperty('lastUpdated');
    });

    it('should return 404 for non-existent movie ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`/api/v1/movies/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Movie not found',
      });
    });

    it('should return 400 for invalid ObjectId format', async () => {
      const res = await request(app).get('/api/v1/movies/invalid-id-format');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Validation Error',
      });
      expect(res.body.validationErrors).toBeDefined();
    });

    it('should return 400 for too short ID', async () => {
      const res = await request(app).get('/api/v1/movies/123');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Validation Error',
      });
    });

    it('should return 400 for ID with invalid characters', async () => {
      const res = await request(app).get('/api/v1/movies/507f1f77bcf86cd79943901g'); // 'g' is invalid

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'fail',
        message: 'Validation Error',
      });
    });

    it('should return movie with torrent details', async () => {
      const res = await request(app).get(`/api/v1/movies/${movieId}`);

      expect(res.status).toBe(200);
      const torrent = res.body.data.torrents[0];

      expect(torrent).toHaveProperty('url');
      expect(torrent).toHaveProperty('hash');
      expect(torrent).toHaveProperty('quality');
      expect(torrent).toHaveProperty('seeds');
      expect(torrent).toHaveProperty('peers');
      expect(torrent).toHaveProperty('size');
      expect(torrent).toHaveProperty('sizeBytes');
      expect(torrent.seeds).toBeGreaterThanOrEqual(0);
      expect(torrent.peers).toBeGreaterThanOrEqual(0);
    });

    it('should return correct data types for all fields', async () => {
      const res = await request(app).get(`/api/v1/movies/${movieId}`);

      expect(res.status).toBe(200);
      const movie = res.body.data;

      expect(typeof movie._id).toBe('string');
      expect(typeof movie.imdbId).toBe('string');
      expect(typeof movie.title).toBe('string');
      expect(typeof movie.year).toBe('number');
      expect(typeof movie.rating).toBe('number');
      expect(typeof movie.duration).toBe('number');
      expect(Array.isArray(movie.genres)).toBe(true);
      expect(Array.isArray(movie.torrents)).toBe(true);
      expect(['not_downloaded', 'downloading', 'downloaded']).toContain(movie.downloadStatus);
    });
  });

  describe('Movie Data Integrity', () => {
    it('should not allow duplicate imdbId', async () => {
      // Use a unique imdbId for this test
      const imdbId = `ttdup_${unique}`;
      const movie = { ...sampleMovie1, imdbId };
      await MovieModel.create(movie);
      // Try to create another movie with the same imdbId
      try {
        await MovieModel.create(movie);
        fail('Should have thrown duplicate key error');
      } catch (error: any) {
        expect(error.code).toBe(11000); // MongoDB duplicate key error
      }
    });

    it('should enforce required fields', async () => {
      const invalidMovie = {
        title: 'Invalid Movie',
        // Missing required fields: imdbId, year, images
      };

      try {
        await MovieModel.create(invalidMovie);
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should validate year range', async () => {
      const movieWithInvalidYear = {
        ...sampleMovie1,
        imdbId: 'tt0000001',
        year: 1800, // Before 1900
      };

      try {
        await MovieModel.create(movieWithInvalidYear);
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should validate rating range', async () => {
      const movieWithInvalidRating = {
        ...sampleMovie1,
        imdbId: 'tt0000002',
        rating: 15, // Above 10
      };

      try {
        await MovieModel.create(movieWithInvalidRating);
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.name).toBe('ValidationError');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle movie with minimal required fields', async () => {
      const minimalMovie = await MovieModel.create({
        imdbId: 'tt1111111',
        tmdbId: 1111,
        title: 'Minimal Movie',
        year: 2023,
        images: {
          thumbnail: 'https://example.com/thumb.jpg',
          poster: 'https://example.com/poster.jpg',
          backdrop: 'https://example.com/backdrop.jpg',
        },
        torrents: [],
      });

      const res = await request(app).get(`/api/v1/movies/${minimalMovie._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Minimal Movie');
    });

    it('should handle movie with very long title', async () => {
      const longTitle = 'A'.repeat(500);
      const movieWithLongTitle = await MovieModel.create({
        ...sampleMovie1,
        imdbId: 'tt2222222',
        tmdbId: 2222,
        title: longTitle,
      });

      const res = await request(app).get(`/api/v1/movies/${movieWithLongTitle._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe(longTitle);
    });

    it('should handle movie with multiple torrents', async () => {
      const movieWithMultipleTorrents = await MovieModel.create({
        ...sampleMovie1,
        imdbId: 'tt3333333',
        tmdbId: 3333,
        torrents: [
          sampleMovie1.torrents![0],
          {
            ...sampleMovie1.torrents![0],
            quality: '720p',
            size: '800 MB',
            sizeBytes: 838860800,
          },
          {
            ...sampleMovie1.torrents![0],
            quality: '480p',
            size: '400 MB',
            sizeBytes: 419430400,
          },
        ],
      });

      const res = await request(app).get(`/api/v1/movies/${movieWithMultipleTorrents._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.torrents.length).toBe(3);
    });

    it('should handle search with no results', async () => {
      await MovieModel.create(sampleMovie1);

      const res = await request(app).get('/api/v1/movies?search=NonExistentMovieTitle12345');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    it('should handle very high page number gracefully', async () => {
      await MovieModel.create(sampleMovie1);

      const res = await request(app).get('/api/v1/movies?page=1000000');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});
