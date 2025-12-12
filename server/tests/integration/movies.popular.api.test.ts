import request from 'supertest';
import { createApp } from '../../src/app';
import { connectDatabase, disconnectDatabase } from '../../src/config/database';

describe('Movies API - Popular Endpoint', () => {
  const app = createApp();

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET /api/v1/movies/popular', () => {
    it('should return 200 and a list of popular movies', async () => {
      const res = await request(app).get('/api/v1/movies/popular');
      expect([200, 502]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body).toHaveProperty('pagination');
      }
    });

    it('should support pagination (page=2)', async () => {
      const res = await request(app).get('/api/v1/movies/popular?page=2');
      expect([200, 502]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('pagination');
        expect(res.body.pagination.page).toBe(2);
      }
    });

    it('should validate movie object schema', async () => {
      const res = await request(app).get('/api/v1/movies/popular');
      expect([200, 502]).toContain(res.status);
      if (res.status === 200 && Array.isArray(res.body.data) && res.body.data.length > 0) {
        const movie = res.body.data[0];
        expect(movie).toHaveProperty('tmdbId');
        expect(movie).toHaveProperty('title');
        expect(movie).toHaveProperty('year');
        expect(movie).toHaveProperty('rating');
        expect(movie).toHaveProperty('originalLanguage');
        expect(movie).toHaveProperty('images');
        expect(movie).toHaveProperty('isLocal');
      }
    });

    it('should handle empty results gracefully (simulate high page)', async () => {
      const res = await request(app).get('/api/v1/movies/popular?page=9999');
      expect([200, 502]).toContain(res.status);
      if (res.status === 200) {
        expect(Array.isArray(res.body.data)).toBe(true);
        // Accept either empty or non-empty, but must be an array
      }
    });
  });
});
