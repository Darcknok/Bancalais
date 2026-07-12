import { fetchCompetitions, fetchCompetition, type ApiCompetition, type ApiEpreuve, type ApiPB } from '@/lib/api';
import {
  fetchLiveFFNCompetitions,
  fetchLiveFFNProgram,
  fetchLiveFFNCompetition as fetchLiveFFNDetail,
  fetchLiveFFNParticipants,
  fetchLiveFFNSwimmer,
  type LiveFFNCompetitionSummary,
  type LiveFFNSession,
  type LiveFFNEvent,
  type LiveFFNRaceResult,
  type LiveFFNParticipant,
} from '@/data/liveffn';

export type { ApiCompetition, ApiEpreuve, ApiPB, LiveFFNParticipant };

export type CompetitionSource = 'local' | 'liveffn';

export type SourceCompetition = ApiCompetition & {
  source: CompetitionSource;
  /** true si le nageur connecté est inscrit dans cette compétition LiveFFN */
  swimmerFound?: boolean;
};

const NAGE_KEYWORDS: Record<string, string> = {
  'nage libre': 'crawl',
  'papillon': 'pap',
  'dos': 'dos',
  'brasse': 'brass',
  '4 nages': 'pap',
};

function inferTypeNage(eventName: string): string {
  const lower = eventName.toLowerCase();
  for (const [kw, tn] of Object.entries(NAGE_KEYWORDS)) {
    if (lower.includes(kw)) return tn;
  }
  return 'crawl';
}

function liveFFNToApiCompetition(lf: LiveFFNCompetitionSummary): SourceCompetition {
  return {
    id: lf.id,
    lieu: lf.lieu || lf.ville || lf.nom,
    date: lf.dateDebut && lf.dateFin
      ? `${lf.dateDebut} - ${lf.dateFin}`
      : lf.dateDebut || '',
    ouverture_portes: null,
    debut_epreuves: null,
    engagements: null,
    pause: null,
    remise_recompenses: null,
    epreuves: [],
    created_at: '',
    source: 'liveffn',
    swimmerFound: false,
  };
}

function liveFFNEventToApiEpreuve(event: LiveFFNEvent): ApiEpreuve {
  return {
    id: event.id,
    competition_id: 0,
    heure: event.heure || event.sessionDate || '',
    nage: event.nom,
    type_nage: inferTypeNage(event.nom) as ApiEpreuve['type_nage'],
    ordre: 0,
    inscription: null,
  };
}

/**
 * Vérifie si les mots du nom d'un utilisateur (prénom + nom combinés)
 * correspondent à ceux d'un participant LiveFFN.
 *
 * La logique concatène prénom et nom des deux côtés et vérifie que
 * **tous les mots** du côté utilisateur sont présents dans le côté participant.
 *
 * Cela permet de gérer les noms composés quelle que soit la répartition
 * entre prénom et nom (ex: "CALAIS OREFICE Mathias" parsé en nom="CALAIS"
 * et prenom="OREFICE Mathias" correspondra à un utilisateur enregistré
 * avec prenom="Mathias" et nom="Calais Orefice").
 */
function namesMatch(
  userPrenom: string, userNom: string,
  partPrenom: string, partNom: string,
): boolean {
  const userWords = (userPrenom + ' ' + userNom)
    .toLowerCase().trim().split(/\s+/).filter(Boolean);
  const partWords = (partPrenom + ' ' + partNom)
    .toLowerCase().trim().split(/\s+/).filter(Boolean);
  return userWords.length > 0 && userWords.every(w => partWords.includes(w));
}

function liveFFNSessionToApiEpreuve(session: LiveFFNSession): ApiEpreuve[] {
  return session.epreuves.map(e => ({
    id: e.id,
    competition_id: 0,
    heure: e.heure || session.heureDebut || '',
    nage: e.nom,
    type_nage: inferTypeNage(e.nom) as ApiEpreuve['type_nage'],
    ordre: e.sessionNum || session.numero || 0,
    inscription: null,
  }));
}

/**
 * Vérifie si un nageur (prénom + nom) est inscrit dans une compétition LiveFFN.
 * Les participants sont mis en cache par le backend, donc cet appel est rapide.
 */
async function checkSwimmerInCompetition(
  compId: number,
  prenom: string,
  nom: string,
): Promise<boolean> {
  try {
    const res = await fetchLiveFFNParticipants(compId);
    if (res.error || !res.data?.participants) return false;
    return res.data.participants.some(
      p => namesMatch(prenom, nom, p.prenom, p.nom),
    );
  } catch {
    return false;
  }
}

