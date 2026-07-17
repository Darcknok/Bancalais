import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { supabase } from '../supabase';
import { authMiddleware, requireRole, type AuthRequest } from '../middleware/auth';
import { config } from '../config';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('coach', 'admin'));

// GET /api/admin/users — list all users (safe, no password)
// Les coaches ne voient que les utilisateurs de leur club
router.get('/users', async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    let query = supabase
      .from('profiles')
      .select('id, email, prenom, nom, role, avatar, club_id, referral_code_used, joined_at, message_notifications, announcement_notifications, event_notifications, mention_notifications, invite_notifications, reminder_delay')
      .order('id');

    if (authReq.userRole === 'coach' && authReq.clubId) {
      query = query.eq('club_id', authReq.clubId);
    }

    const { data: users, error } = await query;

    if (error) throw error;
    res.json({ users });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/users/:id — single user details
router.get('/users/:id', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email, prenom, nom, role, avatar, club_id, referral_code_used, joined_at, message_notifications, announcement_notifications, event_notifications, mention_notifications, invite_notifications, reminder_delay')
      .eq('id', parseInt(String(req.params.id), 10))
      .maybeSingle();

    if (error) throw error;
    if (!user) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }

    res.json({ user });
  } catch (err) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/admin/users/:id — update any user
