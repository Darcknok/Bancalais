/**
 * HTTP fetcher for LiveFFN.com
 * Handles all outbound requests with configurable delays and retries.
 */

const BASE_URL = 'https://www.liveffn.com';
const DEFAULT_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export class LiveFFNFetchError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public url?: string,
  ) {
    super(message);
    this.name = 'LiveFFNFetchError';
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, DEFAULT_TIMEOUT);

      if (!response.ok) {
        throw new LiveFFNFetchError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          url,
        );
      }

      // ─── MODIFICATION ICI ───────────────────────────────────────────
      // Au lieu de response.text(), on récupère les données brutes
      const buffer = await response.arrayBuffer();
      
      // On décode manuellement en utilisant l'encodage historique du site
      const decoder = new TextDecoder('iso-8859-1');
      return decoder.decode(buffer);
      // ────────────────────────────────────────────────────────────────
      
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < retries) {
        await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
        continue;
      }
    }
  }

  throw lastError ?? new LiveFFNFetchError('Max retries exceeded', undefined, url);
}


/** Constructs a LiveFFN URL */
function liveURL(path: string, params: Record<string, string | number>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    search.set(key, String(value));
  }
  return `${BASE_URL}/cgi-bin/${path}?${search.toString()}`;
}

// ─── Public fetchers ─────────────────────────────────────────────

/** Fetch the list of competitions */
export async function fetchCompetitionList(page: 'courantes' | 'recemment_termine' = 'courantes'): Promise<string> {
  const url = page === 'recemment_termine'
    ? `${BASE_URL}/cgi-bin/liste_live.php?page=recemment_termine`
    : `${BASE_URL}/cgi-bin/liste_live.php`;
  return fetchWithRetry(url);
}

/** Fetch competition home page */
export async function fetchCompetitionPage(competitionId: number, lang = 'fra'): Promise<string> {
  const url = liveURL('index.php', { competition: competitionId, langue: lang });
  return fetchWithRetry(url);
}

/** Fetch competition program */
export async function fetchProgram(competitionId: number, lang = 'fra'): Promise<string> {
  const url = liveURL('programme.php', { competition: competitionId, langue: lang });
  return fetchWithRetry(url);
}

/** Fetch results for a specific event */
export async function fetchEventResults(competitionId: number, eventId: number, lang = 'fra'): Promise<string> {
  const url = liveURL('resultats.php', {
    competition: competitionId,
    langue: lang,
    go: 'epreuve',
    epreuve: eventId,
  });
  return fetchWithRetry(url);
}

/** Fetch start list for a specific event */
export async function fetchStartList(competitionId: number, eventId: number, lang = 'fra'): Promise<string> {
  const url = liveURL('startlist.php', {
    competition: competitionId,
    langue: lang,
    go: 'epreuve',
    epreuve: eventId,
  });
  return fetchWithRetry(url);
}

/** Fetch swimmer details */
export async function fetchSwimmerDetails(competitionId: number, iuf: number, lang = 'fra'): Promise<string> {
  const url = liveURL('resultats.php', {
    competition: competitionId,
    langue: lang,
    go: 'detail',
    action: 'participant',
    iuf,
  });
  return fetchWithRetry(url);
}

/** Fetch club details */
export async function fetchClubDetails(competitionId: number, structureId: number, lang = 'fra'): Promise<string> {
  const url = liveURL('resultats.php', {
    competition: competitionId,
    langue: lang,
    go: 'detail',
    action: 'structure',
    structure: structureId,
  });
  return fetchWithRetry(url);
}

/** Fetch live data */
export async function fetchLiveData(competitionId: number, lang = 'fra'): Promise<string> {
  const url = liveURL('live_contenaire.php', { competition: competitionId, langue: lang });
  return fetchWithRetry(url);
}

/** Fetch the start list by participant overview */
export async function fetchStartListParticipants(competitionId: number, lang = 'fra'): Promise<string> {
  const url = liveURL('startlist.php', {
    competition: competitionId,
    langue: lang,
    go: 'detail',
    action: 'participant',
  });
  return fetchWithRetry(url);
}

/** Fetch the start list by structure overview */
export async function fetchStartListStructures(competitionId: number, lang = 'fra'): Promise<string> {
  const url = liveURL('startlist.php', {
    competition: competitionId,
    langue: lang,
    go: 'detail',
    action: 'structure',
  });
  return fetchWithRetry(url);
}

export { BASE_URL };
