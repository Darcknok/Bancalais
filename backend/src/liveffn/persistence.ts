/**
 * Persistence layer for LiveFFN scraped data.
 *
 * Chaque fonction respecte le pattern :
 * 1. Vérifier si la donnée existe déjà en DB
 * 2. Si oui → comparer le hash pour détecter les changements
 * 3. Si changé → UPDATE ; si identique → SKIP (pas d'écriture inutile)
 * 4. Si n'existe pas → INSERT
 */

import * as crypto from 'crypto';
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
  if (match) return { distance: parseInt(match[1], 10), nage: match[2].trim() };
  const fallback = nom.match(/^(\d+)\s+(.+)/);
  if (fallback) return { distance: parseInt(fallback[1], 10), nage: fallback[2].trim() };
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

// ─── Hash computation ───────────────────────────────────────────

/**
 * Calcule un hash MD5 des champs "changeables" d'un objet.
 * Deux objets avec les mêmes données produiront le même hash.
 */
function computeHash(obj: Record<string, unknown>, fields: string[]): string {
  const payload = fields.map(f => String(obj[f] ?? '')).join('|');
  return crypto.createHash('md5').update(payload).digest('hex');
}

// ─── Generic upsert with change detection ───────────────────────

type UpsertConfig<T extends Record<string, unknown>> = {
  /** Nom de la table Supabase */
  table: string;
  /** Colonne(s) de conflit pour l'upsert */
  conflictColumns: string | string[];
  /** Champs à inclure dans le hash de changement (ceux qui peuvent évoluer) */
  changeFields: (keyof T)[];
  /** Fonction pour extraire la clé unique d'une ligne (utile pour la query de hash existants) */
  extractKey: (row: T) => Record<string, unknown>;
  /** Taille max des batches pour l'insertion */
  batchSize?: number;
};

/**
 * Upsert intelligent avec détection de changement.
 *
 * 1. Calcule le hash des champs "changeables" pour chaque ligne
 * 2. Récupère les hash existants en DB
 * 3. Filtre : garde seulement les lignes NEW ou CHANGED
 * 4. Upsert uniquement celles-ci
 *
 * Retourne le nombre de lignes effectivement écrites.
 */
async function upsertWithDiff<T extends Record<string, unknown>>(
  rows: T[],
  config: UpsertConfig<T>,
): Promise<number> {
  if (rows.length === 0) return 0;

  const { table, conflictColumns, changeFields } = config;
  const conflictCols = Array.isArray(conflictColumns) ? conflictColumns : [conflictColumns];

  // 1. Calculer le hash pour chaque ligne
  const rowsWithHash = rows.map(row => {
    const hash = computeHash(row as Record<string, unknown>, changeFields as string[]);
    return { ...row, data_hash: hash };
  });

  // 2. Récupérer les hash existants
  const keys = rowsWithHash.map(r => config.extractKey(r));
  const existingMap = await fetchExistingHashes(table, conflictCols, keys);

  // 3. Filtrer : garder seulement les nouvelles lignes ou celles dont le hash a changé
  const toUpsert: typeof rowsWithHash = [];
  let skipped = 0;

  for (const row of rowsWithHash) {
    const key = config.extractKey(row);
    const existingHash = existingMap.get(serializeKey(key, conflictCols));
    if (existingHash === row.data_hash) {
      skipped++;
      continue; // Identique → skip
    }
    toUpsert.push(row);
  }

  if (toUpsert.length === 0) {
    console.log(`[persistence] ${table}: ${rows.length} lignes, toutes identiques — 0 écriture`);
    return 0;
  }

  // 4. Upsert par batches
  const batchSize = config.batchSize ?? 50;
  let written = 0;

  for (let i = 0; i < toUpsert.length; i += batchSize) {
    const batch = toUpsert.slice(i, i + batchSize);
    const conflictString = conflictCols.join(',');
    const { error } = await supabase
      .from(table)
      .upsert(batch as any, {
        onConflict: conflictString,
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`[persistence] ${table} upsert error (batch ${i}):`, error.message);
    } else {
      written += batch.length;
    }
  }

  console.log(`[persistence] ${table}: ${toUpsert.length} écrites / ${rows.length} total (${skipped} identiques sautées)`);
  return written;
}

/**
 * Récupère les hash existants pour un ensemble de clés.
 * Retourne une Map<"col1|col2|...", hash>
 */
