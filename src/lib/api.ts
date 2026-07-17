/**
 * Client API REST pour communiquer avec le serveur backend Bancalais Natation.
 *
 * Ce module centralise toutes les communications réseau avec le backend :
 * - Authentification JWT : stockage sécurisé des tokens (SecureStore/native, localStorage/web)
 * - Fonctions d'appel API regroupées par domaine :
 *     • Auth : login, register, getMe, updateMe
 *     • Clubs : fetchClubs, lookupClub
 *     • Admin : gestion des utilisateurs, clubs, compétitions, epreuves, PBs
 *     • Compétitions : liste, détail, inscription/désinscription aux épreuves
 *     • Notifications : liste, lecture, compteur, création, suppression
 *     • PBs (Personal Bests) : consultation et gestion des temps personnels
 *     • Feedback : ressenti nageur après compétition
 *     • Monitoring : statut du serveur (CPU, RAM, batterie)
 *
 * Architecture :
 *   - Fonction générique apiFetch<T>() : gère headers, timeout, erreurs
 *   - Stockage cross-platform du token via l'objet storage (SecureStore + localStorage)
 *   - Toutes les fonctions retournent { data?: T; error?: string }
 *   - Le timeout par défaut est de 10 secondes
 */

import type { UserRole } from '@/data/auth';
import { Platform } from 'react-native';

// --- Configuration ---

const TOKEN_KEY = 'bancalais_jwt';
const REFRESH_TOKEN_KEY = 'bancalais_refresh_jwt';

// Surchargeable via EXPO_PUBLIC_API_HOST
// Par défaut : IP locale du serveur pour accès depuis le réseau local
const DEV_API_HOST = process.env.EXPO_PUBLIC_API_HOST || 'bancalais.freeboxos.fr';

const API_PROTOCOL = __DEV__ ? 'http' : 'https';
export const API_BASE_URL = `${API_PROTOCOL}://${DEV_API_HOST}:4000`;

// --- Stockage cross-platform du token JWT ---
// SecureStore sur les plateformes natives (iOS/Android), localStorage sur web
// Import dynamique pour éviter les erreurs côté serveur ou en environnement non supporté
const storage = {
  async get(key: string): Promise<string | null> {
    try {
      const { getItemAsync } = await import('expo-secure-store');
      return await getItemAsync(key);
    } catch {
      try { return localStorage.getItem(key); } catch { return null; }
    }
  },
  async set(key: string, value: string) {
    try {
      const { setItemAsync } = await import('expo-secure-store');
      await setItemAsync(key, value);
    } catch {
      try { localStorage.setItem(key, value); } catch {}
    }
  },
  async remove(key: string) {
    try {
      const { deleteItemAsync } = await import('expo-secure-store');
      await deleteItemAsync(key);
    } catch {
      try { localStorage.removeItem(key); } catch {}
    }
  },
};

// --- Helpers de gestion du token JWT ---

export async function getToken(): Promise<string | null> {
  return storage.get(TOKEN_KEY);
}

export async function setToken(token: string) {
  await storage.set(TOKEN_KEY, token);
}

export async function removeToken() {
  await storage.remove(TOKEN_KEY);
}

// --- Refresh token helpers ---

export async function getRefreshToken(): Promise<string | null> {
  return storage.get(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string) {
  await storage.set(REFRESH_TOKEN_KEY, token);
}

export async function removeRefreshToken() {
  await storage.remove(REFRESH_TOKEN_KEY);
}

// --- Refresh token logic ---

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const body = await res.json();
    if (!res.ok || !body.token) return null;
    await setToken(body.token);
    if (body.refreshToken) await setRefreshToken(body.refreshToken);
    return body.token;
  } catch {
    return null;
  }
}

// --- Token refresh logic ---

export type LoginResponse = {
  token: string;
  refreshToken: string;
  user: ApiProfile;
};

