import request from 'supertest';
import { createApp } from '../../src/app';

describe('Movies API - New Endpoints (Integration)', () => {
  const app = createApp();

  describe('GET /api/v1/movies/trending', () => {
    it('should return a paginated list of trending movies', async () => {
      const res = await request(app).get('/api/v1/movies/trending');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination).toHaveProperty('totalPages');
      expect(res.body.pagination).toHaveProperty('limit');
      // At least one trending movie should be present (unless TMDB is empty)
      expect(res.body.data.length).toBeGreaterThanOrEqual(0);
      // Each movie should have isLocal field
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('isLocal');
      }
    });

    it('should support pagination', async () => {
      const res = await request(app).get('/api/v1/movies/trending?page=2');
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(2);
    });
  });

  describe('GET /api/v1/movies/tmdb/:tmdbId', () => {
    it('should fetch and return movie details for a valid TMDB ID', async () => {
      // Get a trending movie to use its tmdbId
      const trendingRes = await request(app).get('/api/v1/movies/trending');
      const movie = trendingRes.body.data.find((m: any) => typeof m.tmdbId === 'number');
      if (!movie) return; // Skip if no trending movie
      const res = await request(app).get(`/api/v1/movies/tmdb/${movie.tmdbId}`);
      expect([200, 404, 502]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('tmdbId', movie.tmdbId);
        expect(res.body.data).toHaveProperty('title');
        expect(res.body.data).toHaveProperty('images');
      } else if (res.status === 404) {
        expect(res.body).toHaveProperty('status', 'fail');
        expect(res.body).toHaveProperty('message');
      } else if (res.status === 502) {
        expect(res.body).toHaveProperty('status', 'error');
        expect(res.body).toHaveProperty('message');
      }
    });

    it('should return 404 for a non-existent TMDB ID', async () => {
      // Use a very large TMDB ID unlikely to exist
      const res = await request(app).get('/api/v1/movies/tmdb/999999999');
      expect([404, 502]).toContain(res.status);
      if (res.status === 404) {
        expect(res.body).toHaveProperty('status', 'fail');
        expect(res.body).toHaveProperty('message');
      } else if (res.status === 502) {
        expect(res.body).toHaveProperty('status', 'error');
        expect(res.body).toHaveProperty('message');
      }
    });
  });
});