export async function fetchAllCompetitions(
  filter?: 'all' | 'local' | 'liveffn',
  prenom?: string,
  nom?: string,
): Promise<{ data?: { competitions: SourceCompetition[] }; error?: string }> {
  if (filter === 'liveffn') {
    const liveffnRes = await fetchLiveFFNCompetitions('courantes');
    const liveffn: SourceCompetition[] = (liveffnRes.data?.competitions ?? []).map(c => ({
      ...liveFFNToApiCompetition(c),
      swimmerFound: false,
    }));
    return { data: { competitions: liveffn } };
  }

  const [localRes, liveffnRes] = await Promise.all([
    fetchCompetitions(),
    fetchLiveFFNCompetitions('courantes'),
  ]);

  const local: SourceCompetition[] = (localRes.data?.competitions ?? []).map(c => ({
    ...c, source: 'local' as const, swimmerFound: false,
  }));

  const liveffn: SourceCompetition[] = (liveffnRes.data?.competitions ?? []).map(c => ({
    ...liveFFNToApiCompetition(c),
    swimmerFound: false,
  }));

  // Si on a un prénom/nom ET qu'on veut filtrer "Mes compétitions",
  // on vérifie pour chaque compétition LiveFFN si le nageur y est inscrit
  if (filter === 'local' && prenom && nom) {
    // Vérifier les participants en parallèle (max 20 pour éviter les timeouts)
    const toCheck = liveffn.slice(0, 20);
    const results = await Promise.allSettled(
      toCheck.map(comp =>
        fetchLiveFFNParticipants(comp.id).then(res => ({
          compId: comp.id,
          participant: res.data?.participants?.find(
            p => namesMatch(prenom, nom, p.prenom, p.nom),
          ) ?? null,
        })),
      ),
    );

    const foundParticipants: { comp: SourceCompetition; iuf: number }[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value.participant) {
        toCheck[i].swimmerFound = true;
        foundParticipants.push({ comp: toCheck[i], iuf: r.value.participant.iuf });
      }
    });

    // Pour chaque compétition où le nageur est trouvé, récupérer ses épreuves
    if (foundParticipants.length > 0) {
      await Promise.allSettled(
        foundParticipants.map(async ({ comp, iuf }) => {
          try {
            const swimmerRes = await fetchLiveFFNSwimmer(iuf, comp.id);
            if (swimmerRes.data?.results) {
              // Extraire les noms d'épreuves uniques
              const seen = new Set<string>();
              comp.epreuves = swimmerRes.data.results
                .filter(r => {
                  if (!r.eventName || seen.has(r.eventName)) return false;
                  seen.add(r.eventName);
                  return true;
                })
                .map(r => ({
                  id: r.eventId,
                  competition_id: comp.id,
                  heure: '',
                  nage: r.eventName,
                  type_nage: inferTypeNage(r.eventName) as ApiEpreuve['type_nage'],
                  ordre: 0,
                  inscription: null,
                }));
            }
          } catch (err) {
            console.warn(`[competition-service] erreur events pour comp ${comp.id}:`, err);
          }
        }),
      );
    }

    // "Mes compétitions" = compétitions locales + LiveFFN où le nageur est trouvé
    const myCompetitions = [
      ...local,
      ...liveffn.filter(c => c.swimmerFound),
    ];
    return { data: { competitions: myCompetitions } };
  }

  // Mode "all" : on vérifie aussi pour le badge mais sans filtrer
  if (prenom && nom) {
    const toCheck = liveffn.slice(0, 20);
    const results = await Promise.allSettled(
      toCheck.map(comp => checkSwimmerInCompetition(comp.id, prenom, nom)),
    );
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        toCheck[i].swimmerFound = r.value;
      }
    });
  }

  const combined = [...local, ...liveffn];
  return { data: { competitions: combined } };
}

export async function fetchCompetitionDetail(
  id: number,
  source: CompetitionSource,
): Promise<{ data?: { competition: SourceCompetition }; error?: string }> {
  if (source === 'local') {
    const res = await fetchCompetition(id);
    if (res.data?.competition) {
      return { data: { competition: { ...res.data.competition, source: 'local' as const, swimmerFound: false } } };
    }
    return { error: res.error };
  }

  const [detailRes, programRes] = await Promise.all([
    fetchLiveFFNDetail(id),
    fetchLiveFFNProgram(id),
  ]);

  if (detailRes.error) return { error: detailRes.error };
  if (programRes.error) return { error: programRes.error };

  const detail = detailRes.data!.competition;
  const sessions = programRes.data!.sessions;

  const epreuves: ApiEpreuve[] = sessions.flatMap(liveFFNSessionToApiEpreuve);

  const competition: SourceCompetition = {
    id,
    lieu: detail.location || detail.ville || detail.nom || detail.name || '',
    date: detail.dateRange || detail.dates || '',
    ouverture_portes: null,
    debut_epreuves: null,
    engagements: null,
    pause: null,
    remise_recompenses: null,
    epreuves,
    created_at: '',
    source: 'liveffn',
    swimmerFound: false,
  };

  return { data: { competition } };
}

export async function fetchLiveFFNData<T>(compId: number, path: string): Promise<{ data?: T; error?: string }> {
  const { fetchLiveFFNResults, fetchLiveFFNStartList } = await import('@/data/liveffn');

  if (path.startsWith('results/')) {
    const eventId = parseInt(path.split('/')[1], 10);
    return fetchLiveFFNResults(compId, eventId) as any;
  }
  if (path.startsWith('startlist/')) {
    const eventId = parseInt(path.split('/')[1], 10);
    return fetchLiveFFNStartList(compId, eventId) as any;
  }

  return { error: 'Chemin LiveFFN inconnu' };
}

export async function fetchCompetitionParticipants(
  compId: number,
): Promise<{ data?: { participants: LiveFFNParticipant[] }; error?: string }> {
  return fetchLiveFFNParticipants(compId);
}

export function findSwimmerByName(
  participants: LiveFFNParticipant[],
  prenom: string,
  nom: string,
): LiveFFNParticipant | undefined {
  return participants.find(
    p => namesMatch(prenom, nom, p.prenom, p.nom),
  );
}
