-- ============================================================
-- Migration 005 : Ajout du délai de notification personnalisé
-- ============================================================

alter table profiles
  add column if not exists reminder_delay integer default 10;
