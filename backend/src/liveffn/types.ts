// ─── LiveFFN Types ───────────────────────────────────────────────
// Reverse-engineered from liveffn.com HTML structure

export type Niveau = 'National' | 'Régional' | 'Départemental';
export type Bassin = '25m' | '50m';
export type Genre = 'M' | 'F';

/** Compétition listée sur la page d'accueil LiveFFN */
export interface LiveFFNCompetition {
  id: number;
  nom: string;
  lieu: string;
  bassin: Bassin;
  niveau: Niveau;
  dateDebut: string | null;   // ISO date
  dateFin: string | null;     // ISO date (null = 1-day event)
  engagements: number | null;
  nageurs: number | null;
  imageUrl: string;
  lien: string;
}

/** Informations détaillées d'une compétition */
export interface LiveFFNCompetitionDetail {
  id: number;
  name: string;
  location: string;
  poolLength: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  posterUrl: string;
  partners: LiveFFNPartner[];
  organizerUrl?: string;
}

export interface LiveFFNPartner {
  id: number;
  imageUrl: string;
}

/** Participant dans une compétition (via liste des participants) */
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

/** Nageur (via iuf) */
export interface LiveFFNSwimmer {
  iuf: number;
  lastName: string;
  firstName: string;
  fullName: string;
  birthYear: number;
  nationality: string;
  clubId: number;
  clubName: string;
}

/** Club/Structure */
export interface LiveFFNClub {
  id: number;
  federationCode?: string;
  name: string;
  region?: string;
  regionCode?: number;
  department?: string;
  departmentCode?: number;
  isForeign: boolean;
}

/** Type d'item dans le programme (ordre original HTML) */
export type ProgramItemKind = 'debutEpreuve' | 'sport' | 'nonSportif';

/** Item du programme dans l'ordre original (sport + annotations) */
export interface ProgramItem {
  kind: ProgramItemKind;
  label: string;           // "Second echauffement", "Ouverture des portes : 07h30"
  epreuve?: LiveFFNEvent;  // seulement pour kind='sport'
  sessionNumero: number;   // session de rattachement pour filtrage nageur
}

/** Session/Réunion dans le programme */
export interface LiveFFNSession {
  numero: number;
  date: string;             // "Samedi 27 Juin 2026"
  ouverturePortes: string;  // "07h30"
  epreuves: LiveFFNEvent[];
  eventsNonSportifs: string[];
  items: ProgramItem[];     // ordre original du HTML (sport + annotations)
}

/** Épreuve dans le programme */
export interface LiveFFNEvent {
  id: number;               // epreuve param
  heure: string;            // "09h30"
  nom: string;              // "50 Papillon Messieurs"
  genre: Genre;
  typeTour: string;         // "Séries", "Finale A", "Finale B", "Finale C"
  typId: number;            // 60=Séries, 11=Finale A, 12=B, 13=C...
  eprId: number;            // internal epreuve id
  catId: number;
  numEpreuve: number;
  nbSeries?: number;
  nbParticipants?: number;
}

/** Entrée de startlist (engagement) */
export interface LiveFFNStartListEntry {
  rank: number;
  swimmer: LiveFFNSwimmer;
  entryTime: string;        // "00:24.49" or "59:59.99"
  heat?: number;
  lane?: number;
  eventDate?: string;
  eventTime?: string;
}

/** Résultat d'un nageur sur une épreuve */
export interface LiveFFNRaceResult {
  eventId: number;
  eventName: string;
  round: string;
  place: string;            // "1er", "6e", "---"
  time: string;             // "00:48.82" or "--:--.--"
  reactionTime?: string;    // "+0.63"
  points?: number;
  splits?: LiveFFNSplit[];
  remark?: string;
  swimmer?: LiveFFNSwimmer;
}

export interface LiveFFNSplit {
  distance: number;
  splitTime: string;
  lapTime: string;
  cumulativeTime?: string;
}

/** Résumé d'épreuve (stats de startlist) */
export interface LiveFFNEventSummary {
  eventId: number;
  name: string;
  gender: Genre;
  totalSwimmers: number;
  totalHeats: number;
  firstTime: string;
  eighthTime: string;
  lastTime: string;
}

/** Données live (temps réel) */
export interface LiveFFNLiveData {
  eventId: number;
  eventName: string;
  round: string;
  results: LiveFFNRaceResult[];
  lastUpdate: string;
  isLive: boolean;
}

// ─── Cache types ─────────────────────────────────────────────────

export interface CacheEntry<T> {
  data: T;
  fetchedAt: string;
  expiresAt: string;
}

export type CacheKey = 
  | `competition_list`
  | `competition_${number}`
  | `competition_${number}_program`
  | `competition_${number}_events`
  | `competition_${number}_participants`
  | `competition_${number}_results_${number}`
  | `competition_${number}_startlist_${number}`
  | `swimmer_${number}`
  | `club_${number}`;

// ─── API response types ──────────────────────────────────────────

export interface LiveFFNCompetitionsResponse {
  competitions: LiveFFNCompetition[];
  fetchedAt: string;
}

export interface LiveFFNCompetitionDetailResponse {
  competition: LiveFFNCompetitionDetail;
  fetchedAt: string;
}

export interface LiveFFNProgramResponse {
  sessions: LiveFFNSession[];
  fetchedAt: string;
}

export interface LiveFFNEventResultsResponse {
  event: {
    id: number;
    name: string;
    gender: Genre;
    rounds: {
      name: string;
      typId: number;
      results: LiveFFNRaceResult[];
    }[];
  };
  fetchedAt: string;
}
