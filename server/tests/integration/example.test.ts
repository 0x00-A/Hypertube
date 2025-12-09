import request from 'supertest';
import { createApp } from '../../src/app';

describe('Example integration placeholder', () => {
  const app = createApp();
  it('GET /v1/movies returns 401 without auth', async () => {
    const res = await request(app).get('/v1/movies');
    expect(res.status).toBe(401);
  });
  // TODO: add more tests once business logic implemented
});
