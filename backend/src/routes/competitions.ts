import { Router } from 'express';
import { supabase } from '../supabase';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// GET /api/competitions
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('competitions')
      .select('*, competition_epreuves(*)')
      .order('date', { ascending: true });

    if (error) throw error;

    const competitions = (data ?? []).map((c: any) => ({
      ...c,
      epreuves: c.competition_epreuves ?? [],
      competition_epreuves: undefined,
    }));

    res.json({ competitions });
  } catch (err) {
    console.error('Competitions list error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/competitions/:id — comp + epreuves + user's inscriptions
router.get('/:id', async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    const { id } = req.params;

    const { data: comp, error: compErr } = await supabase
      .from('competitions')
      .select('*')
      .eq('id', id)
      .single();

    if (compErr || !comp) {
      res.status(404).json({ error: 'Compétition introuvable' });
      return;
    }

    const { data: epreuves, error: epErr } = await supabase
      .from('competition_epreuves')
      .select('*')
      .eq('competition_id', id)
      .order('ordre', { ascending: true });

    if (epErr) throw epErr;

    // Récupérer les inscriptions du user connecté pour ces épreuves
    let inscriptions: Record<number, { temps_engagement: string | null; nouveau_temps: string | null }> = {};
    if (userId && epreuves && epreuves.length > 0) {
      const epreuveIds = epreuves.map(e => e.id);
      const { data: ins } = await supabase
        .from('competition_inscriptions')
        .select('*')
        .in('epreuve_id', epreuveIds)
        .eq('swimmer_id', userId);

      if (ins) {
        for (const i of ins) {
          inscriptions[i.epreuve_id] = {
            temps_engagement: i.temps_engagement,
            nouveau_temps: i.nouveau_temps,
          };
        }
      }
    }

    res.json({
      competition: {
        ...comp,
        epreuves: (epreuves ?? []).map(e => ({
          ...e,
          inscription: inscriptions[e.id] ?? null,
        })),
      },
    });
  } catch (err) {
    console.error('Competition get error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/competitions/:id/inscrire — s'inscrire à une épreuve
router.post('/:id/inscrire', async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId!;
    const competitionId = parseInt(req.params.id, 10);
    const { epreuve_id, temps_engagement } = req.body as { epreuve_id: number; temps_engagement?: string };

    if (!epreuve_id) {
      res.status(400).json({ error: 'epreuve_id requis' });
      return;
    }

    const { data: epreuve, error: epErr } = await supabase
      .from('competition_epreuves')
      .select('id')
      .eq('id', epreuve_id)
      .eq('competition_id', competitionId)
      .maybeSingle();

    if (epErr) throw epErr;
    if (!epreuve) {
      res.status(404).json({ error: 'Épreuve introuvable pour cette compétition' });
      return;
    }

    const { data: existing } = await supabase
      .from('competition_inscriptions')
      .select('*')
      .eq('epreuve_id', epreuve_id)
      .eq('swimmer_id', userId)
      .maybeSingle();

    if (existing) {
      res.status(409).json({ error: 'Déjà inscrit à cette épreuve' });
      return;
    }

    const { data: inscription, error } = await supabase
      .from('competition_inscriptions')
      .insert({
        epreuve_id,
        swimmer_id: userId,
        temps_engagement: temps_engagement ?? null,
      })
      .select()
      .single();

    if (error || !inscription) {
      console.error('Inscription error:', error);
      res.status(500).json({ error: "Erreur lors de l'inscription" });
      return;
    }

    res.status(201).json({ inscription });
  } catch (err) {
    console.error('Inscription error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/competitions/desinscrire — se désinscrire d'une épreuve
router.delete('/desinscrire', async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId!;
    const { epreuve_id } = req.body as { epreuve_id: number };

    if (!epreuve_id) {
      res.status(400).json({ error: 'epreuve_id requis' });
      return;
    }

    const { error } = await supabase
      .from('competition_inscriptions')
      .delete()
      .eq('epreuve_id', epreuve_id)
      .eq('swimmer_id', userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Desinscription error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
