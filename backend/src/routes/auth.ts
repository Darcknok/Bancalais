/**
 * Routes d'authentification.
 * Gère l'inscription (avec code de parrainage club), la connexion,
 * la récupération du profil, la mise à jour du profil, les PBs,
 * et la consultation des clubs.
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { supabase } from '../supabase';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import type { RegisterBody, LoginBody, Profile, SafeProfile } from '../types';

const router = Router();

// --- Fonctions utilitaires internes ---

/** Retourne une copie du profil sans le hash du mot de passe (jamais exposé au client) */
function toSafeProfile(p: Profile): SafeProfile {
  const { hashed_password: _, ...safe } = p;
  return safe;
}

/** Signe un JWT contenant les informations essentielles du profil (durée : 30 jours) */
function signToken(profile: Profile): string {
  const payload = {
    sub: String(profile.id),
    role: 'authenticated' as const,
    aud: 'authenticated' as const,
    club_id: profile.club_id,
    user_role: profile.role,
    email: profile.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  };
  return jwt.sign(payload, config.jwtSecret);
}

// --- Route : Inscription ---
// POST /api/auth/register — Crée un compte et rattache optionnellement à un club via code de parrainage
router.post('/register', async (req, res) => {
  try {
    const body = req.body as RegisterBody;

    if (!body.email || !body.password || !body.prenom || !body.nom || !body.role) {
      res.status(400).json({ error: 'Champs requis manquants' });
      return;
    }

    if (body.password.length < 4) {
      res.status(400).json({ error: 'Le mot de passe doit faire au moins 4 caractères' });
      return;
    }

    if (!['swimmer', 'coach', 'admin'].includes(body.role)) {
      res.status(400).json({ error: 'Rôle invalide' });
      return;
    }

    let clubId: number | null = null;
    let usedCode: string | null = null;

    if (body.referral_code) {
      const code = body.referral_code.toUpperCase();
      const { data: club } = await supabase
        .from('clubs')
        .select('id, referral_active')
        .eq('referral_code', code)
        .maybeSingle();

      if (!club) {
        res.status(400).json({ error: 'Ce code de parrainage n\'existe pas' });
        return;
      }
      if (club.referral_active === false) {
        res.status(403).json({ error: 'Ce code de parrainage est suspendu' });
        return;
      }
      clubId = club.id;
      usedCode = code;
    }

    const hashed = await bcrypt.hash(body.password, 10);

    const { data: createdJson, error: rpcError } = await supabase.rpc('create_profile', {
      p_email: body.email,
      p_hashed_password: hashed,
      p_prenom: body.prenom,
      p_nom: body.nom,
      p_role: body.role,
      p_club_id: clubId,
      p_referral_code_used: usedCode,
    });

    if (rpcError || !createdJson) {
      console.error('RPC error:', rpcError);
      const msg = rpcError?.message?.includes('Email déjà utilisé')
        ? 'Cet email est déjà utilisé'
        : 'Erreur lors de la création du compte';
      res.status(rpcError?.message?.includes('Email déjà utilisé') ? 409 : 500).json({ error: msg });
      return;
    }

    const created = createdJson as unknown as Profile;
    const token = signToken(created);
    res.status(201).json({ token, user: toSafeProfile(created) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- Route : Connexion ---
// POST /api/auth/login — Authentifie l'utilisateur et retourne un JWT
router.post('/login', async (req, res) => {
  try {
    const body = req.body as LoginBody;

    if (!body.email || !body.password) {
      res.status(400).json({ error: 'Email et mot de passe requis' });
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', body.email)
      .maybeSingle();

    if (!profile) {
      res.status(401).json({ error: 'Aucun compte trouvé avec cet email' });
      return;
    }

    const valid = await bcrypt.compare(body.password, profile.hashed_password);
    if (!valid) {
      res.status(401).json({ error: 'Mot de passe incorrect' });
      return;
    }

    const token = signToken(profile);
    res.json({ token, user: toSafeProfile(profile) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- Route : Profil utilisateur ---
// GET /api/auth/me — Récupère le profil complet de l'utilisateur connecté (auth requis)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authReq.userId)
      .maybeSingle();

    if (!profile) {
      res.status(404).json({ error: 'Utilisateur introuvable' });
      return;
    }

    res.json({ user: toSafeProfile(profile) });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- Route : Mise à jour du profil ---
// PATCH /api/auth/met — Met à jour les champs autorisés du profil (auth requis)
router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const allowedFields = [
      'prenom', 'nom', 'bio', 'avatar',
      'message_notifications', 'announcement_notifications',
      'event_notifications', 'mention_notifications', 'invite_notifications',
      'reminder_delay',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.body.club_id !== undefined) {
      updates.club_id = req.body.club_id;
    }
    if (req.body.referral_code_used !== undefined) {
      updates.referral_code_used = req.body.referral_code_used;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'Aucun champ à mettre à jour' });
      return;
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', authReq.userId)
      .select()
      .single();

    if (error || !updated) {
      console.error('Update error:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour' });
      return;
    }

    res.json({ user: toSafeProfile(updated) });
  } catch (err) {
    console.error('Patch me error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- Route : Records personnels ---
// GET /api/auth/pbs — Liste les records du nageur connecté, triés par épreuve (auth requis)
router.get('/pbs', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { data, error } = await supabase
      .from('pbs')
      .select('*')
      .eq('swimmer_id', authReq.userId)
      .order('nage');

    if (error) throw error;
    res.json({ pbs: data ?? [] });
  } catch (err) {
    console.error('Pbs error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- Route : Liste des clubs ---
// GET /api/auth/clubs — Retourne tous les clubs (accès public, pour l'écran d'inscription)
router.get('/clubs', async (_req, res) => {
  try {
    const { data: clubs } = await supabase
      .from('clubs')
      .select('*')
      .order('name');

    res.json({ clubs });
  } catch (err) {
    console.error('Clubs error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- Route : Recherche de club par code ---
// GET /api/auth/club/:code — Vérifie un code de parrainage et retourne le club associé
router.get('/club/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const { data: club } = await supabase
      .from('clubs')
      .select('*')
      .eq('referral_code', code)
      .maybeSingle();

    if (!club) {
      res.status(404).json({ error: 'Code de parrainage invalide' });
      return;
    }

    if (club.referral_active === false) {
      res.status(403).json({ error: 'Ce code de parrainage est suspendu' });
      return;
    }

    res.json({ club });
  } catch (err) {
    console.error('Club lookup error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
