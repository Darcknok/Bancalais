import { supabase } from '../supabase';
import type {
  LiveFFNCompetition,
  LiveFFNCompetitionDetail,
  LiveFFNEvent,
  LiveFFNRaceResult,
  Genre,
} from './types';

// ─── Helpers ────────────────────────────────────────────────────

function parseDistanceNage(nom: string): { distance: number | null; nage: string | null } {
  const match = nom.match(/^(\d+)\s+(.+?)\s+(?:Messieurs|Dames|Femmes|Hommes|MIX)/);
  if (match) {
    return { distance: parseInt(match[1], 10), nage: match[2].trim() };
  }
  const fallback = nom.match(/^(\d+)\s+(.+)/);
  if (fallback) {
    return { distance: parseInt(fallback[1], 10), nage: fallback[2].trim() };
  }
  return { distance: null, nage: null };
}

function getListCacheId(page: string): number {
  return page === 'recemment_termine' ? -2 : -1;
}

function getListCacheNom(page: string): string {
  return page === 'recemment_termine'
    ? 'Liste des compétitions récemment terminées'
    : 'Liste des compétitions courantes';
}

// ─── Competition list (stored as sentinel rows in liveffn_competitions) ───

export async function saveCompetitionListToDB(page: string, competitions: LiveFFNCompetition[]): Promise<void> {
  const id = getListCacheId(page);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from('liveffn_competitions')
    .upsert({
      id,
      nom: getListCacheNom(page),
      ville: '',
      raw_json: JSON.parse(JSON.stringify(competitions)),
      expires_at: expiresAt,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  if (error) console.error('[persistence] saveCompetitionListToDB error:', error.message);
}

export async function getCompetitionListFromDB(page: string): Promise<LiveFFNCompetition[] | null> {
  const id = getListCacheId(page);
  const { data, error } = await supabase
    .from('liveffn_competitions')
    .select('raw_json, expires_at')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.error('[persistence] getCompetitionListFromDB error:', error.message);
    return null;
  }
  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  return (data.raw_json as unknown) as LiveFFNCompetition[] | null;
}

// ─── Competition detail ─────────────────────────────────────────

export async function saveCompetitionToDB(comp: LiveFFNCompetitionDetail & { id: number }): Promise<void> {
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from('liveffn_competitions')
    .upsert({
      id: comp.id,
      nom: comp.name,
      ville: comp.location,
      bassin: comp.poolLength || null,
      date_debut: comp.startDate || null,
      date_fin: comp.endDate || null,
      raw_json: JSON.parse(JSON.stringify(comp)),
      expires_at: expiresAt,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  if (error) console.error(`[persistence] saveCompetitionToDB(${comp.id}) error:`, error.message);
}

export async function getCompetitionFromDB(id: number): Promise<LiveFFNCompetitionDetail | null> {
  const { data, error } = await supabase
    .from('liveffn_competitions')
    .select('raw_json, expires_at')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.error(`[persistence] getCompetitionFromDB(${id}) error:`, error.message);
    return null;
  }
  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  return (data.raw_json as unknown) as LiveFFNCompetitionDetail | null;
}

// ─── Events (epreuves) ──────────────────────────────────────────

export async function saveEventToDB(event: LiveFFNEvent & { competitionId: number; sessionDate?: string; sessionNum?: number }): Promise<void> {
  const { distance, nage } = parseDistanceNage(event.nom);
  const { error } = await supabase
    .from('liveffn_epreuves')
    .upsert({
      id: event.id,
      competition_id: event.competitionId,
      nom: event.nom,
      genre: event.genre,
      distance,
      nage,
      session_date: event.sessionDate || null,
      session_num: event.sessionNum || null,
      heure_debut: event.heure || null,
      raw_json: JSON.parse(JSON.stringify(event)),
    }, { onConflict: 'id' });
  if (error) console.error(`[persistence] saveEventToDB(${event.id}) error:`, error.message);
}

// ─── Results ────────────────────────────────────────────────────

export async function saveResultsToDB(eventId: number, results: LiveFFNRaceResult[]): Promise<void> {
  const rows = results.map(r => ({
    epreuve_id: eventId,
    round: r.round,
    place: r.place,
    temps: r.time,
    nageur_nom: r.swimmer?.lastName || null,
    nageur_prenom: r.swimmer?.firstName || null,
    nageur_iuf: r.swimmer?.iuf || null,
    club_nom: r.swimmer?.clubName || null,
    club_id: r.swimmer?.clubId || null,
    points: r.points ?? null,
    reaction: r.reactionTime || null,
    remarque: r.remark || null,
    splits_json: r.splits ? JSON.parse(JSON.stringify(r.splits)) : null,
    raw_json: JSON.parse(JSON.stringify(r)),
  }));
  const { error } = await supabase
    .from('liveffn_resultats')
    .upsert(rows, {
      onConflict: 'id',
      ignoreDuplicates: false,
    });
  if (error) console.error(`[persistence] saveResultsToDB(${eventId}) error:`, error.message);
}

export async function getEventResultsFromDB(eventId: number): Promise<{
  name: string;
  gender: Genre;
  rounds: { name: string; typId: number; results: LiveFFNRaceResult[] }[];
} | null> {
  const { data, error } = await supabase
    .from('liveffn_resultats')
    .select('*')
    .eq('epreuve_id', eventId)
    .order('fetched_at', { ascending: false });
  if (error) {
    console.error(`[persistence] getEventResultsFromDB(${eventId}) error:`, error.message);
    return null;
  }
  if (!data || data.length === 0) return null;

  const byRound = new Map<string, LiveFFNRaceResult[]>();
  let eventName = '';
  let gender: Genre = 'M';

  for (const row of data) {
    const result: LiveFFNRaceResult = {
      eventId,
      eventName: '',
      round: row.round || '',
      place: row.place || '---',
      time: row.temps || '--:--.--',
      reactionTime: row.reaction || undefined,
      points: row.points ?? undefined,
      remark: row.remarque || undefined,
      splits: row.splits_json as LiveFFNRaceResult['splits'] | undefined,
      swimmer: (row.nageur_nom || row.nageur_iuf)
        ? {
            iuf: row.nageur_iuf || 0,
            lastName: row.nageur_nom || '',
            firstName: row.nageur_prenom || '',
            fullName: [row.nageur_prenom, row.nageur_nom].filter(Boolean).join(' '),
            birthYear: 0,
            nationality: '',
            clubId: row.club_id || 0,
            clubName: row.club_nom || '',
          }
        : undefined,
    };

    const roundName = row.round || 'Séries';
    if (!byRound.has(roundName)) {
      byRound.set(roundName, []);
    }
    byRound.get(roundName)!.push(result);
  }

  const rounds = Array.from(byRound.entries()).map(([name, results]) => ({
    name,
    typId: 0,
    results,
  }));

  if (rounds.length > 0 && rounds[0].results.length > 0) {
    eventName = rounds[0].results[0].eventName;
    gender = eventName.includes('Dames') || eventName.includes('Femmes') ? 'F' : 'M';
  }

  return { name: eventName, gender, rounds };
}

// ─── Cache maintenance ──────────────────────────────────────────

export async function clearExpiredCache(): Promise<void> {
  const now = new Date().toISOString();
  const { error: err1 } = await supabase
    .from('liveffn_competitions')
    .delete()
    .lt('expires_at', now);
  if (err1) console.error('[persistence] clearExpiredCache competitions error:', err1.message);

  const { error: err2 } = await supabase
    .from('liveffn_epreuves')
    .delete()
    .lt('fetched_at', now);
  if (err2) console.error('[persistence] clearExpiredCache epreuves error:', err2.message);

  const { error: err3 } = await supabase
    .from('liveffn_resultats')
    .delete()
    .lt('fetched_at', now);
  if (err3) console.error('[persistence] clearExpiredCache resultats error:', err3.message);
}