async function fetchExistingHashes(
  table: string,
  conflictCols: string[],
  keys: Record<string, unknown>[],
): Promise<Map<string, string>> {
  if (keys.length === 0) return new Map();

  // Construire une requête OR pour toutes les clés
  // (plus performant que N requêtes individuelles)
  const result = new Map<string, string>();

  // Pour les tables avec une PK simple (id), on peut faire un IN
  if (conflictCols.length === 1 && conflictCols[0] === 'id') {
    const ids = keys.map(k => Number(k.id)).filter(id => !isNaN(id) && id > 0);
    if (ids.length === 0) return result;

    // Batch par lots de 50
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50);
      const { data, error } = await supabase
        .from(table)
        .select('id, data_hash')
        .in('id', batch);

      if (error) {
        console.error(`[persistence] fetchExistingHashes(${table}) error:`, error.message);
        continue;
      }
      if (data) {
        for (const row of data) {
          result.set(String(row.id), row.data_hash ?? '');
        }
      }
    }
    return result;
  }

  // Pour les clés composites (epreuve_id, round, nageur_iuf)
  // On doit faire des requêtes individuelles ou utiliser une approche OR
  // Approche : requête pour chaque clé (batch quand même)
  const uniqueKeys = new Map<string, Record<string, unknown>>();
  for (const k of keys) {
    const sk = serializeKey(k, conflictCols);
    if (!uniqueKeys.has(sk)) uniqueKeys.set(sk, k);
  }

  const keyArray = Array.from(uniqueKeys.values());

  // Supabase ne supporte pas les OR complexes facilement, on va groupe par
  // les colonnes fixes (epreuve_id) et utiliser IN
  if (conflictCols[0] === 'epreuve_id') {
    // Grouper par epreuve_id
    const byEpreuve = new Map<number, Record<string, unknown>[]>();
    for (const k of keyArray) {
      const eid = Number(k.epreuve_id);
      if (!isNaN(eid)) {
        if (!byEpreuve.has(eid)) byEpreuve.set(eid, []);
        byEpreuve.get(eid)!.push(k);
      }
    }

    for (const [epreuveId, kk] of byEpreuve) {
      const { data, error } = await supabase
        .from(table)
        .select('epreuve_id, round, nageur_iuf, data_hash')
        .eq('epreuve_id', epreuveId);

      if (error) {
        console.error(`[persistence] fetchExistingHashes(${table}) error:`, error.message);
        continue;
      }
      if (data) {
        for (const row of data) {
          const sk = serializeKey({ epreuve_id: row.epreuve_id, round: row.round, nageur_iuf: row.nageur_iuf }, conflictCols);
          result.set(sk, row.data_hash ?? '');
        }
      }
    }
    return result;
  }

  // Fallback : petite table, on récupère tout
  const { data, error } = await supabase
    .from(table)
    .select(`data_hash, ${conflictCols.join(', ')}`);

  if (error) {
    console.error(`[persistence] fetchExistingHashes(${table}) fallback error:`, error.message);
    return result;
  }
  if (data) {
    for (const row of data) {
      const key: Record<string, unknown> = {};
      for (const col of conflictCols) {
        key[col] = row[col];
      }
      const sk = serializeKey(key, conflictCols);
      result.set(sk, row.data_hash ?? '');
    }
  }
  return result;
}

function serializeKey(key: Record<string, unknown>, cols: string[]): string {
  return cols.map(c => String(key[c] ?? '')).join('|');
}

// ─── Competition list ───────────────────────────────────────────

