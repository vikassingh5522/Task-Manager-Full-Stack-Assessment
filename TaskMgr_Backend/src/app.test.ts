import request from 'supertest';
import { createApp } from './app';

describe('Express Application Setup', () => {
  const app = createApp();

  describe('Health Check Endpoint', () => {
    it('should respond with 200 status and success message', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Server is running');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('CORS Configuration', () => {
    it('should include CORS headers in response', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle OPTIONS preflight requests', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
    });
  });

  describe('Route Mounting', () => {
    it('should mount auth routes at /api/auth', async () => {
      const response = await request(app).post('/api/auth/login');
      // Should not return 404, but may return 400 for missing body
      expect(response.status).not.toBe(404);
    });

    it('should mount task routes at /api/tasks', async () => {
      const response = await request(app).get('/api/tasks');
      // Should not return 404, but may return 401 for missing auth
      expect(response.status).not.toBe(404);
    });

    it('should mount notification routes at /api/notifications', async () => {
      const response = await request(app).get('/api/notifications');
      // Should not return 404, but may return 401 for missing auth
      expect(response.status).not.toBe(404);
    });

    it('should mount user routes at /api/users', async () => {
      const response = await request(app).get('/api/users/profile');
      // Should not return 404, but may return 401 for missing auth
      expect(response.status).not.toBe(404);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('Error Handler', () => {
    it('should handle errors with consistent format', async () => {
      // Try to access a protected route without auth
      const response = await request(app).get('/api/tasks');

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('Security Headers', () => {
    it('should include helmet security headers', async () => {
      const response = await request(app).get('/health');

      // Helmet adds various security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('Body Parser', () => {
    it('should parse JSON request bodies', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        })
        .set('Content-Type', 'application/json');

      // Should not return 400 for unparseable body
      // May return 400 for validation, but body should be parsed
      expect(response.status).not.toBe(415); // Unsupported Media Type
    });
  });
});