// --- Fonction utilitaire : timeout pour les requêtes API ---
// Rejette avec un message explicite si le serveur ne répond pas à temps
function timeoutPromise(ms: number) {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Connexion au serveur impossible (délai dépassé)')), ms);
  });
}

// --- Fonction générique d'appel API ---
// Gère automatiquement : en-tête Content-Type, token JWT d'authentification,
// timeout configurable, parsing JSON, et gestion des erreurs HTTP/réseau.
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 10000,
  _retried = false,
): Promise<{ data?: T; error?: string }> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  // Ajouter le token d'authentification si disponible
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    // Course entre la requête fetch et le timeout
    const res = await Promise.race([
      fetch(`${API_BASE_URL}${path}`, { ...options, headers }),
      timeoutPromise(timeoutMs),
    ]);

    const body = await res.json();

    if (res.status === 401 && !_retried && !path.includes('/api/auth/')) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return apiFetch<T>(path, options, timeoutMs, true);
      }
      await removeToken();
      await removeRefreshToken();
      return { error: 'Session expirée, veuillez vous reconnecter' };
    }

    if (!res.ok) {
      return { error: body.error ?? `Erreur ${res.status}` };
    }

    return { data: body as T };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau';
    return { error: message };
  }
}

// --- Types API : Profil utilisateur ---
// Format snake_case tel que retourné par le backend
export type ApiProfile = {
  id: number;
  email: string;
  prenom: string;
  nom: string;
  role: UserRole;
  bio: string;
  avatar: string;
  club_id: number | null;
  referral_code_used: string | null;
  joined_at: string;
  message_notifications: boolean;
  announcement_notifications: boolean;
  event_notifications: boolean;
  mention_notifications: boolean;
  invite_notifications: boolean;
  reminder_delay?: number;
};

export type RegisterBody = {
  email: string;
  password: string;
  prenom: string;
  nom: string;
  role: UserRole;
  referral_code?: string;
};

// ═══════════════════════════════════════════════════════════════
// AUTH : inscription, connexion, profil utilisateur
// ═══════════════════════════════════════════════════════════════

