import request from 'supertest';
import { app } from '../app';

describe('health endpoints', () => {
  it('returns livez payload without auth headers', async () => {
    const res = await request(app).get('/livez');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });

  it('returns readiness insight under /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('uptimeSeconds');
  });
});
