/**
 * Types TypeScript partagés pour le serveur Bancalais Natation.
 * Définit les structures de données (Profile, Club, Notification, JWT)
 * utilisées par les routes et middlewares.
 */

// --- Rôles utilisateur ---
// swimmer : nageur·euse, coach : entraîneur·euse, admin : administrateur club
export type UserRole = 'swimmer' | 'coach' | 'admin';

// --- Modèle principal : Profil utilisateur ---
export type Profile = {
  id: number;
  email: string;
  hashed_password: string;
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
  reminder_delay: number;
};

// --- Modèle : Club de natation ---
// Chaque club possède un code de parrainage unique pour l'inscription des membres
export type Club = {
  id: number;
  name: string;
  city: string;
  referral_code: string;
  logo_url: string | null;
  created_at: string;
};

// Profil sans le mot de passe hashé — ce type est envoyé au client (API publique)
export type SafeProfile = Omit<Profile, 'hashed_password'>;

// --- Corps de requête : Authentification ---
export type LoginBody = {
  email: string;
  password: string;
};

// L'inscription nécessite un code de parrainage valide (referral_code)
// pour rattacher le compte à un club existant
export type RegisterBody = {
  email: string;
  password: string;
  prenom: string;
  nom: string;
  role: UserRole;
  referral_code?: string;
};

// --- Modèle : Notification ---
// Types : coach (message entraîneur), system (annonce club), reminder (rappel entraînement)
// read_by : tableau d'IDs des utilisateurs ayant lu la notification
export type Notification = {
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

// --- Payload JWT signé par le serveur ---
// sub : ID utilisateur Supabase, user_role : rôle applicatif, club_id : rattachement club
export type JwtPayload = {
  sub: string;
  role: 'authenticated';
  aud: 'authenticated';
  club_id: number | null;
  user_role: UserRole;
  email: string;
  iat: number;
  exp: number;
};
