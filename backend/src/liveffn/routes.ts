/**
 * Routes API pour le module LiveFFN.
 * Fournit des endpoints cache pour les données de compétitions, programmes,
 * résultats, participants, nageurs et clubs récupérées depuis liveffn.com
 * (plateforme FFN — Fédération Française de Natation).
 */
import { Router, type Request, type Response } from 'express';
import {
  fetchCompetitionList,
  fetchCompetitionPage,
  fetchProgram,
  fetchEventResults,
  fetchStartList,
  fetchStartListParticipants,
  fetchSwimmerDetails,
  fetchClubDetails,
  fetchLiveData,
} from './fetcher';

import {
  parseCompetitionList,
  parseCompetitionDetail,
  parseProgram,
  parseEventResults,
  parseStartList,
  parseParticipants,
  parseSwimmerResults,
  parseClubDetails,
} from './parser';

import { cachedFetch, getCacheStats, invalidateAllCache } from './cache';
import {
  getCompetitionListFromDB,
  saveCompetitionListToDB,
  getCompetitionFromDB,
  saveCompetitionToDB,
  saveEventToDB,
  getEventResultsFromDB,
  saveResultsToDB,
  ensureCompetitionExists,
} from './persistence';
import { authMiddleware, requireRole } from '../middleware/auth';
import type { CacheKey } from './types';

export const liveffnRouter = Router();

// --- Fonction utilitaire : gestion centralisée des erreurs LiveFFN ---
// Retourne un 502 (Bad Gateway) car les erreurs viennent du scraping externe
function handleError(res: Response, error: unknown, context: string) {
  console.error(`LiveFFN ${context} error:`, error);
  res.status(502).json({ error: 'Erreur lors de la récupération des données LiveFFN', context });
}

// --- Endpoints API LiveFFN ---
// Stratégie de cache : DB d'abord, puis scraping + persist, puis cache mémoire

/**
 * GET /api/liveffn/competitions — Liste des compétitions.
 * Paramètres de requête :
 *   - page : "courantes" (par défaut) | "recemment_termine"
 */
liveffnRouter.get('/competitions', async (req: Request, res: Response) => {
  try {
    const page = String(req.query.page ?? '') === 'recemment_termine' ? 'recemment_termine' : 'courantes';
    const cacheKey: CacheKey = `competition_list`;

    // Priorité 1 : données en base (rapide, pas de scraping)
    const dbList = await getCompetitionListFromDB(page);
    if (dbList) {
      res.json({ competitions: dbList, count: dbList.length, page });
      return;
    }

    // Priorité 2 : scraping liveffn.com + persistance en base + cache mémoire
    const competitions = await cachedFetch(cacheKey, async () => {
      const html = await fetchCompetitionList(page);
      return parseCompetitionList(html);
    }, undefined, async (data) => {
      await saveCompetitionListToDB(page, data);
    });

    res.json({ competitions, count: competitions.length, page });
  } catch (err) {
    handleError(res, err, 'competitions');
  }
});

/**
 * GET /api/liveffn/competitions/:id — Détail d'une compétition.
 * Retourne les informations complètes (dates, lieu, organisateur, etc.)
 */
liveffnRouter.get('/competitions/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id) || id < 0 || id > 10000000) {
      res.status(400).json({ error: 'ID de compétition invalide' });
      return;
    }

    const cacheKey: CacheKey = `competition_${id}`;

    // Priorité 1 : données en base
    const dbCompetition = await getCompetitionFromDB(id);
    if (dbCompetition) {
      res.json({ competition: dbCompetition });
      return;
    }

    // Priorité 2 : scraping + persistance
    const competition = await cachedFetch(cacheKey, async () => {
      const html = await fetchCompetitionPage(id);
      return parseCompetitionDetail(html, id);
    }, undefined, async (data) => {
      await saveCompetitionToDB(data);
    });

    res.json({ competition });
  } catch (err) {
    handleError(res, err, `competition/${req.params.id}`);
  }
});

/**
 * GET /api/liveffn/competitions/:id/program — Programme de la compétition.
 * Retourne les sessions et épreuves (par séries, distances, styles, etc.)
 */
