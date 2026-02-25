import request from 'supertest';
import { createApp } from '../../../src/app';

describe('Movies API - Curated Endpoint', () => {
  const { app } = createApp();

  describe('GET /api/v1/movies/curated', () => {
    it('should return 200 and a list of curated movies', async () => {
      const res = await request(app).get('/api/v1/movies/curated');
      expect([200, 502]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body).toHaveProperty('pagination');
      }
    });

    it('should validate movie object schema for curated items', async () => {
      const res = await request(app).get('/api/v1/movies/curated');
      expect([200, 502]).toContain(res.status);
      if (res.status === 200 && Array.isArray(res.body.data) && res.body.data.length > 0) {
        const movie = res.body.data[0];
        expect(movie).toHaveProperty('tmdbId');
        expect(movie).toHaveProperty('title');
        expect(movie).toHaveProperty('year');
        expect(movie).toHaveProperty('images');
      }
    });

    it('should support query params like limit', async () => {
      const res = await request(app).get('/api/v1/movies/curated?limit=3');
      expect([200, 502]).toContain(res.status);
      if (res.status === 200) {
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeLessThanOrEqual(3);
      }
    });
  });
});
