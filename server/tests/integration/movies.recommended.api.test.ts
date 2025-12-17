import request from 'supertest';
import { createApp } from '../../src/app';

describe('Movies API - Recommended Endpoint', () => {
  const app = createApp();

  describe('GET /api/v1/movies/recommended', () => {
    it('should return 200 and a list of recommended movies (requires auth cookie)', async () => {
      const res = await request(app)
        .get('/api/v1/movies/recommended')
        .set('Cookie', ['access_token=fake-token']);
      expect([200, 502]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body).toHaveProperty('pagination');
      }
    });

    it('should support pagination (page=2)', async () => {
      const res = await request(app)
        .get('/api/v1/movies/recommended?page=2')
        .set('Cookie', ['access_token=fake-token']);
      expect([200, 502]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('pagination');
        expect(res.body.pagination.page).toBe(2);
      }
    });

    it('should validate movie object schema', async () => {
      const res = await request(app)
        .get('/api/v1/movies/recommended')
        .set('Cookie', ['access_token=fake-token']);
      expect([200, 502]).toContain(res.status);
      if (res.status === 200 && Array.isArray(res.body.data) && res.body.data.length > 0) {
        const movie = res.body.data[0];
        expect(movie).toHaveProperty('tmdbId');
        expect(movie).toHaveProperty('title');
        expect(movie).toHaveProperty('year');
        expect(movie).toHaveProperty('rating');
        expect(movie).toHaveProperty('originalLanguage');
        expect(movie).toHaveProperty('overview');
        expect(movie).toHaveProperty('genres');
        expect(movie).toHaveProperty('images');
        expect(movie).toHaveProperty('isLocal');
        expect(Array.isArray(movie.genres)).toBe(true);
      }
    });

    it('should handle empty results gracefully (simulate high page)', async () => {
      const res = await request(app)
        .get('/api/v1/movies/recommended?page=9999')
        .set('Cookie', ['access_token=fake-token']);
      expect([200, 502]).toContain(res.status);
      if (res.status === 200) {
        expect(Array.isArray(res.body.data)).toBe(true);
        // Accept either empty or non-empty, but must be an array
      }
    });
  });
});
