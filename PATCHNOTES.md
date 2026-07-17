# Patch Notes

## v1.1.0 — Audit Sécurité & Corrections Critiques (2026-07-17)

### Audit
Audit de sécurité complet réalisé par 5 agents d'audit (auth, BDD, frontend, scraping, infra) suivi d'une équipe de 3 développeurs + 1 inspecteur.

**52 vulnérabilités identifiées → 19 corrections critiques/hautes/moyennes appliquées.**

---

### Sécurité Authentification

| Sévérité | Correction |
|----------|------------|
| **Critique** | Auto-inscription : rôle `admin` retiré des rôles autorisés. Seuls `swimmer` et `coach` sont acceptés. |
| **Haute** | JWT : algorithme verrouillé sur `HS256` (prévention attaque `alg:none`). |
| **Haute** | JWT : durée de vie réduite de 30 jours à 1 heure. Ajout de refresh tokens (30 jours) avec endpoint `/api/auth/refresh`. |
| **Haute** | Login : messages d'erreur unifiés (`"Identifiants incorrects"`) pour empêcher l'énumération de comptes. |
| **Moyenne** | Sub JWT : validation `NaN` ajoutée après `parseInt` pour éviter les requêtes avec un userId invalide. |

### Sécurité Mots de Passe

| Sévérité | Correction |
|----------|------------|
| **Haute** | Politique renforcée : minimum 8 caractères, 1 majuscule, 1 chiffre (côté client ET serveur). |

### Sécurité Routes & Permissions

| Sévérité | Correction |
|----------|------------|
| **Critique** | `race_feedback` : les nageurs ne peuvent créer/lire que leur propre feedback (vérification `nageur_iuf === userId`). |
| **Haute** | Notifications système : réservées aux admins uniquement. |
| **Haute** | Notifications : le `club_id` est forcé au club de l'appelant pour les coaches (pas d'impersonation cross-club). |
| **Haute** | Notifications : vérification du club sur lecture/suppression (IDOR corrigé). |
| **Haute** | Notifications : suppression d'une notification système réservée à l'expéditeur ou un admin. |
| **Haute** | Admin PATCH : validation des valeurs de rôle (`swimmer/coach/admin`) + coaches ne peuvent pas.promouvoir en admin. |
| **Haute** | Admin : les coaches ne voient/modifient que les utilisateurs de leur propre club. |
| **Moyenne** | LiveFFN : IDs numériques validés (0–10M) sur tous les endpoints. |

### Sécurité Réseau & Infrastructure

| Sévérité | Correction |
|----------|------------|
| **Critique** | HTTPS forcé en production (`__DEV__ ? 'http' : 'https'`). |
| **Critique** | Android : `usesCleartextTraffic` désactivé (3 mécanismes corrigés). |
| **Haute** | CORS : origine `null` rejetée en production. |
| **Moyenne** | Rate limiting ajouté : login (10/15min), register (5/h), LiveFFN (30/min). Trust proxy configuré. |
| **Moyenne** | Erreurs LiveFFN : messages génériques retournés au client (plus de fuite d'infos internes). |

### Corrections Encodage & Données

| Sévérité | Correction |
|----------|------------|
| **Haute** | Fetcher : détection automatique du charset depuis le header `Content-Type` (UTF-8 par défaut au lieu d'ISO-8859-1). Les accents sur les épreuves (ex: "séries") s'affichent correctement. |
| **Haute** | Persistence : `ensureCompetitionExists()` avant sauvegarde des épreuves (FK constraint corrigée). |

### Frontend

| Correction |
|------------|
| Refresh token : flow complet (stockage, retry automatique 401, nettoyage au logout). |
| Password policy : regex côté client synchronisée avec le serveur. |
| Protocol : production force HTTPS, développement autorise HTTP. |

---

### Fichiers modifiés
`app.json`, `plugins/with-android-cleartext.js`, `src/lib/api.ts`, `src/context/auth.tsx`, `backend/src/index.ts`, `backend/src/middleware/auth.ts`, `backend/src/routes/auth.ts`, `backend/src/routes/admin.ts`, `backend/src/routes/feedback.ts`, `backend/src/routes/notifications.ts`, `backend/src/liveffn/fetcher.ts`, `backend/src/liveffn/persistence.ts`, `backend/src/liveffn/routes.ts`

### Notes
- Les clés JWT et Supabase dans `backend/.env` devraient être rotées si le repo était accessible publiquement.
- Le refresh token n'a pas de révocation server-side (nécessite Redis/blocklist pour une implémentation complète).
- Le rate limiter est en mémoire (single-instance uniquement).
