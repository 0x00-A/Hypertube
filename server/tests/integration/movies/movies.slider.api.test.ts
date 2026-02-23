import request from 'supertest';
import { createApp } from '../../../src/app';
import { connectDatabase, disconnectDatabase } from '../../../src/config/database';
import mongoose from 'mongoose';

describe('GET /api/v1/movies/slider', () => {
  const { app } = createApp();

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDatabase();
    }
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should return up to 6 slider movies (200) or gracefully handle TMDB errors (502)', async () => {
    const res = await request(app).get('/api/v1/movies/slider');
    expect([200, 502]).toContain(res.status);

    if (res.status === 200) {
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(6);

      if (res.body.data.length > 0) {
        const movie = res.body.data[0];
        expect(movie).toHaveProperty('title');
        expect(movie).toHaveProperty('images');
        expect(movie.images).toHaveProperty('thumbnail');
        // Ensure heavy fields are not present
        expect(movie).not.toHaveProperty('torrents');
        expect(movie).not.toHaveProperty('cast');
        expect(movie).not.toHaveProperty('downloadStatus');
      }
    } else if (res.status === 502) {
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('message');
    }
  }, 20000);
});