export async function loginAPI(email: string, password: string) {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerAPI(body: RegisterBody) {
  return apiFetch<LoginResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getMe() {
  return apiFetch<{ user: ApiProfile }>('/api/auth/me');
}

export async function updateMe(data: Record<string, unknown>) {
  return apiFetch<{ user: ApiProfile }>('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// --- Types API : Clubs ---
export type ApiClub = {
  id: number;
  name: string;
  city: string;
  referral_code: string;
  logo_url: string | null;
  referral_active: boolean;
};

// ═══════════════════════════════════════════════════════════════
// CLUBS : recherche et consultation
// ═══════════════════════════════════════════════════════════════

export async function fetchClubs() {
  return apiFetch<{ clubs: ApiClub[] }>('/api/auth/clubs');
}

// Recherche d'un club par son code de parrainage
export async function lookupClub(code: string) {
  return apiFetch<{ club: ApiClub }>(`/api/auth/club/${encodeURIComponent(code)}`);
}

// ═══════════════════════════════════════════════════════════════
// ADMIN : gestion des utilisateurs
// ═══════════════════════════════════════════════════════════════

export async function adminFetchUsers() {
  return apiFetch<{ users: ApiProfile[] }>('/api/admin/users');
}

export async function adminFetchUser(id: number) {
  return apiFetch<{ user: ApiProfile }>(`/api/admin/users/${id}`);
}

export async function adminUpdateUser(id: number, data: Record<string, unknown>) {
  return apiFetch<{ user: ApiProfile }>(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ═══════════════════════════════════════════════════════════════
// ADMIN : gestion des clubs
// ═══════════════════════════════════════════════════════════════

export async function adminFetchClubs() {
  return apiFetch<{ clubs: ApiClub[] }>('/api/admin/clubs');
}

export async function adminCreateClub(data: { name: string; city: string; referral_code: string; logo_url?: string | null }) {
  return apiFetch<{ club: ApiClub }>('/api/admin/clubs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminUpdateClub(id: number, data: Record<string, unknown>) {
  return apiFetch<{ club: ApiClub }>(`/api/admin/clubs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Upload du logo d'un club — gestion spécifique du FormData
 * Différencie le comportement web (Blob) et natif (uri) pour l'upload d'image.
 * Timeout étendu à 15 secondes pour les uploads.
 */
export async function adminUploadClubLogo(id: number, uri: string) {
  const token = await getToken();
  const formData = new FormData();
  const filename = uri.split('/').pop() ?? 'logo.jpg';
  const ext = filename.split('.').pop() ?? 'jpg';
  const mime = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  if (Platform.OS === 'web') {
    // Sur web, récupérer le blob depuis l'URI
    const resp = await fetch(uri);
    const blob = await resp.blob();
    formData.append('logo', blob, filename);
  } else {
    // Sur natif, passer directement l'objet avec uri/name/type
    formData.append('logo', { uri, name: filename, type: mime } as any);
  }

  try {
    const res = await Promise.race([
      fetch(`${API_BASE_URL}/api/admin/clubs/${id}/logo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }),
      timeoutPromise(15000),
    ]) as Response;
    const body = await res.json();
    if (!res.ok) return { error: body.error ?? 'Erreur upload' };
    return { data: body as { club: ApiClub } };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Erreur réseau' };
  }
}

// ═══════════════════════════════════════════════════════════════
// COMPÉTITIONS : épreuves et inscriptions
// ═══════════════════════════════════════════════════════════════

// Types pour les épreuves de compétition
export type ApiEpreuve = {
  id: number;
  competition_id: number;
  heure: string;
  nage: string;
  type_nage: 'crawl' | 'dos' | 'brass' | 'pap';
  ordre: number;
  inscription: {
    temps_engagement: string | null;
    nouveau_temps: string | null;
  } | null;
};

export type ApiCompetition = {
  id: number;
  lieu: string;
  date: string;
  ouverture_portes: string | null;
  debut_epreuves: string | null;
  engagements: string | null;
  pause: string | null;
  remise_recompenses: string | null;
  epreuves: ApiEpreuve[];
  created_at: string;
};

// Liste de toutes les compétitions
export async function fetchCompetitions() {
  return apiFetch<{ competitions: ApiCompetition[] }>('/api/competitions');
}

// Détail d'une compétition spécifique avec ses épreuves
export async function fetchCompetition(id: number) {
  return apiFetch<{ competition: ApiCompetition }>(`/api/competitions/${id}`);
}

// Inscription à une épreuve (avec temps d'engagement optionnel)
export async function inscrireEpreuve(competitionId: number, epreuve_id: number, temps_engagement?: string) {
  return apiFetch<{ inscription: { id: number } }>(`/api/competitions/${competitionId}/inscrire`, {
    method: 'POST',
    body: JSON.stringify({ epreuve_id, temps_engagement }),
  });
}

// Désinscription d'une épreuve
export async function desinscrireEpreuve(competitionId: number, epreuve_id: number) {
  return apiFetch<{ success: boolean }>(`/api/competitions/${competitionId}/desinscrire`, {
    method: 'DELETE',
    body: JSON.stringify({ epreuve_id }),
  });
}

// ═══════════════════════════════════════════════════════════════
// ADMIN : gestion des compétitions et épreuves
// ═══════════════════════════════════════════════════════════════

// Type pour les inscriptions aux compétitions (côté admin)
export type ApiCompetitionInscription = {
  id: number;
  swimmer: { id: number; prenom: string; nom: string; email: string; club_id: number | null };
  temps_engagement: string | null;
  nouveau_temps: string | null;
  created_at: string;
};

// Création d'une nouvelle compétition
export async function adminCreateCompetition(data: {
  lieu: string; date: string; ouverture_portes?: string; debut_epreuves?: string;
  engagements?: string; pause?: string; remise_recompenses?: string;
}) {
  return apiFetch<{ competition: ApiCompetition }>('/api/admin/competitions', {
    method: 'POST', body: JSON.stringify(data),
  });
}

// Mise à jour d'une compétition existante
export async function adminUpdateCompetition(id: number, data: Record<string, unknown>) {
  return apiFetch<{ competition: ApiCompetition }>(`/api/admin/competitions/${id}`, {
    method: 'PATCH', body: JSON.stringify(data),
  });
}

// Suppression d'une compétition
export async function adminDeleteCompetition(id: number) {
  return apiFetch<{ success: boolean }>(`/api/admin/competitions/${id}`, { method: 'DELETE' });
}

// --- Gestion des épreuves (CRUD) ---

// Création d'une épreuve dans une compétition
export async function adminCreateEpreuve(competitionId: number, data: { heure?: string; nage: string; type_nage: string; ordre: number }) {
  return apiFetch<{ epreuve: ApiEpreuve }>(`/api/admin/competitions/${competitionId}/epreuves`, {
    method: 'POST', body: JSON.stringify(data),
  });
}

// Mise à jour d'une épreuve
export async function adminUpdateEpreuve(id: number, data: Record<string, unknown>) {
  return apiFetch<{ epreuve: ApiEpreuve }>(`/api/admin/competitions/epreuves/${id}`, {
    method: 'PATCH', body: JSON.stringify(data),
  });
}

// Suppression d'une épreuve
export async function adminDeleteEpreuve(id: number) {
  return apiFetch<{ success: boolean }>(`/api/admin/competitions/epreuves/${id}`, { method: 'DELETE' });
}

// Consultation des inscriptions à une compétition (côté admin)
export async function adminFetchInscriptions(competitionId: number) {
  return apiFetch<{ inscriptions: ApiCompetitionInscription[] }>(`/api/admin/competitions/${competitionId}/inscriptions`);
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS : consultation, marquage, création
// ═══════════════════════════════════════════════════════════════

// Types pour les notifications
export type ApiNotification = {
  id: number;
  type: 'coach' | 'system' | 'reminder';
  title: string;
  body: string;
  sender_id: number | null;
  club_id: number | null;
  target_role: string | null;
  link: string | null;
  read_by: number[];
  created_at: string;
};

// Récupérer toutes les notifications de l'utilisateur
export async function fetchNotifications() {
  return apiFetch<{ notifications: ApiNotification[] }>('/api/notifications');
}

// Marquer une notification comme lue
export async function markNotificationRead(id: number) {
  return apiFetch<{ success: boolean }>('/api/notifications/read', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

// Marquer toutes les notifications comme lues
export async function markAllNotificationsRead() {
  return apiFetch<{ success: boolean }>('/api/notifications/read-all', {
    method: 'POST',
  });
}

// Récupérer le compteur de notifications non lues (pour le badge)
export async function fetchUnreadCount() {
  return apiFetch<{ count: number }>('/api/notifications/unread-count');
}

// Créer une nouvelle notification (coach, système ou rappel)
export async function createNotification(data: {
  type: 'coach' | 'system' | 'reminder';
  title: string;
  body: string;
  club_id?: number | null;
  target_role?: string | null;
  link?: string | null;
}) {
  return apiFetch<{ notification: ApiNotification }>('/api/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Supprimer une notification
export async function deleteNotification(id: number) {
  return apiFetch<{ success: boolean }>(`/api/notifications/${id}`, {
    method: 'DELETE',
  });
}

// ═══════════════════════════════════════════════════════════════
// PBs (Personal Bests) : temps personnels des nageurs
// ═══════════════════════════════════════════════════════════════

export type ApiPB = {
  id: number;
  swimmer_id: number;
  nage: string;
  type_nage: 'crawl' | 'dos' | 'brass' | 'pap';
  temps: string;
  created_at: string;
  updated_at: string;
};

// Récupérer les PBs de l'utilisateur connecté
export async function fetchMyPBs() {
  return apiFetch<{ pbs: ApiPB[] }>('/api/auth/pbs');
}

// --- Fonctions admin pour la gestion des PBs ---

// Récupérer les PBs d'un nageur spécifique (admin)
export async function adminFetchPBs(userId: number) {
  return apiFetch<{ pbs: ApiPB[] }>(`/api/admin/pbs/${userId}`);
}

// Créer ou mettre à jour un PB (upsert) pour un nageur
export async function adminUpsertPB(userId: number, data: { nage: string; type_nage: string; temps: string }) {
  return apiFetch<{ pb: ApiPB }>(`/api/admin/pbs/${userId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Modifier un PB existant
export async function adminUpdatePB(pbId: number, data: { nage?: string; type_nage?: string; temps?: string }) {
  return apiFetch<{ pb: ApiPB }>(`/api/admin/pbs/${pbId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Supprimer un PB
export async function adminDeletePB(pbId: number) {
  return apiFetch<{ success: boolean }>(`/api/admin/pbs/${pbId}`, {
    method: 'DELETE',
  });
}

// ═══════════════════════════════════════════════════════════════
// FEEDBACK : ressenti nageur après compétition
// ═══════════════════════════════════════════════════════════════
// Les nageurs peuvent soumettre un feedback sur leur ressenti
// lors d'un tour de compétition (points forts, axes d'amélioration)

export type ApiFeedback = {
  id: number;
  competition_id: number;
  event_id: number;
  type_tour: string;
  nage: string;
  date: string;
  nageur_iuf: number;
  ressenti: string;
  points_forts: string;
  ameliorer: string;
  created_at: string;
  updated_at: string;
};

// Enregistrer un feedback de nageur pour une épreuve
export async function saveFeedback(data: {
  competition_id: number;
  event_id: number;
  type_tour: string;
  nage: string;
  date: string;
  nageur_iuf: number;
  ressenti: string;
  points_forts: string;
  ameliorer: string;
}) {
  return apiFetch<{ feedback: ApiFeedback }>('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Récupérer le feedback d'un nageur pour une épreuve spécifique
export async function fetchFeedback(params: {
  competition_id: number;
  event_id: number;
  type_tour: string;
  nageur_iuf: number;
}) {
  const qs = new URLSearchParams({
    competition_id: String(params.competition_id),
    event_id: String(params.event_id),
    type_tour: params.type_tour,
    nageur_iuf: String(params.nageur_iuf),
  });
  return apiFetch<{ feedback: ApiFeedback | null }>(`/api/feedback?${qs.toString()}`);
}

// Récupérer tous les feedbacks d'un nageur, optionnellement filtrés par compétition
export async function fetchSwimmerFeedbacks(nageurIUF: number, competition_id?: number) {
  const qs = competition_id ? `?competition_id=${competition_id}` : '';
  return apiFetch<{ feedbacks: ApiFeedback[] }>(`/api/feedback/swimmer/${nageurIUF}${qs}`);
}

// ═══════════════════════════════════════════════════════════════
// MONITORING : statut du serveur backend
// ═══════════════════════════════════════════════════════════════
// Utilisé par l'onglet Serveur (admin uniquement) pour surveiller
// l'état du serveur : CPU, RAM, uptime, source d'alimentation

export type ServerPowerStatus = {
  source: 'ac' | 'battery' | 'unknown';
  batteryPercent?: number;
  batteryRemainingMin?: number;
  label: string;
};

export type ServerStatus = {
  timestamp: string;
  hostname: string;
  platform: string;
  arch: string;
  release: string;
  systemUptime: number;
  processUptime: number;
  loadAverage: number[];
  cpuCount: number;
  totalMem: number;
  freeMem: number;
  memUsagePercent: number;
  power: ServerPowerStatus;
};

// Récupérer le statut en temps réel du serveur
export async function fetchServerStatus() {
  return apiFetch<ServerStatus>('/api/server/status');
}
