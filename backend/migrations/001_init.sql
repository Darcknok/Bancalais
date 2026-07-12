-- ============================================================
-- Migration 001 : Tables clubs + profiles
-- ============================================================

-- 1. Clubs
create table if not exists clubs (
  id            bigint generated always as identity primary key,
  name          text not null,
  city          text not null,
  referral_code text not null unique,
  logo_url      text,
  created_at    timestamptz default now()
);

-- 2. Profils utilisateur (auth gérée par Express, pas Supabase Auth)
create table if not exists profiles (
  id            bigint generated always as identity primary key,
  email         text not null unique,
  hashed_password text not null,
  prenom        text not null,
  nom           text not null,
  role          text not null check (role in ('swimmer', 'coach', 'admin')),
  bio           text default '',
  avatar        text default 'person',
  club_id       bigint references clubs(id) on delete set null,
  referral_code_used text,
  joined_at     timestamptz default now(),
  message_notifications    boolean default true,
  announcement_notifications boolean default true,
  event_notifications      boolean default true,
  mention_notifications    boolean default true,
  invite_notifications     boolean default true
);

-- Index pour les recherches fréquentes
create index if not exists idx_profiles_email on profiles(email);
create index if not exists idx_profiles_club_id on profiles(club_id);
create index if not exists idx_clubs_referral_code on clubs(referral_code);

-- ============================================================
-- Seed data : 4 clubs + utilisateurs de démo
-- ============================================================

insert into clubs (name, city, referral_code) values
  ('CN Bancalais', 'Chalon-sur-Saône', 'CNB-2026'),
  ('CN Mâcon', 'Mâcon', 'CNM-2026'),
  ('Dauphins Dijonnais', 'Dijon', 'DAUPH-2026'),
  ('Stade Laurentin Natation', 'Saint-Laurent-du-Var', 'SLN-2026')
on conflict (referral_code) do nothing;

-- Utilisateur de démo : Mathias (mdp "123456")
insert into profiles (email, hashed_password, prenom, nom, role, avatar, club_id) values
  ('mathias@test.com', '$2a$10$9taRF8kdIIoTMBBdOJiVxenzUM6dW00Afo3oWMfMrS0kEm9.NIi7.', 'Mathias', 'Durand', 'swimmer', 'person', 1)
on conflict (email) do nothing;