liveffnRouter.get('/competitions/:id/program', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id) || id < 0 || id > 10000000) {
      res.status(400).json({ error: 'ID de compétition invalide' });
      return;
    }

    const cacheKey: CacheKey = `competition_${id}_program`;

    const sessions = await cachedFetch(cacheKey, async () => {
      const html = await fetchProgram(id);
      return parseProgram(html);
    }, undefined, async (data) => {
      await ensureCompetitionExists(id);
      for (const session of data) {
        for (const event of session.epreuves) {
          // Ignorer les épreuves sans ID valide (présence non ok, tooltip absent)
          if (event.id === 0 || event.id == null) continue;
          await saveEventToDB({
            ...event,
            competitionId: id,
            sessionDate: session.date,
            sessionNum: session.numero,
          });
        }
      }
    });

    res.json({ competitionId: id, sessions, count: sessions.length });
  } catch (err) {
    handleError(res, err, `competition/${req.params.id}/program`);
  }
});

/**
 * GET /api/liveffn/competitions/:id/events — Liste plate de toutes les épreuves.
 * Regroupe les épreuves de toutes les sessions en un seul tableau.
 * Filtrable par genre via le paramètre ?genre=F ou ?genre=M.
 */
liveffnRouter.get('/competitions/:id/events', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id) || id < 0 || id > 10000000) {
      res.status(400).json({ error: 'ID de compétition invalide' });
      return;
    }

    const cacheKey: CacheKey = `competition_${id}_program`;

    const sessions = await cachedFetch(cacheKey, async () => {
      const html = await fetchProgram(id);
      return parseProgram(html);
    }, undefined, async (data) => {
      await ensureCompetitionExists(id);
      for (const session of data) {
        for (const event of session.epreuves) {
          if (event.id === 0 || event.id == null) continue;
          await saveEventToDB({
            ...event,
            competitionId: id,
            sessionDate: session.date,
            sessionNum: session.numero,
          });
        }
      }
    });

    // Aplatir toutes les épreuves de toutes les sessions
    const events = sessions.flatMap(s =>
      s.epreuves.map(e => ({
        ...e,
        sessionDate: s.date,
        sessionNum: s.numero,
        ouverturePortes: s.ouverturePortes,
      }))
    );

    // Filtrage optionnel par genre (F = Féminin, M = Masculin)
    const genre = typeof req.query.genre === 'string' ? req.query.genre : undefined;
    const filtered = genre ? events.filter(e => e.genre === genre.toUpperCase()) : events;

    res.json({ competitionId: id, events: filtered, count: filtered.length });
  } catch (err) {
    handleError(res, err, `competition/${req.params.id}/events`);
  }
});

/**
 * GET /api/liveffn/competitions/:id/participants — Liste des participants inscrits.
 */
liveffnRouter.get('/competitions/:id/participants', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID de compétition invalide' });
      return;
    }

    const cacheKey: CacheKey = `competition_${id}_participants`;

    const participants = await cachedFetch(cacheKey, async () => {
      const html = await fetchStartListParticipants(id);
      return parseParticipants(html);
    });

    res.json({ competitionId: id, participants, count: participants.length });
  } catch (err) {
    handleError(res, err, `competition/${req.params.id}/participants`);
  }
});

/**
 * GET /api/liveffn/competitions/:id/results/:eventId — Résultats d'une épreuve.
 * Retourne les résultats par série et par tour (séries, demi-finales, finales).
 */
liveffnRouter.get('/competitions/:id/results/:eventId', async (req: Request, res: Response) => {
  try {
    const compId = parseInt(String(req.params.id), 10);
    const eventId = parseInt(String(req.params.eventId), 10);
    if (isNaN(compId) || compId < 0 || compId > 10000000 || isNaN(eventId) || eventId < 0 || eventId > 10000000) {
      res.status(400).json({ error: 'ID de compétition ou épreuve invalide' });
      return;
    }

    const cacheKey: CacheKey = `competition_${compId}_results_${eventId}`;

    // Priorité 1 : résultats en base
    const dbResults = await getEventResultsFromDB(eventId);
    if (dbResults) {
      res.json({ competitionId: compId, ...dbResults });
      return;
    }

    // Priorité 2 : scraping + persistance des résultats
    const result = await cachedFetch(cacheKey, async () => {
      const html = await fetchEventResults(compId, eventId);
      return parseEventResults(html, eventId);
    }, undefined, async (data) => {
      const allResults = data.rounds.flatMap(r => r.results);
      if (allResults.length > 0) {
        await saveResultsToDB(eventId, allResults);
      }
    });

    res.json({ competitionId: compId, ...result });
  } catch (err) {
    handleError(res, err, `competition/${req.params.id}/results/${req.params.eventId}`);
  }
});

/**
 * GET /api/liveffn/competitions/:id/startlist/:eventId — Liste de départ d'une épreuve.
 * Affiche l'ordre de passage par série avec les temps de chrono.
 */
