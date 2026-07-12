/**
 * Types et helpers pour la gestion des données utilisateur côté mobile — Bancalais Natation.
 *
 * Ce module définit :
 * - UserRole : les rôles possibles (nageur, coach, admin)
 * - NotificationPreferences : préférences de notification de l'utilisateur
 * - AppUser : type principal de l'utilisateur au format applicatif (camelCase)
 *
 * Fonctions de conversion :
 * - profileToUser() : convertit le format API (snake_case) → format applicatif (camelCase)
 * - userToProfile() : convertit le format applicatif (camelCase) → format API (snake_case)
 *
 * Cette couche d'abstraction permet de travailler avec des noms de propriétés
 * conformes aux conventions TypeScript dans toute l'application, tout en
 * communiquant avec le backend qui utilise le snake_case.
 */

// --- Types fondamentaux ---

/** Rôles utilisateurs dans l'application */
export type UserRole = 'swimmer' | 'coach' | 'admin';

/** Préférences de notification de l'utilisateur */
export type NotificationPreferences = {
  messages: boolean;
  announcements: boolean;
  eventReminders: boolean;
  mentions: boolean;
  clubInvites: boolean;
  /** Délai en minutes avant une course pour envoyer un rappel */
  reminderDelay: number;
};

/** Type principal de l'utilisateur côté applicatif (camelCase) */
export type AppUser = {
  id: number;
  email: string;
  prenom: string;
  nom: string;
  role: UserRole;
  bio: string;
  avatar: string;
  clubId: number | null;
  referralCodeUsed: string | null;
  joinedAt: string;
  preferences: NotificationPreferences;
};

// --- Valeurs par défaut ---
// Utilisées en l'absence de données du serveur pour les préférences
const defaultPreferences: NotificationPreferences = {
  messages: true,
  announcements: true,
  eventReminders: true,
  mentions: true,
  clubInvites: true,
  reminderDelay: 10, // 10 minutes avant la course par défaut
};

// --- Fonctions de conversion API ↔ Applicatif ---

/**
 * Convertit un profil API (snake_case) en AppUser (camelCase).
 * Gère les valeurs null/undefined avec des fallbacks cohérents.
 */
export function profileToUser(profile: any): AppUser {
  return {
    id: profile.id,
    email: profile.email,
    prenom: profile.prenom,
    nom: profile.nom,
    role: profile.role,
    bio: profile.bio ?? '',
    avatar: profile.avatar ?? 'person',
    clubId: profile.club_id ?? null,
    referralCodeUsed: profile.referral_code_used ?? null,
    joinedAt: profile.joined_at,
    preferences: {
      messages: profile.message_notifications ?? true,
      announcements: profile.announcement_notifications ?? true,
      eventReminders: profile.event_notifications ?? true,
      mentions: profile.mention_notifications ?? true,
      clubInvites: profile.invite_notifications ?? true,
      reminderDelay: profile.reminder_delay ?? 10,
    },
  };
}

/**
 * Convertit un objet AppUser partiel (camelCase) en objet API (snake_case).
 * Ne copie que les propriétés présentes pour permettre des mises à jour partielles.
 * Utilisé avant d'envoyer des données au serveur via updateMe().
 */
export function userToProfile(user: Partial<AppUser>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  // Champs simples : pas de conversion nécessaire (prenom, nom, bio, avatar)
  if (user.prenom !== undefined) out.prenom = user.prenom;
  if (user.nom !== undefined) out.nom = user.nom;
  if (user.bio !== undefined) out.bio = user.bio;
  if (user.avatar !== undefined) out.avatar = user.avatar;
  // Conversion camelCase → snake_case pour les champs avec underscore
  if (user.clubId !== undefined) out.club_id = user.clubId;
  if (user.referralCodeUsed !== undefined) out.referral_code_used = user.referralCodeUsed;
  // Conversion imbriquée des préférences de notification
  if (user.preferences !== undefined) {
    out.message_notifications = user.preferences.messages;
    out.announcement_notifications = user.preferences.announcements;
    out.event_notifications = user.preferences.eventReminders;
    out.mention_notifications = user.preferences.mentions;
    out.invite_notifications = user.preferences.clubInvites;
    out.reminder_delay = user.preferences.reminderDelay;
  }
  return out;
}


