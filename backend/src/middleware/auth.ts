/**
 * Middlewares d'authentification JWT.
 * Vérifie les tokens, extrait les infos utilisateur, et contrôle les accès par rôle.
 */
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { JwtPayload } from '../types';

// Extension du type Request d'Express pour attacher les infos utilisateur extraites du JWT
export type AuthRequest = Request & {
  userId?: number;
  userEmail?: string;
  userRole?: string;
  clubId?: number | null;
};

/**
 * authMiddleware — Vérifie la validité du token JWT Bearer.
 * Extrait userId, userEmail, userRole et clubId et les attache à la requête.
 * Retourne 401 si le token est absent, invalide ou expiré.
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token manquant' });
    return;
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as JwtPayload;
    if ((decoded as Record<string, unknown>).type === 'refresh') {
      res.status(401).json({ error: 'Token refresh non autorisé pour l\'accès API' });
      return;
    }
    const parsedId = parseInt(decoded.sub, 10);
    if (isNaN(parsedId)) {
      res.status(401).json({ error: 'Token invalide' });
      return;
    }
    req.userId = parsedId;
    req.userEmail = decoded.email;
    req.userRole = decoded.user_role;
    req.clubId = decoded.club_id;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

/**
 * requireRole — Contrôle d'accès basé sur le rôle.
 * Utilisation : router.get('/admin', authMiddleware, requireRole('admin', 'coach'), handler)
 * Retourne 403 si le rôle de l'utilisateur n'est pas dans la liste autorisée.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ error: 'Accès refusé : droits insuffisants' });
      return;
    }
    next();
  };
}
