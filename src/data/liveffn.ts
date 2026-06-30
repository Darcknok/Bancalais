/**
 * LiveFFN API client for the Bancalais mobile app.
 * Provides access to real-time competition data scraped from liveffn.com.
 */

import { API_BASE_URL } from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────────

export type Genre = 'M' | 'F' | 'MIX';

export type LiveFFNCompetitionSummary = {
  id: number;
  nom: string;
  lieu: string;
  ville?: string;
  dept?: string;
  bassin: string;
  dateDebut: string | null;
  dateFin: string | null;
  niveau?: string;
  engagements?: number | null;
  nageurs?: number | null;
  imageUrl?: string;
  lien?: string;
};

export type LiveFFNCompetitionDetail = {
  id: number;
  name: string;
  nom?: string;
  location: string;
  ville?: string;
  organisme?: string;
  federation?: string;
  dates?: string;
  dateRange?: string;
  bassin?: string;
  poolLength?: string;
  clubOrganisateur?: string;
  meetingLabel?: string;
  startDate?: string;
  endDate?: string;
  posterUrl?: string;
  organizerUrl?: string;
};

export type ProgramItemKind = 'debutEpreuve' | 'sport' | 'nonSportif';

export type ProgramItem = {
  kind: ProgramItemKind;
  label: string;
  epreuve?: LiveFFNEvent;
  sessionNumero: number;
};

export type LiveFFNSession = {
  date: string;
  numero: number;
  heureDebut: string;
  ouverturePortes: string;
  epreuves: LiveFFNEvent[];
  items: ProgramItem[];
};

export type LiveFFNEvent = {
  id: number;
  heure: string;
  nom: string;
  genre: Genre;
  distance: number;
  nage: string;
  typeTour?: string;      // "Séries", "Finale A", "Finale B", "Finale C"
  typId?: number;          // 60=Séries, 11=Finale A, 12=Finale B, 13=Finale C
  _sessionLabel?: string;  // label de session pour affichage (ex: "Réunion 1")
  minAge?: number;
  maxAge?: number;
  sessionDate?: string;
  sessionNum?: number;
  ouverturePortes?: string;
};

export type LiveFFNParticipant = {
  iuf: number;
  nom: string;
  prenom: string;
  fullName: string;
  birthYear: number;
  nationality: string;
  clubId: number;
  clubName: string;
};

export type LiveFFNSwimmer = {
  iuf: number;
  prenom?: string;
  nom?: string;
  fullName: string;
  birthYear: number;
  nationality: string;
  clubId: number;
  clubName: string;
};

export type LiveFFNSplit = {
  distance: number;
  splitTime: string;
  lapTime: string;
  cumulativeTime?: string;
};

export type LiveFFNRaceResult = {
  eventId: number;
  eventName: string;
  round: string;
  place: string;
  time: string;
  reactionTime?: string;
  points?: number;
  splits?: LiveFFNSplit[];
  remark?: string;
  swimmer?: LiveFFNSwimmer;
};

export type LiveFFNResultsRound = {
  name: string;
  typId: number;
  results: LiveFFNRaceResult[];
};

export type LiveFFNEventResults = {
  name: string;
  gender: Genre;
  rounds: LiveFFNResultsRound[];
};

export type LiveFFNStartListEntry = {
  ligne: string;
  nom: string;
  club: string;
  tempsEngagement: string;
  tempsSaisi: string;
  statut?: string;
};

export type LiveFFNStartList = {
  name: string;
  gender: Genre;
  entries: LiveFFNStartListEntry[];
};

export type LiveFFNSwimmerResults = {
  swimmer: LiveFFNSwimmer;
  results: LiveFFNRaceResult[];
};

export type LiveFFNClubDetails = {
  nom: string;
  ville: string;
  licencies: Array<{
    iuf: number;
    nom: string;
    prenom: string;
    sexe: string;
    dateNaissance: string;
    anneeNaissance: number;
  }>;
};

// ─── API Client ───────────────────────────────────────────────

