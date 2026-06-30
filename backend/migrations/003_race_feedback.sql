-- ============================================================
-- Migration 003 : Feedback nageur (ressenti, points forts, à améliorer)
-- ============================================================

create table if not exists race_feedback (
  id              bigint generated always as identity primary key,
  competition_id  bigint not null,
  event_id        bigint not null,
  type_tour       text not null default '',
  nage            text not null default '',
  date            text not null default '',
  nageur_iuf      bigint not null,
  ressenti        text not null default '',
  points_forts    text not null default '',
  ameliorer       text not null default '',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Unique par course + session + nageur (un seul feedback par nageur par course)
create unique index if not exists idx_race_feedback_unique
  on race_feedback(competition_id, event_id, type_tour, nageur_iuf);

-- Index pour requêtes par nageur
create index if not exists idx_race_feedback_nageur
  on race_feedback(nageur_iuf);

-- Index pour requêtes par compétition
create index if not exists idx_race_feedback_competition
  on race_feedback(competition_id);

-- RLS (optionnel — désactivé par défaut, activer si besoin)
alter table race_feedback enable row level security;

-- Policy : un nageur ne voit que ses propres feedbacks
create policy "nageur_own_feedback"
  on race_feedback
  for all
  using (nageur_iuf = current_setting('app.nageur_iuf')::bigint);
