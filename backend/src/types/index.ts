export type UserRole = 'swimmer' | 'coach' | 'admin';

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
};

export type Club = {
  id: number;
  name: string;
  city: string;
  referral_code: string;
  logo_url: string | null;
  created_at: string;
};

export type SafeProfile = Omit<Profile, 'hashed_password'>;

export type LoginBody = {
  email: string;
  password: string;
};

export type RegisterBody = {
  email: string;
  password: string;
  prenom: string;
  nom: string;
  role: UserRole;
  referral_code?: string;
};

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
