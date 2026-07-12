import { Router } from 'express';
import { supabase } from '../supabase';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// GET /api/notifications — list notifications for the current user
router.get('/', async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId!;
    const userRole = authReq.userRole;
    const userClubId = authReq.clubId;

    // Notifications visibles : system-wide (club_id IS NULL) OU du club de l'utilisateur
    // ET target_role est NULL ou correspond au rôle de l'utilisateur
    const { data, error } = await supabase
      .rpc('get_notifications_for_user', {
        p_user_id: userId,
        p_user_role: userRole,
        p_user_club_id: userClubId,
      });

    if (error) {
      // Fallback: query directe si la RPC n'existe pas
      const { data: notifs, error: queryError } = await supabase
        .from('notifications')
        .select('*')
        .or(`club_id.is.null,club_id.eq.${userClubId ?? 0}`)
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      const filtered = (notifs ?? []).filter(n => !n.target_role || n.target_role === userRole);
      res.json({ notifications: filtered });
      return;
    }

    res.json({ notifications: data ?? [] });
  } catch (err) {
    console.error('Notifications list error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/notifications/read — mark one notification as read
router.post('/read', async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId!;
    const { id } = req.body as { id: number };

    if (!id) {
      res.status(400).json({ error: 'ID requis' });
      return;
    }

    const { data: notif } = await supabase
      .from('notifications')
      .select('read_by')
      .eq('id', id)
      .single();

    if (!notif) {
      res.status(404).json({ error: 'Notification introuvable' });
      return;
    }

    const readBy: number[] = notif.read_by ?? [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read_by: readBy })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Notification read error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/notifications/read-all — mark all as read
router.post('/read-all', async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId!;
    const userRole = authReq.userRole;
    const userClubId = authReq.clubId;

    const { data: notifs } = await supabase
      .from('notifications')
      .select('id, read_by, target_role')
      .or(`club_id.is.null,club_id.eq.${userClubId ?? 0}`);

    const filtered = (notifs ?? []).filter(n => !n.target_role || n.target_role === userRole);

    if (!filtered || filtered.length === 0) {
      res.json({ success: true });
      return;
    }

    const updates = filtered.map(n => {
      const readBy: number[] = n.read_by ?? [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
      }
      return supabase
        .from('notifications')
        .update({ read_by: readBy })
        .eq('id', n.id);
    });

    await Promise.all(updates);
    res.json({ success: true });
  } catch (err) {
    console.error('Notification read-all error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/notifications/unread-count — unread count for badge
router.get('/unread-count', async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId!;
    const userRole = authReq.userRole;
    const userClubId = authReq.clubId;

    const { data: notifs } = await supabase
      .from('notifications')
      .select('read_by, target_role')
      .or(`club_id.is.null,club_id.eq.${userClubId ?? 0}`);

    const filtered = (notifs ?? []).filter(n => !n.target_role || n.target_role === userRole);

    if (!filtered) {
      res.json({ count: 0 });
      return;
    }

    const count = filtered.filter(n => !((n.read_by ?? []) as number[]).includes(userId)).length;
    res.json({ count });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/notifications — create a notification (coach or system)
router.post('/', async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId!;
    const userRole = authReq.userRole;
    const userClubId = authReq.clubId;

    const { type, title, body, club_id, target_role, link } = req.body as {
      type: 'coach' | 'system' | 'reminder';
      title: string;
      body: string;
      club_id?: number | null;
      target_role?: string | null;
      link?: string | null;
    };

    if (!title || !body || !type) {
      res.status(400).json({ error: 'type, title et body sont requis' });
      return;
    }

    if (!['coach', 'system', 'reminder'].includes(type)) {
      res.status(400).json({ error: 'Type invalide' });
      return;
    }

    // Seuls les coachs peuvent créer des notifications de coach/rappel pour leur club
    // Seuls les devs (n'importe qui pour l'instant) peuvent créer des notifications système
    if (type === 'coach' || type === 'reminder') {
      if (userRole !== 'coach') {
        res.status(403).json({ error: 'Seuls les entraîneurs peuvent créer ce type de notification' });
        return;
      }
    }

    const insertData: Record<string, unknown> = {
      type,
      title,
      body,
      sender_id: userId,
      club_id: club_id ?? userClubId ?? null,
      target_role: target_role ?? null,
      link: link ?? null,
    };

    const { data: notif, error } = await supabase
      .from('notifications')
      .insert(insertData)
      .select()
      .single();

    if (error || !notif) {
      console.error('Create notification error:', error);
      res.status(500).json({ error: 'Erreur lors de la création' });
      return;
    }

    res.status(201).json({ notification: notif });
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/notifications/:id — delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId!;
    const userRole = authReq.userRole;
    const { id } = req.params;

    const { data: notif } = await supabase
      .from('notifications')
      .select('sender_id')
      .eq('id', id)
      .single();

    if (!notif) {
      res.status(404).json({ error: 'Notification introuvable' });
      return;
    }

    // Seul le créateur ou un coach peut supprimer
    if (notif.sender_id !== userId && userRole !== 'coach' && userRole !== 'admin') {
      res.status(403).json({ error: 'Non autorisé' });
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Notification delete error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