liveffnRouter.get('/competitions/:id/startlist/:eventId', async (req: Request, res: Response) => {
  try {
    const compId = parseInt(String(req.params.id), 10);
    const eventId = parseInt(String(req.params.eventId), 10);
    if (isNaN(compId) || compId < 0 || compId > 10000000 || isNaN(eventId) || eventId < 0 || eventId > 10000000) {
      res.status(400).json({ error: 'ID de compétition ou épreuve invalide' });
      return;
    }

    const cacheKey: CacheKey = `competition_${compId}_startlist_${eventId}`;

    const result = await cachedFetch(cacheKey, async () => {
      const html = await fetchStartList(compId, eventId);
      return parseStartList(html, eventId);
    });

    res.json({ competitionId: compId, ...result });
  } catch (err) {
    handleError(res, err, `competition/${req.params.id}/startlist/${req.params.eventId}`);
  }
});

/**
 * GET /api/liveffn/swimmer/:iuf — Fiche détaillée d'un nageur.
 * Paramètres requis : iuf (identifiant FFN du nageur), ?competition=ID (compétition contexte).
 */
liveffnRouter.get('/swimmer/:iuf', async (req: Request, res: Response) => {
  try {
    const iuf = parseInt(String(req.params.iuf), 10);
    const competitionId = parseInt(String(req.query.competition ?? ''), 10);
    if (isNaN(iuf) || iuf < 0 || iuf > 10000000 || isNaN(competitionId) || competitionId < 0 || competitionId > 10000000) {
      res.status(400).json({ error: 'iuf et competition sont requis' });
      return;
    }

    const cacheKey: CacheKey = `swimmer_${competitionId}_${iuf}`;

    const data = await cachedFetch(cacheKey, async () => {
      const html = await fetchSwimmerDetails(competitionId, iuf);
      return parseSwimmerResults(html);
    });

    res.json(data);
  } catch (err) {
    handleError(res, err, `swimmer/${req.params.iuf}`);
  }
});

/**
 * GET /api/liveffn/club/:structureId — Fiche d'un club avec la liste de ses licenciés.
 */
liveffnRouter.get('/club/:structureId', async (req: Request, res: Response) => {
  try {
    const structureId = parseInt(String(req.params.structureId), 10);
    const competitionId = parseInt(String(req.query.competition ?? ''), 10);
    if (isNaN(structureId) || structureId < 0 || structureId > 10000000 || isNaN(competitionId) || competitionId < 0 || competitionId > 10000000) {
      res.status(400).json({ error: 'structureId et competition sont requis' });
      return;
    }

    const cacheKey: CacheKey = `club_${competitionId}_${structureId}`;

    const data = await cachedFetch(cacheKey, async () => {
      const html = await fetchClubDetails(competitionId, structureId);
      return parseClubDetails(html);
    });

    res.json(data);
  } catch (err) {
    handleError(res, err, `club/${req.params.structureId}`);
  }
});

/**
 * GET /api/liveffn/live/:id — Données en temps réel d'une compétition.
 * La page liveffn.com se rafraîchit automatiquement pendant la compétition.
 */
liveffnRouter.get('/live/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id) || id < 0 || id > 10000000) {
      res.status(400).json({ error: 'ID de compétition invalide' });
      return;
    }

    const html = await fetchLiveData(id);
    // La page live a une structure HTML spécifique
    // Pour l'instant, extraction des infos de base
    const $ = await import('cheerio').then(c => c.load(html));

    // Extraction des informations de session et de course depuis la page live
    const liveData = {
      competitionId: id,
      isLive: html.includes('flag_page_deja_donne:1'),
      rawLength: html.length,
      // La page live se rafraîchit et contient les données de course
      // Le parsing complet sera amélioré dans les prochaines versions
    };

    res.json(liveData);
  } catch (err) {
    handleError(res, err, `live/${req.params.id}`);
  }
});

/**
 * GET /api/liveffn/cache/stats — Statistiques du cache (monitoring/admin).
 */
liveffnRouter.get('/cache/stats', authMiddleware, requireRole('admin'), (_req: Request, res: Response) => {
  const stats = getCacheStats();
  res.json(stats);
});

/**
 * DELETE /api/liveffn/cache — Invalide tout le cache en mémoire.
 */
liveffnRouter.delete('/cache', authMiddleware, requireRole('admin'), (_req: Request, res: Response) => {
  invalidateAllCache();
  res.json({ success: true, message: 'Cache invalidé' });
});

/**
 * GET /api/liveffn/health — Vérification de santé du module LiveFFN.
 */
liveffnRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    module: 'liveffn',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});
