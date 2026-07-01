import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { authMiddleware, requireRole } from '../middleware/auth';

function makeToken(userRole: string) {
  return jwt.sign(
    {
      sub: '1',
      role: 'authenticated',
      aud: 'authenticated',
      club_id: 1,
      user_role: userRole,
      email: 'test@test.com',
    },
    config.jwtSecret,
    { expiresIn: '1h' },
  );
}

describe('requireRole middleware', () => {
  it('allows coach access', async () => {
    const app = express();
    app.use(authMiddleware);
    app.use(requireRole('coach'));
    app.get('/test', (_req, res) => res.json({ ok: true }));

    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${makeToken('coach')}`);

    expect(res.status).toBe(200);
  });

  it('rejects swimmer access with 403', async () => {
    const app = express();
    app.use(authMiddleware);
    app.use(requireRole('coach'));
    app.get('/test', (_req, res) => res.json({ ok: true }));

    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${makeToken('swimmer')}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Accès refusé : droits insuffisants');
  });

  it('rejects unauthenticated access with 401', async () => {
    const app = express();
    app.use(authMiddleware);
    app.use(requireRole('coach'));
    app.get('/test', (_req, res) => res.json({ ok: true }));

    const res = await request(app).get('/test');

    expect(res.status).toBe(401);
  });
});

describe('Admin routes dev bypass', () => {
  const origNodeEnv = config.nodeEnv;

  afterAll(() => {
    (config as Record<string, unknown>).nodeEnv = origNodeEnv;
  });

  it('bypasses role check when nodeEnv is not production', async () => {
    const app = express();
    app.use(authMiddleware);
    app.use((req, res, next) => {
      if (config.nodeEnv !== 'production') return next();
      return requireRole('coach')(req, res, next);
    });
    app.get('/api/admin/test', (_req, res) => res.json({ ok: true }));

    const res = await request(app)
      .get('/api/admin/test')
      .set('Authorization', `Bearer ${makeToken('swimmer')}`);

    expect(res.status).toBe(200);
  });

  it.skip('allows admin role when nodeEnv is production', async () => {
    (config as Record<string, unknown>).nodeEnv = 'production';

    const app = express();
    app.use(authMiddleware);
    app.use((req, res, next) => {
      const middleware = requireRole('coach', 'admin');
      return middleware(req, res, next);
    });
    app.get('/api/admin/test', (_req, res) => res.json({ ok: true }));

    const res = await request(app)
      .get('/api/admin/test')
      .set('Authorization', `Bearer ${makeToken('admin')}`);

    expect(res.status).toBe(200);
  });

  it.skip('rejects swimmer when nodeEnv is production', async () => {
    (config as Record<string, unknown>).nodeEnv = 'production';

    const app = express();
    app.use(authMiddleware);
    app.use((req, res, next) => {
      const middleware = requireRole('coach', 'admin');
      return middleware(req, res, next);
    });
    app.get('/api/admin/test', (_req, res) => res.json({ ok: true }));

    const res = await request(app)
      .get('/api/admin/test')
      .set('Authorization', `Bearer ${makeToken('swimmer')}`);

    expect(res.status).toBe(403);
  });
});
