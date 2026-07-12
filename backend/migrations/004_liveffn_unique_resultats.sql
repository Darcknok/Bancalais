-- ============================================================
-- Migration 004 : Unique constraint on results + data_hash column
-- ============================================================
-- 
-- Le problème : liveffn_resultats.id est auto-généré, donc
-- l'upsert avec onConflict: 'id' ne marche PAS (les lignes n'ont
-- pas d'id dans les données scrapées). Ça crée des doublons.
-- 
-- Solution : 
-- 1. Contrainte unique (epreuve_id, round, nageur_iuf) pour identifier
--    un résultat de manière unique.
-- 2. Colonne data_hash pour détecter les changements sans comparer
--    tout le JSON.

-- 1. Nettoyer les doublons existants avant d'ajouter la contrainte
delete from liveffn_resultats
where id in (
  select id from (
    select id, row_number() over (
      partition by epreuve_id, coalesce(round,''), coalesce(nageur_iuf,0)
      order by fetched_at desc
    ) as rn
    from liveffn_resultats
  ) dup
  where dup.rn > 1
);

-- 2. Ajouter la contrainte unique
alter table liveffn_resultats
  add constraint liveffn_resultats_unique_epreuve_round_iuf
  unique (epreuve_id, round, nageur_iuf);

-- 3. Ajouter la colonne data_hash pour le change detection
alter table liveffn_resultats
  add column if not exists data_hash text;

-- 4. Ajouter la colonne data_hash sur les autres tables aussi
alter table liveffn_competitions
  add column if not exists data_hash text;

alter table liveffn_epreuves
  add column if not exists data_hash text;

-- 5. Index pour accélérer le change detection
create index if not exists idx_liveffn_resultats_hash
  on liveffn_resultats(data_hash);