async function liveffnFetch<T>(path: string, timeoutMs = 15000): Promise<{ data?: T; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`${API_BASE_URL}/api/liveffn${path}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const body = await res.json();

    if (!res.ok) {
      return { error: body.error ?? `Erreur ${res.status}` };
    }

    return { data: body as T };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { error: 'Connexion au serveur impossible (délai dépassé)' };
    }
    const message = err instanceof Error ? err.message : 'Erreur réseau';
    return { error: message };
  }
}

// ─── Competitions ─────────────────────────────────────────────

export async function fetchLiveFFNCompetitions(
  page: 'courantes' | 'recemment_termine' = 'courantes',
) {
  return liveffnFetch<{ competitions: LiveFFNCompetitionSummary[]; count: number; page: string }>(
    `/competitions?page=${page}`,
  );
}

export async function fetchLiveFFNCompetition(id: number) {
  return liveffnFetch<{ competition: LiveFFNCompetitionDetail }>(
    `/competitions/${id}`,
  );
}

// ─── Program / Events ─────────────────────────────────────────

export async function fetchLiveFFNProgram(id: number) {
  return liveffnFetch<{ competitionId: number; sessions: LiveFFNSession[]; count: number }>(
    `/competitions/${id}/program`,
  );
}

export async function fetchLiveFFNEvents(id: number, genre?: Genre) {
  const query = genre ? `?genre=${genre}` : '';
  return liveffnFetch<{ competitionId: number; events: LiveFFNEvent[]; count: number }>(
    `/competitions/${id}/events${query}`,
  );
}

// ─── Participants ────────────────────────────────────────────

export async function fetchLiveFFNParticipants(id: number) {
  return liveffnFetch<{ competitionId: number; participants: LiveFFNParticipant[]; count: number }>(
    `/competitions/${id}/participants`,
  );
}

// ─── Results ──────────────────────────────────────────────────

export async function fetchLiveFFNResults(compId: number, eventId: number) {
  return liveffnFetch<{ competitionId: number; name: string; gender: Genre; rounds: LiveFFNResultsRound[] }>(
    `/competitions/${compId}/results/${eventId}`,
  );
}

// ─── Start Lists ──────────────────────────────────────────────

export async function fetchLiveFFNStartList(compId: number, eventId: number) {
  return liveffnFetch<{ competitionId: number; name: string; gender: Genre; entries: LiveFFNStartListEntry[] }>(
    `/competitions/${compId}/startlist/${eventId}`,
  );
}

// ─── Swimmer ──────────────────────────────────────────────────

export async function fetchLiveFFNSwimmer(iuf: number, competitionId: number) {
  return liveffnFetch<LiveFFNSwimmerResults>(
    `/swimmer/${iuf}?competition=${competitionId}`,
  );
}

// ─── Club ─────────────────────────────────────────────────────

export async function fetchLiveFFNClub(structureId: number, competitionId: number) {
  return liveffnFetch<LiveFFNClubDetails>(
    `/club/${structureId}?competition=${competitionId}`,
  );
}

// ─── Live ─────────────────────────────────────────────────────

export async function fetchLiveFFNLive(compId: number) {
  return liveffnFetch<{ competitionId: number; isLive: boolean }>(
    `/live/${compId}`,
  );
}

// ─── Cache Management ─────────────────────────────────────────

export async function fetchLiveFFNCacheStats() {
  return liveffnFetch<{ keys: number; entries: Array<{ key: string; expiresIn: number }> }>(
    '/cache/stats',
  );
}

export async function invalidateLiveFFNCache() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${API_BASE_URL}/api/liveffn/cache`, {
      method: 'DELETE',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const body = await res.json();
    if (!res.ok) return { error: body.error ?? `Erreur ${res.status}` };
    return { data: body as { success: boolean; message: string } };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { error: 'Connexion au serveur impossible (délai dépassé)' };
    }
    const message = err instanceof Error ? err.message : 'Erreur réseau';
    return { error: message };
  }
}
