-- ============================================================
-- Migration 002 : Cache tables for LiveFFN scraper persistence
-- ============================================================

-- liveffn_competitions : cache des compétitions LiveFFN
create table if not exists liveffn_competitions (
  id            bigint primary key, -- LiveFFN competition ID
  nom           text not null,
  ville         text not null,
  dept          text,
  bassin        text,
  date_debut    date,
  date_fin      date,
  raw_json      jsonb,             -- full parsed data cached
  fetched_at    timestamptz default now(),
  expires_at    timestamptz
);

-- liveffn_epreuves : cache des épreuves d'une compétition
create table if not exists liveffn_epreuves (
  id              bigint primary key, -- LiveFFN event ID
  competition_id  bigint not null references liveffn_competitions(id) on delete cascade,
  nom             text not null,
  genre           text check (genre in ('M','F','MIX')),
  distance        integer,
  nage            text,
  session_date    date,
  session_num     integer,
  heure_debut     text,
  raw_json        jsonb,
  fetched_at      timestamptz default now()
);

-- liveffn_resultats : cache des résultats d'épreuves
create table if not exists liveffn_resultats (
  id              bigint generated always as identity primary key,
  epreuve_id      bigint not null references liveffn_epreuves(id) on delete cascade,
  round           text,
  place           text,
  temps           text,
  nageur_nom      text,
  nageur_prenom   text,
  nageur_iuf      bigint,
  club_nom        text,
  club_id         bigint,
  points          integer,
  reaction        text,
  remarque        text,
  splits_json     jsonb,
  raw_json        jsonb,
  fetched_at      timestamptz default now()
);

-- Indexes
create index if not exists idx_liveffn_epreuves_comp on liveffn_epreuves(competition_id);
create index if not exists idx_liveffn_resultats_epreuve on liveffn_resultats(epreuve_id);
create index if not exists idx_liveffn_competitions_dates on liveffn_competitions(date_debut, date_fin);
