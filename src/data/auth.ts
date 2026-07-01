export type UserRole = 'swimmer' | 'coach' | 'admin';

export type NotificationPreferences = {
  messages: boolean;
  announcements: boolean;
  eventReminders: boolean;
  mentions: boolean;
  clubInvites: boolean;
  /** Délai en minutes avant une course pour envoyer un rappel */
  reminderDelay: number;
};

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

const defaultPreferences: NotificationPreferences = {
  messages: true,
  announcements: true,
  eventReminders: true,
  mentions: true,
  clubInvites: true,
  reminderDelay: 10,
};

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

export function userToProfile(user: Partial<AppUser>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (user.prenom !== undefined) out.prenom = user.prenom;
  if (user.nom !== undefined) out.nom = user.nom;
  if (user.bio !== undefined) out.bio = user.bio;
  if (user.avatar !== undefined) out.avatar = user.avatar;
  if (user.clubId !== undefined) out.club_id = user.clubId;
  if (user.referralCodeUsed !== undefined) out.referral_code_used = user.referralCodeUsed;
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


