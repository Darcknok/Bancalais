import { Router, Request, Response } from 'express';
import { supabase } from '../supabase';
import { config } from '../config';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// ─── POST /api/feedback — Save or update feedback ──────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      competition_id,
      event_id,
      type_tour,
      nage,
      date,
      nageur_iuf,
      ressenti,
      points_forts,
      ameliorer,
    } = req.body;

    if (!competition_id || !event_id || !nageur_iuf) {
      res.status(400).json({ error: 'competition_id, event_id et nageur_iuf sont requis' });
      return;
    }

    // Upsert: insert or update on conflict (competition_id, event_id, type_tour, nageur_iuf)
    const { data, error } = await supabase
      .from('race_feedback')
      .upsert({
        competition_id,
        event_id,
        type_tour: type_tour || '',
        nage: nage || '',
        date: date || '',
        nageur_iuf,
        ressenti: ressenti || '',
        points_forts: points_forts || '',
        ameliorer: ameliorer || '',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'competition_id, event_id, type_tour, nageur_iuf',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[feedback] upsert error:', error);
      res.status(500).json({ error: 'Erreur lors de la sauvegarde du feedback' });
      return;
    }

    res.json({ feedback: data });
  } catch (err) {
    console.error('[feedback] unexpected error:', err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ─── GET /api/feedback — Get feedback for a specific race+swimmer ──
router.get('/', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { competition_id, event_id, type_tour, nageur_iuf } = req.query;

    if (!competition_id || !event_id || !nageur_iuf) {
      res.status(400).json({ error: 'competition_id, event_id et nageur_iuf sont requis' });
      return;
    }

    if (Number(nageur_iuf) !== authReq.userId && authReq.userRole !== 'coach' && authReq.userRole !== 'admin') {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    const { data, error } = await supabase
      .from('race_feedback')
      .select('*')
      .eq('competition_id', Number(competition_id))
      .eq('event_id', Number(event_id))
      .eq('type_tour', String(type_tour || ''))
      .eq('nageur_iuf', Number(nageur_iuf))
      .maybeSingle();

    if (error) {
      console.error('[feedback] get error:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du feedback' });
      return;
    }

    res.json({ feedback: data ?? null });
  } catch (err) {
    console.error('[feedback] unexpected error:', err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ─── GET /api/feedback/swimmer/:nageur_iuf — Get all feedbacks for a swimmer ──
router.get('/swimmer/:nageur_iuf', async (req: Request, res: Response) => {
  try {
    const { nageur_iuf } = req.params;
    const { competition_id } = req.query;

    let query = supabase
      .from('race_feedback')
      .select('*')
      .eq('nageur_iuf', Number(nageur_iuf))
      .order('created_at', { ascending: false });

    if (competition_id) {
      query = query.eq('competition_id', Number(competition_id));
    }

    const { data, error } = await query;

    if (error) {
      console.error('[feedback] list error:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des feedbacks' });
      return;
    }

    res.json({ feedbacks: data ?? [] });
  } catch (err) {
    console.error('[feedback] unexpected error:', err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ─── DELETE /api/feedback — Delete a feedback ──
router.delete('/', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { competition_id, event_id, type_tour, nageur_iuf } = req.body;

    if (!competition_id || !event_id || !nageur_iuf) {
      res.status(400).json({ error: 'competition_id, event_id et nageur_iuf sont requis' });
      return;
    }

    if (Number(nageur_iuf) !== authReq.userId && authReq.userRole !== 'coach' && authReq.userRole !== 'admin') {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    const { error } = await supabase
      .from('race_feedback')
      .delete()
      .eq('competition_id', Number(competition_id))
      .eq('event_id', Number(event_id))
      .eq('type_tour', String(type_tour || ''))
      .eq('nageur_iuf', Number(nageur_iuf));

    if (error) {
      console.error('[feedback] delete error:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression du feedback' });
      return;
    }

    res.json({ deleted: true });
  } catch (err) {
    console.error('[feedback] unexpected error:', err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;
