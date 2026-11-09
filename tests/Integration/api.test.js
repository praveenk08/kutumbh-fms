/**
 * @file api.test.js
 * @description API Integration tests using Supertest.
 */

const request = require('supertest');
const app = require('../../src/app');

describe('Core API Endpoints - Integration Tests', () => {
  it('GET /health - should return 200 OK and health status', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Kutumbh FMS Core API is healthy');
  });

  it('GET /unknown-route - should return standard 404 error format', async () => {
    const response = await request(app).get('/api/v1/non-existent-endpoint');
    
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Endpoint not found');
  });

  it('GET /api/v1/families - should return 200 OK with family listing structure', async () => {
    const response = await request(app).get('/api/v1/families?limit=5');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('families');
    expect(response.body.data).toHaveProperty('pagination');
  });
});