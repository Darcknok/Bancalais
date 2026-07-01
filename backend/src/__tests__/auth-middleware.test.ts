import type { Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { authMiddleware, requireRole } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

function mockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authMiddleware', () => {
  it('rejects request without Authorization header', () => {
    const req = { headers: {} } as AuthRequest;
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token manquant' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects request with malformed header', () => {
    const req = { headers: { authorization: 'Basic token' } } as unknown as AuthRequest;
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token manquant' });
  });

  it('rejects invalid token', () => {
    const req = { headers: { authorization: 'Bearer invalid-token' } } as unknown as AuthRequest;
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token invalide ou expiré' });
  });

  it('accepts valid token and sets user data', () => {
    const payload = {
      sub: '1',
      role: 'authenticated' as const,
      aud: 'authenticated' as const,
      club_id: 1,
      user_role: 'coach' as const,
      email: 'test@test.com',
    };
    const token = jwt.sign(payload, config.jwtSecret);

    const req = { headers: { authorization: `Bearer ${token}` } } as unknown as AuthRequest;
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe(1);
    expect(req.userEmail).toBe('test@test.com');
    expect(req.userRole).toBe('coach');
    expect(req.clubId).toBe(1);
  });
});

describe('requireRole', () => {
  it('allows access when user has required role', () => {
    const req = { userRole: 'coach' } as AuthRequest;
    const res = mockRes();
    const next = jest.fn();

    const middleware = requireRole('coach');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('allows access when user has one of the required roles', () => {
    const req = { userRole: 'coach' } as AuthRequest;
    const res = mockRes();
    const next = jest.fn();

    const middleware = requireRole('swimmer', 'coach');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('allows admin role to access coach-guarded routes', () => {
    const req = { userRole: 'admin' } as AuthRequest;
    const res = mockRes();
    const next = jest.fn();

    const middleware = requireRole('coach', 'admin');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('denies access when user does not have required role', () => {
    const req = { userRole: 'swimmer' } as AuthRequest;
    const res = mockRes();
    const next = jest.fn();

    const middleware = requireRole('coach');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Accès refusé : droits insuffisants' });
    expect(next).not.toHaveBeenCalled();
  });

  it('denies access when user has no role', () => {
    const req = {} as AuthRequest;
    const res = mockRes();
    const next = jest.fn();

    const middleware = requireRole('coach');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