export async function saveCompetitionListToDB(page: string, competitions: LiveFFNCompetition[]): Promise<void> {
  const id = getListCacheId(page);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const rawJson = JSON.parse(JSON.stringify(competitions));
  const hash = computeHash({ raw_json: JSON.stringify(rawJson) }, ['raw_json']);

  // Vérifier si la liste a changé
  const { data: existing } = await supabase
    .from('liveffn_competitions')
    .select('data_hash')
    .eq('id', id)
    .maybeSingle();

  if (existing && existing.data_hash === hash) {
    console.log(`[persistence] Competition list "${page}" unchanged, skipping`);
    return;
  }

  const { error } = await supabase
    .from('liveffn_competitions')
    .upsert({
      id,
      nom: getListCacheNom(page),
      ville: '',
      raw_json: rawJson,
      data_hash: hash,
      expires_at: expiresAt,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) console.error('[persistence] saveCompetitionListToDB error:', error.message);
  else console.log(`[persistence] Competition list "${page}" saved (${competitions.length} comps)`);
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
  const rawJson = JSON.parse(JSON.stringify(comp));
  const hash = computeHash(rawJson, ['name', 'location', 'poolLength', 'startDate', 'endDate', 'posterUrl']);

  // Vérifier si le détail a changé
  const { data: existing } = await supabase
    .from('liveffn_competitions')
    .select('data_hash')
    .eq('id', comp.id)
    .maybeSingle();

  if (existing && existing.data_hash === hash) {
    console.log(`[persistence] Competition ${comp.id} unchanged, skipping`);
    return;
  }

  const { error } = await supabase
    .from('liveffn_competitions')
    .upsert({
      id: comp.id,
      nom: comp.name,
      ville: comp.location,
      bassin: comp.poolLength || null,
      date_debut: comp.startDate || null,
      date_fin: comp.endDate || null,
      raw_json: rawJson,
      data_hash: hash,
      expires_at: expiresAt,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) console.error(`[persistence] saveCompetitionToDB(${comp.id}) error:`, error.message);
  else console.log(`[persistence] Competition ${comp.id} saved`);
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

// ─── Ensure competition exists (for FK) ────────────────────────

/**
 * Vérifie qu'une compétition existe dans liveffn_competitions.
 * Si elle n'existe pas, crée une entrée minimale pour satisfaire la FK.
 */
export async function ensureCompetitionExists(competitionId: number): Promise<void> {
  const { data: existing } = await supabase
    .from('liveffn_competitions')
    .select('id')
    .eq('id', competitionId)
    .maybeSingle();

  if (existing) return;

  // Entrée minimale pour satisfaire la contrainte FK
  const { error } = await supabase
    .from('liveffn_competitions')
    .upsert({
      id: competitionId,
      nom: `Compétition ${competitionId}`,
      ville: '',
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) console.error(`[persistence] ensureCompetitionExists(${competitionId}) error:`, error.message);
}

// ─── Events (epreuves) ──────────────────────────────────────────

type EventRow = LiveFFNEvent & {
  competitionId: number;
  sessionDate?: string;
  sessionNum?: number;
};

export async function saveEventToDB(event: EventRow): Promise<void> {
  const { distance, nage } = parseDistanceNage(event.nom);
  const hash = computeHash(event as unknown as Record<string, unknown>, [
    'nom', 'heure', 'genre', 'typeTour', 'nbSeries', 'nbParticipants',
  ]);

  // Vérifier si l'épreuve a changé
  const { data: existing } = await supabase
    .from('liveffn_epreuves')
    .select('data_hash')
    .eq('id', event.id)
    .maybeSingle();

  if (existing && existing.data_hash === hash) {
    console.log(`[persistence] Event ${event.id} unchanged, skipping`);
    return;
  }

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
      data_hash: hash,
    }, { onConflict: 'id' });

  if (error) console.error(`[persistence] saveEventToDB(${event.id}) error:`, error.message);
}

// ─── Results ────────────────────────────────────────────────────

type ResultRow = {
  epreuve_id: number;
  round: string;
  place: string;
  temps: string;
  nageur_nom: string | null;
  nageur_prenom: string | null;
  nageur_iuf: number | null;
  club_nom: string | null;
  club_id: number | null;
  points: number | null;
  reaction: string | null;
  remarque: string | null;
  splits_json: Record<string, unknown> | null;
  raw_json: Record<string, unknown>;
  data_hash?: string;
};

/**
 * Sauvegarde les résultats avec détection de changement.
 * Utilise la contrainte unique (epreuve_id, round, nageur_iuf) pour
 * identifier chaque ligne, et compare le hash avant d'écrire.
 */
export async function saveResultsToDB(eventId: number, results: LiveFFNRaceResult[]): Promise<void> {
  const rows: ResultRow[] = results.map(r => ({
    epreuve_id: eventId,
    round: r.round || 'Séries',
    place: r.place,
    temps: r.time,
    nageur_nom: r.swimmer?.lastName || null,
    nageur_prenom: r.swimmer?.firstName || null,
    nageur_iuf: r.swimmer?.iuf ?? null,
    club_nom: r.swimmer?.clubName || null,
    club_id: r.swimmer?.clubId ?? null,
    points: r.points ?? null,
    reaction: r.reactionTime || null,
    remarque: r.remark || null,
    splits_json: r.splits ? JSON.parse(JSON.stringify(r.splits)) : null,
    raw_json: JSON.parse(JSON.stringify(r)),
  }));

  const written = await upsertWithDiff(rows, {
    table: 'liveffn_resultats',
    conflictColumns: ['epreuve_id', 'round', 'nageur_iuf'],
    changeFields: ['temps', 'place', 'points', 'reaction', 'remarque', 'splits_json'],
    extractKey: (row: ResultRow) => ({
      epreuve_id: row.epreuve_id,
      round: row.round ?? '',
      nageur_iuf: row.nageur_iuf ?? 0,
    }),
    batchSize: 50,
  });

  if (written > 0) {
    console.log(`[persistence] Résultats épreuve ${eventId}: ${written} lignes écrites`);
  }
}

/**
 * Récupère les résultats d'une épreuve depuis la DB.
 */
export async function getEventResultsFromDB(eventId: number): Promise<{
  name: string;
  gender: Genre;
  rounds: { name: string; typId: number; results: LiveFFNRaceResult[] }[];
} | null> {
  const { data, error } = await supabase
    .from('liveffn_resultats')
    .select('*')
    .eq('epreuve_id', eventId);

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
            fullName: [row.nageur_nom, row.nageur_prenom].filter(Boolean).join(' '),
            birthYear: 0,
            nationality: '',
            clubId: row.club_id || 0,
            clubName: row.club_nom || '',
          }
        : undefined,
    };

    const roundName = row.round || 'Séries';
    if (!byRound.has(roundName)) byRound.set(roundName, []);
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

  // Ne pas supprimer les résultats et épreuves par date (ils sont utiles plus longtemps)
  // On nettoie seulement les compétitions expirées
}
