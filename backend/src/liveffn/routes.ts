/**
 * Express routes for the LiveFFN API.
 * Provides cached endpoints for LiveFFN data.
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
} from './persistence';
import type { CacheKey } from './types';

export const liveffnRouter = Router();

// ─── Utility ─────────────────────────────────────────────────────

function handleError(res: Response, error: unknown, context: string) {
  console.error(`LiveFFN ${context} error:`, error);
  const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des données LiveFFN';
  res.status(502).json({ error: message, context });
}

// ─── Endpoints ───────────────────────────────────────────────────

/**
 * GET /api/liveffn/competitions
 * List all competitions from LiveFFN.
 * Query params:
 *   - page: "courantes" | "recemment_termine" (default: "courantes")
 */
liveffnRouter.get('/competitions', async (req: Request, res: Response) => {
  try {
    const page = String(req.query.page ?? '') === 'recemment_termine' ? 'recemment_termine' : 'courantes';
    const cacheKey: CacheKey = `competition_list`;

    // Try DB first
    const dbList = await getCompetitionListFromDB(page);
    if (dbList) {
      res.json({ competitions: dbList, count: dbList.length, page });
      return;
    }

    // Fall back to scrape with persist
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
 * GET /api/liveffn/competitions/:id
 * Get detailed info about a specific competition.
 */
liveffnRouter.get('/competitions/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID de compétition invalide' });
      return;
    }

    const cacheKey: CacheKey = `competition_${id}`;

    // Try DB first
    const dbCompetition = await getCompetitionFromDB(id);
    if (dbCompetition) {
      res.json({ competition: dbCompetition });
      return;
    }

    // Fall back to scrape with persist
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
 * GET /api/liveffn/competitions/:id/program
 * Get the program (schedule) for a competition.
 */
liveffnRouter.get('/competitions/:id/program', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID de compétition invalide' });
      return;
    }

    const cacheKey: CacheKey = `competition_${id}_program`;

    const sessions = await cachedFetch(cacheKey, async () => {
      const html = await fetchProgram(id);
      return parseProgram(html);
    }, undefined, async (data) => {
      for (const session of data) {
        for (const event of session.epreuves) {
          // Skip events without a valid ID (presenceNonOk, no onclick tooltip)
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
 * GET /api/liveffn/competitions/:id/events
 * Get all events from the program (flat list).
 */
liveffnRouter.get('/competitions/:id/events', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID de compétition invalide' });
      return;
    }

    const cacheKey: CacheKey = `competition_${id}_program`;

    const sessions = await cachedFetch(cacheKey, async () => {
      const html = await fetchProgram(id);
      return parseProgram(html);
    }, undefined, async (data) => {
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

    // Flatten all events from all sessions
    const events = sessions.flatMap(s =>
      s.epreuves.map(e => ({
        ...e,
        sessionDate: s.date,
        sessionNum: s.numero,
        ouverturePortes: s.ouverturePortes,
      }))
    );

    // Optional filter by gender
    const genre = typeof req.query.genre === 'string' ? req.query.genre : undefined;
    const filtered = genre ? events.filter(e => e.genre === genre.toUpperCase()) : events;

    res.json({ competitionId: id, events: filtered, count: filtered.length });
  } catch (err) {
    handleError(res, err, `competition/${req.params.id}/events`);
  }
});

/**
 * GET /api/liveffn/competitions/:id/participants
 * Get the participant list for a competition.
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
 * GET /api/liveffn/competitions/:id/results/:eventId
 * Get results for a specific event.
 */
liveffnRouter.get('/competitions/:id/results/:eventId', async (req: Request, res: Response) => {
  try {
    const compId = parseInt(String(req.params.id), 10);
    const eventId = parseInt(String(req.params.eventId), 10);
    if (isNaN(compId) || isNaN(eventId)) {
      res.status(400).json({ error: 'ID de compétition ou épreuve invalide' });
      return;
    }

    const cacheKey: CacheKey = `competition_${compId}_results_${eventId}`;

    // Try DB first
    const dbResults = await getEventResultsFromDB(eventId);
    if (dbResults) {
      res.json({ competitionId: compId, ...dbResults });
      return;
    }

    // Fall back to scrape with persist
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
 * GET /api/liveffn/competitions/:id/startlist/:eventId
 * Get start list for a specific event.
 */
liveffnRouter.get('/competitions/:id/startlist/:eventId', async (req: Request, res: Response) => {
  try {
    const compId = parseInt(String(req.params.id), 10);
    const eventId = parseInt(String(req.params.eventId), 10);
    if (isNaN(compId) || isNaN(eventId)) {
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
 * GET /api/liveffn/swimmer/:iuf
 * Get swimmer details and results.
 * Query params:
 *   - competition: competition ID (required to fetch context)
 */
liveffnRouter.get('/swimmer/:iuf', async (req: Request, res: Response) => {
  try {
    const iuf = parseInt(String(req.params.iuf), 10);
    const competitionId = parseInt(String(req.query.competition ?? ''), 10);
    if (isNaN(iuf) || isNaN(competitionId)) {
      res.status(400).json({ error: 'iuf et competition sont requis' });
      return;
    }

    const cacheKey: CacheKey = `swimmer_${iuf}`;

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
 * GET /api/liveffn/club/:structureId
 * Get club details and members.
 */
liveffnRouter.get('/club/:structureId', async (req: Request, res: Response) => {
  try {
    const structureId = parseInt(String(req.params.structureId), 10);
    const competitionId = parseInt(String(req.query.competition ?? ''), 10);
    if (isNaN(structureId) || isNaN(competitionId)) {
      res.status(400).json({ error: 'structureId et competition sont requis' });
      return;
    }

    const cacheKey: CacheKey = `club_${structureId}`;

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
 * GET /api/liveffn/live/:id
 * Get live data for a competition.
 */
liveffnRouter.get('/live/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID de compétition invalide' });
      return;
    }

    const html = await fetchLiveData(id);
    // Live data has its own specific HTML structure
    // For now, parse the basic live page
    const $ = await import('cheerio').then(c => c.load(html));

    // Extract session info and race data from live page
    const liveData = {
      competitionId: id,
      isLive: html.includes('flag_page_deja_donne:1') || !html.includes('flag_page_deja_donne:0'),
      rawLength: html.length,
      // The live page auto-refreshes and contains race data
      // Full parsing of live data will be enhanced in future versions
    };

    res.json(liveData);
  } catch (err) {
    handleError(res, err, `live/${req.params.id}`);
  }
});

/**
 * GET /api/liveffn/cache/stats
 * Get cache statistics (admin/monitoring).
 */
liveffnRouter.get('/cache/stats', (_req: Request, res: Response) => {
  const stats = getCacheStats();
  res.json(stats);
});

/**
 * DELETE /api/liveffn/cache
 * Invalidate all cache.
 */
liveffnRouter.delete('/cache', (_req: Request, res: Response) => {
  invalidateAllCache();
  res.json({ success: true, message: 'Cache invalidé' });
});

/**
 * GET /api/liveffn/health
 * Health check for the LiveFFN module.
 */
liveffnRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    module: 'liveffn',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});