router.patch('/users/:id', async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const targetId = parseInt(String(req.params.id), 10);

    if (authReq.userRole === 'coach') {
      const { data: targetUser, error: fetchErr } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', targetId)
        .maybeSingle();
      if (fetchErr || !targetUser) {
        res.status(404).json({ error: 'Utilisateur introuvable' });
        return;
      }
      if (targetUser.club_id !== authReq.clubId) {
        res.status(403).json({ error: 'Accès refusé : cet utilisateur n\'appartient pas à votre club' });
        return;
      }
    }

    const allowedFields = [
      'prenom', 'nom', 'email', 'role', 'avatar',
      'club_id', 'referral_code_used',
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

    if (updates.role !== undefined) {
      const validRoles = ['swimmer', 'coach', 'admin'];
      if (!validRoles.includes(updates.role as string)) {
        res.status(400).json({ error: 'Rôle invalide' });
        return;
      }
      const authReq = req as AuthRequest;
      if (authReq.userRole !== 'admin' && updates.role === 'admin') {
        res.status(403).json({ error: 'Seul un administrateur peut attribuer le rôle admin' });
        return;
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'Aucun champ à mettre à jour' });
      return;
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', targetId)
      .select('id, email, prenom, nom, role, avatar, club_id, referral_code_used, joined_at, message_notifications, announcement_notifications, event_notifications, mention_notifications, invite_notifications, reminder_delay')
      .single();

    if (error || !updated) {
      console.error('Admin update user error:', error);
      res.status(500).json({ error: error?.message ?? 'Erreur lors de la mise à jour' });
      return;
    }

    res.json({ user: updated });
  } catch (err) {
    console.error('Admin patch user error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/clubs — list all clubs
router.get('/clubs', async (_req, res) => {
  try {
    const { data: clubs, error } = await supabase
      .from('clubs')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json({ clubs });
  } catch (err) {
    console.error('Admin clubs error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/clubs — create a club
router.post('/clubs', async (req, res) => {
  try {
    const { name, city, referral_code, logo_url } = req.body as {
      name?: string;
      city?: string;
      referral_code?: string;
      logo_url?: string | null;
    };

    if (!name || !city || !referral_code) {
      res.status(400).json({ error: 'name, city et referral_code sont requis' });
      return;
    }

    const { data: club, error } = await supabase
      .from('clubs')
      .insert({ name, city, referral_code: referral_code.toUpperCase(), logo_url: logo_url ?? null })
      .select()
      .single();

    if (error || !club) {
      console.error('Admin create club error:', error);
      res.status(500).json({ error: 'Erreur lors de la création du club' });
      return;
    }

    res.status(201).json({ club });
  } catch (err) {
    console.error('Admin create club error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/admin/clubs/:id — update a club
router.patch('/clubs/:id', async (req, res) => {
  try {
    const allowedFields = ['name', 'city', 'referral_code', 'logo_url', 'referral_active'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'referral_active') {
          updates[field] = Boolean(req.body[field]);
        } else {
          const val = String(req.body[field]);
          updates[field] = field === 'referral_code' ? val.toUpperCase() : val;
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'Aucun champ à mettre à jour' });
      return;
    }

    const { data: club, error } = await supabase
      .from('clubs')
      .update(updates)
      .eq('id', parseInt(String(req.params.id), 10))
      .select()
      .single();

    if (error || !club) {
      console.error('Admin update club error:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du club' });
      return;
    }

    res.json({ club });
  } catch (err) {
    console.error('Admin patch club error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/clubs/:id/logo — upload club logo
router.post('/clubs/:id/logo', (req, res, next) => {
  upload.single('logo')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      const message = err instanceof multer.MulterError
        ? 'Fichier trop volumineux (max 10 Mo)'
        : (err.message || 'Erreur lors du téléchargement');
      res.status(400).json({ error: message });
      return;
    }
    next();
  });
}, async (req, res) => {
  try {
    const clubId = parseInt(String(req.params.id), 10);
    if (!req.file) {
      res.status(400).json({ error: 'Aucun fichier fourni' });
      return;
    }

    const logoUrl = `/uploads/clubs/${req.file.filename}`;

    const { data: club, error } = await supabase
      .from('clubs')
      .update({ logo_url: logoUrl })
      .eq('id', clubId)
      .select()
      .single();

    if (error || !club) {
      console.error('Admin upload logo error:', error);
      res.status(500).json({ error: 'Erreur lors de l\'enregistrement du logo' });
      return;
    }

    res.json({ club });
  } catch (err) {
    console.error('Admin upload logo error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/pbs/:user_id — list PBs for a user
router.get('/pbs/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const swimmerId = Number(user_id);
    const { data, error } = await supabase
      .from('pbs')
      .select('*')
      .eq('swimmer_id', swimmerId)
      .order('nage');

    if (error) throw error;
    res.json({ pbs: data ?? [] });
  } catch (err) {
    console.error('Admin pbs error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/pbs/:user_id — create or update a PB
router.post('/pbs/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { nage, type_nage, temps } = req.body as { nage: string; type_nage: string; temps: string };

    if (!nage || !type_nage || !temps) {
      res.status(400).json({ error: 'nage, type_nage et temps requis' });
      return;
    }

    if (!['crawl', 'dos', 'brass', 'pap'].includes(type_nage)) {
      res.status(400).json({ error: 'type_nage invalide' });
      return;
    }

    const { data: existing } = await supabase
      .from('pbs')
      .select('id')
      .eq('swimmer_id', Number(user_id))
      .eq('nage', nage)
      .maybeSingle();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('pbs')
        .update({ temps, type_nage, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('pbs')
        .insert({ swimmer_id: Number(user_id), nage, type_nage, temps })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    res.json({ pb: result });
  } catch (err) {
    console.error('Admin pb upsert error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/admin/pbs/:pb_id — update a PB by ID
router.patch('/pbs/:pb_id', async (req, res) => {
  try {
    const { pb_id } = req.params;
    const { nage, type_nage, temps } = req.body as { nage?: string; type_nage?: string; temps?: string };

    const updates: Record<string, unknown> = {};
    if (nage !== undefined) updates.nage = nage;
    if (temps !== undefined) updates.temps = temps;
    if (type_nage !== undefined) {
      if (!['crawl', 'dos', 'brass', 'pap'].includes(type_nage)) {
        res.status(400).json({ error: 'type_nage invalide' });
        return;
      }
      updates.type_nage = type_nage;
    }
    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length <= 1) {
      res.status(400).json({ error: 'Aucun champ à mettre à jour' });
      return;
    }

    const { data, error } = await supabase
      .from('pbs')
      .update(updates)
      .eq('id', pb_id)
      .select()
      .single();

    if (error || !data) {
      console.error('Admin pb update error:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du PB' });
      return;
    }

    res.json({ pb: data });
  } catch (err) {
    console.error('Admin pb patch error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/admin/pbs/:pb_id — delete a PB
router.delete('/pbs/:pb_id', async (req, res) => {
  try {
    const { pb_id } = req.params;
    const { error } = await supabase
      .from('pbs')
      .delete()
      .eq('id', pb_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Admin pb delete error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── Admin Competition CRUD ─────────────────────────────────────

// POST /api/admin/competitions — create a competition
router.post('/competitions', async (req, res) => {
  try {
    const { lieu, date, ouverture_portes, debut_epreuves, engagements, pause, remise_recompenses } = req.body;
    if (!lieu || !date) { res.status(400).json({ error: 'lieu et date requis' }); return; }

    const { data, error } = await supabase
      .from('competitions')
      .insert({ lieu, date, ouverture_portes, debut_epreuves, engagements, pause, remise_recompenses })
      .select()
      .single();

    if (error || !data) { console.error('Create comp error:', error); res.status(500).json({ error: error?.message ?? 'Erreur création' }); return; }
    res.status(201).json({ competition: data });
  } catch (err) { console.error('Admin create comp error:', err); res.status(500).json({ error: 'Erreur serveur' }); }
});

// PATCH /api/admin/competitions/:id — update a competition
router.patch('/competitions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['lieu', 'date', 'ouverture_portes', 'debut_epreuves', 'engagements', 'pause', 'remise_recompenses'];
    const updates: Record<string, unknown> = {};
    for (const f of allowed) { if (req.body[f] !== undefined) updates[f] = req.body[f]; }
    if (Object.keys(updates).length === 0) { res.status(400).json({ error: 'Aucun champ' }); return; }

    const { data, error } = await supabase
      .from('competitions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) { console.error('Update comp error:', error); res.status(500).json({ error: error?.message ?? 'Erreur mise à jour' }); return; }
    res.json({ competition: data });
  } catch (err) { console.error('Admin update comp error:', err); res.status(500).json({ error: 'Erreur serveur' }); }
});

// DELETE /api/admin/competitions/:id — delete a competition + epreuves + inscriptions
router.delete('/competitions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const epreuveIds = (await supabase.from('competition_epreuves').select('id').eq('competition_id', id)).data?.map(e => e.id) ?? [];
    if (epreuveIds.length > 0) await supabase.from('competition_inscriptions').delete().in('epreuve_id', epreuveIds);
    await supabase.from('competition_epreuves').delete().eq('competition_id', id);
    const { error } = await supabase.from('competitions').delete().eq('id', id);

    if (error) { console.error('Delete comp error:', error); res.status(500).json({ error: 'Erreur suppression' }); return; }
    res.json({ success: true });
  } catch (err) { console.error('Admin delete comp error:', err); res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/admin/competitions/:id/epreuves — add epreuve
router.post('/competitions/:id/epreuves', async (req, res) => {
  try {
    const competition_id = parseInt(req.params.id, 10);
    const { heure, nage, type_nage, ordre } = req.body;
    if (!nage || !type_nage || ordre === undefined) { res.status(400).json({ error: 'nage, type_nage, ordre requis' }); return; }
    if (!['crawl', 'dos', 'brass', 'pap'].includes(type_nage)) { res.status(400).json({ error: 'type_nage invalide' }); return; }

    const { data, error } = await supabase
      .from('competition_epreuves')
      .insert({ competition_id, heure, nage, type_nage, ordre })
      .select()
      .single();

    if (error || !data) { console.error('Create epreuve error:', error); res.status(500).json({ error: error?.message ?? 'Erreur création' }); return; }
    res.status(201).json({ epreuve: data });
  } catch (err) { console.error('Admin create epreuve error:', err); res.status(500).json({ error: 'Erreur serveur' }); }
});

// PATCH /api/admin/competitions/epreuves/:id — update epreuve
router.patch('/competitions/epreuves/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['heure', 'nage', 'type_nage', 'ordre'];
    const updates: Record<string, unknown> = {};
    for (const f of allowed) { if (req.body[f] !== undefined) updates[f] = req.body[f]; }
    if (Object.keys(updates).length === 0) { res.status(400).json({ error: 'Aucun champ' }); return; }
    if (updates.type_nage && !['crawl', 'dos', 'brass', 'pap'].includes(updates.type_nage as string)) {
      res.status(400).json({ error: 'type_nage invalide' }); return;
    }

    const { data, error } = await supabase
      .from('competition_epreuves')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) { console.error('Update epreuve error:', error); res.status(500).json({ error: error?.message ?? 'Erreur mise à jour' }); return; }
    res.json({ epreuve: data });
  } catch (err) { console.error('Admin update epreuve error:', err); res.status(500).json({ error: 'Erreur serveur' }); }
});

// DELETE /api/admin/competitions/epreuves/:id — delete epreuve + its inscriptions
router.delete('/competitions/epreuves/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('competition_inscriptions').delete().eq('epreuve_id', id);
    const { error } = await supabase.from('competition_epreuves').delete().eq('id', id);
    if (error) { console.error('Delete epreuve error:', error); res.status(500).json({ error: 'Erreur suppression' }); return; }
    res.json({ success: true });
  } catch (err) { console.error('Admin delete epreuve error:', err); res.status(500).json({ error: 'Erreur serveur' }); }
});

// GET /api/admin/competitions/:id/inscriptions — list all inscriptions with swimmer info
router.get('/competitions/:id/inscriptions', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: epreuves, error: epErr } = await supabase
      .from('competition_epreuves')
      .select('id, nage, type_nage')
      .eq('competition_id', id);
    if (epErr) throw epErr;
    if (!epreuves) { res.json({ inscriptions: [] }); return; }

    const epreuveIds = epreuves.map(e => e.id);
    const { data: inscriptions, error: insErr } = await supabase
      .from('competition_inscriptions')
      .select('*, profiles!inner(id, prenom, nom, email, club_id)')
      .in('epreuve_id', epreuveIds);
    if (insErr) throw insErr;

    const byEpreuve: Record<number, any[]> = {};
    for (const ins of inscriptions ?? []) {
      if (!byEpreuve[ins.epreuve_id]) byEpreuve[ins.epreuve_id] = [];
      byEpreuve[ins.epreuve_id].push({
        id: ins.id,
        swimmer: ins.profiles,
        temps_engagement: ins.temps_engagement,
        nouveau_temps: ins.nouveau_temps,
        created_at: ins.created_at,
      });
    }

    const result = epreuves.map(e => ({
      epreuve_id: e.id,
      nage: e.nage,
      type_nage: e.type_nage,
      inscriptions: byEpreuve[e.id] ?? [],
    }));

    res.json({ inscriptions: result });
  } catch (err) { console.error('Admin inscriptions error:', err); res.status(500).json({ error: 'Erreur serveur' }); }
});

export default router;
