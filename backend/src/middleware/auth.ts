import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { JwtPayload } from '../types';

export type AuthRequest = Request & {
  userId?: number;
  userEmail?: string;
  userRole?: string;
  clubId?: number | null;
};

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token manquant' });
    return;
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.userId = parseInt(decoded.sub, 10);
    req.userEmail = decoded.email;
    req.userRole = decoded.user_role;
    req.clubId = decoded.club_id;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ error: 'Accès refusé : droits insuffisants' });
      return;
    }
    next();
  };
}
