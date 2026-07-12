-- ============================================================
-- Migration 006 : Tables manquantes + colonne referral_active
-- ============================================================
-- Ces tables sont référencées par les routes mais absentes des migrations précédentes.

-- 1. Ajouter la colonne referral_active sur clubs (utilisée par auth + admin)
alter table clubs
  add column if not exists referral_active boolean default true;

-- 2. Table pbs (records personnels des nageurs)
create table if not exists pbs (
  id            bigint generated always as identity primary key,
  swimmer_id    bigint not null references profiles(id) on delete cascade,
  nage          text not null,
  type_nage     text not null check (type_nage in ('crawl', 'dos', 'brass', 'pap')),
  temps         text not null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create unique index if not exists idx_pbs_swimmer_nage
  on pbs(swimmer_id, nage);

-- 3. Table competitions
create table if not exists competitions (
  id                  bigint generated always as identity primary key,
  lieu                text not null,
  date                text not null,
  ouverture_portes    text,
  debut_epreuves      text,
  engagements         text,
  pause               text,
  remise_recompenses  text,
  created_at          timestamptz default now()
);

-- 4. Table competition_epreuves
create table if not exists competition_epreuves (
  id              bigint generated always as identity primary key,
  competition_id  bigint not null references competitions(id) on delete cascade,
  heure           text,
  nage            text not null,
  type_nage       text not null check (type_nage in ('crawl', 'dos', 'brass', 'pap')),
  ordre           integer not null,
  created_at      timestamptz default now()
);

create index if not exists idx_competition_epreuves_comp
  on competition_epreuves(competition_id);

-- 5. Table competition_inscriptions
create table if not exists competition_inscriptions (
  id                bigint generated always as identity primary key,
  epreuve_id        bigint not null references competition_epreuves(id) on delete cascade,
  swimmer_id        bigint not null references profiles(id) on delete cascade,
  temps_engagement  text,
  nouveau_temps     text,
  created_at        timestamptz default now()
);

create unique index if not exists idx_competition_inscriptions_unique
  on competition_inscriptions(epreuve_id, swimmer_id);

create index if not exists idx_competition_inscriptions_swimmer
  on competition_inscriptions(swimmer_id);

-- 6. Table notifications
create table if not exists notifications (
  id            bigint generated always as identity primary key,
  type          text not null check (type in ('coach', 'system', 'reminder')),
  title         text not null,
  body          text not null,
  sender_id     bigint references profiles(id) on delete set null,
  club_id       bigint references clubs(id) on delete cascade,
  target_role   text,
  link          text,
  read_by       bigint[] default '{}',
  created_at    timestamptz default now()
);

create index if not exists idx_notifications_club
  on notifications(club_id);

create index if not exists idx_notifications_sender
  on notifications(sender_id);
