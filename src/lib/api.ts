import type { UserRole } from '@/data/auth';
import { Platform } from 'react-native';

const TOKEN_KEY = 'bancalais_jwt';

// Surchargeable via EXPO_PUBLIC_API_HOST
// Par défaut : IP locale du serveur pour accès depuis le réseau local
const DEV_API_HOST = process.env.EXPO_PUBLIC_API_HOST || 'bancalais.freeboxos.fr';

export const API_BASE_URL = `http://${DEV_API_HOST}:4000`;

// Cross-platform storage : SecureStore sur native, localStorage sur web
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

export async function getToken(): Promise<string | null> {
  return storage.get(TOKEN_KEY);
}

export async function setToken(token: string) {
  await storage.set(TOKEN_KEY, token);
}

export async function removeToken() {
  await storage.remove(TOKEN_KEY);
}

function timeoutPromise(ms: number) {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Connexion au serveur impossible (délai dépassé)')), ms);
  });
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 10000,
): Promise<{ data?: T; error?: string }> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await Promise.race([
      fetch(`${API_BASE_URL}${path}`, { ...options, headers }),
      timeoutPromise(timeoutMs),
    ]);

    const body = await res.json();

    if (!res.ok) {
      return { error: body.error ?? `Erreur ${res.status}` };
    }

    return { data: body as T };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau';
    return { error: message };
  }
}

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
};

export type LoginResponse = {
  token: string;
  user: ApiProfile;
};

export type RegisterBody = {
  email: string;
  password: string;
  prenom: string;
  nom: string;
  role: UserRole;
  referral_code?: string;
};

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

export type ApiClub = {
  id: number;
  name: string;
  city: string;
  referral_code: string;
  logo_url: string | null;
  referral_active: boolean;
};

export async function fetchClubs() {
  return apiFetch<{ clubs: ApiClub[] }>('/api/auth/clubs');
}

export async function lookupClub(code: string) {
  return apiFetch<{ club: ApiClub }>(`/api/auth/club/${encodeURIComponent(code)}`);
}

// --- Admin endpoints ---

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

export async function adminUploadClubLogo(id: number, uri: string) {
  const token = await getToken();
  const formData = new FormData();
  const filename = uri.split('/').pop() ?? 'logo.jpg';
  const ext = filename.split('.').pop() ?? 'jpg';
  const mime = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  if (Platform.OS === 'web') {
    const resp = await fetch(uri);
    const blob = await resp.blob();
    formData.append('logo', blob, filename);
  } else {
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

// --- Competitions ---

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

export async function fetchCompetitions() {
  return apiFetch<{ competitions: ApiCompetition[] }>('/api/competitions');
}

export async function fetchCompetition(id: number) {
  return apiFetch<{ competition: ApiCompetition }>(`/api/competitions/${id}`);
}

export async function inscrireEpreuve(competitionId: number, epreuve_id: number, temps_engagement?: string) {
  return apiFetch<{ inscription: { id: number } }>(`/api/competitions/${competitionId}/inscrire`, {
    method: 'POST',
    body: JSON.stringify({ epreuve_id, temps_engagement }),
  });
}

export async function desinscrireEpreuve(competitionId: number, epreuve_id: number) {
  return apiFetch<{ success: boolean }>(`/api/competitions/${competitionId}/desinscrire`, {
    method: 'DELETE',
    body: JSON.stringify({ epreuve_id }),
  });
}

// --- Admin Competitions ---

export type ApiCompetitionInscription = {
  id: number;
  swimmer: { id: number; prenom: string; nom: string; email: string; club_id: number | null };
  temps_engagement: string | null;
  nouveau_temps: string | null;
  created_at: string;
};

export async function adminCreateCompetition(data: {
  lieu: string; date: string; ouverture_portes?: string; debut_epreuves?: string;
  engagements?: string; pause?: string; remise_recompenses?: string;
}) {
  return apiFetch<{ competition: ApiCompetition }>('/api/admin/competitions', {
    method: 'POST', body: JSON.stringify(data),
  });
}

export async function adminUpdateCompetition(id: number, data: Record<string, unknown>) {
  return apiFetch<{ competition: ApiCompetition }>(`/api/admin/competitions/${id}`, {
    method: 'PATCH', body: JSON.stringify(data),
  });
}

export async function adminDeleteCompetition(id: number) {
  return apiFetch<{ success: boolean }>(`/api/admin/competitions/${id}`, { method: 'DELETE' });
}

export async function adminCreateEpreuve(competitionId: number, data: { heure?: string; nage: string; type_nage: string; ordre: number }) {
  return apiFetch<{ epreuve: ApiEpreuve }>(`/api/admin/competitions/${competitionId}/epreuves`, {
    method: 'POST', body: JSON.stringify(data),
  });
}

export async function adminUpdateEpreuve(id: number, data: Record<string, unknown>) {
  return apiFetch<{ epreuve: ApiEpreuve }>(`/api/admin/competitions/epreuves/${id}`, {
    method: 'PATCH', body: JSON.stringify(data),
  });
}

export async function adminDeleteEpreuve(id: number) {
  return apiFetch<{ success: boolean }>(`/api/admin/competitions/epreuves/${id}`, { method: 'DELETE' });
}

export async function adminFetchInscriptions(competitionId: number) {
  return apiFetch<{ inscriptions: ApiCompetitionInscription[] }>(`/api/admin/competitions/${competitionId}/inscriptions`);
}

// --- Notifications ---

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

export async function fetchNotifications() {
  return apiFetch<{ notifications: ApiNotification[] }>('/api/notifications');
}

export async function markNotificationRead(id: number) {
  return apiFetch<{ success: boolean }>('/api/notifications/read', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

export async function markAllNotificationsRead() {
  return apiFetch<{ success: boolean }>('/api/notifications/read-all', {
    method: 'POST',
  });
}

export async function fetchUnreadCount() {
  return apiFetch<{ count: number }>('/api/notifications/unread-count');
}

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

export async function deleteNotification(id: number) {
  return apiFetch<{ success: boolean }>(`/api/notifications/${id}`, {
    method: 'DELETE',
  });
}

// --- PBs ---

export type ApiPB = {
  id: number;
  swimmer_id: number;
  nage: string;
  type_nage: 'crawl' | 'dos' | 'brass' | 'pap';
  temps: string;
  created_at: string;
  updated_at: string;
};

export async function fetchMyPBs() {
  return apiFetch<{ pbs: ApiPB[] }>('/api/auth/pbs');
}

export async function adminFetchPBs(userId: number) {
  return apiFetch<{ pbs: ApiPB[] }>(`/api/admin/pbs/${userId}`);
}

export async function adminUpsertPB(userId: number, data: { nage: string; type_nage: string; temps: string }) {
  return apiFetch<{ pb: ApiPB }>(`/api/admin/pbs/${userId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminUpdatePB(pbId: number, data: { nage?: string; type_nage?: string; temps?: string }) {
  return apiFetch<{ pb: ApiPB }>(`/api/admin/pbs/${pbId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function adminDeletePB(pbId: number) {
  return apiFetch<{ success: boolean }>(`/api/admin/pbs/${pbId}`, {
    method: 'DELETE',
  });
}

// ─── Feedback (ressenti nageur) ──────────────────────────────────

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

export async function fetchSwimmerFeedbacks(nageurIUF: number, competition_id?: number) {
  const qs = competition_id ? `?competition_id=${competition_id}` : '';
  return apiFetch<{ feedbacks: ApiFeedback[] }>(`/api/feedback/swimmer/${nageurIUF}${qs}`);
}
