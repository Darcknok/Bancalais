/**
 * Client Supabase (PostgreSQL) initialisé avec la clé service_role pour un accès admin aux données.
 * Ce client contourne le Row-Level Security (RLS) — utilisé uniquement côté serveur.
 */
import { createClient } from '@supabase/supabase-js';
import { config } from './config';

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: {
      // Inutile de rafraîchir les tokens côté serveur (pas de session utilisateur persistée)
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
