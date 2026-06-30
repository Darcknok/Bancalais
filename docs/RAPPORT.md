# Rapport complet — Bancalais

> Généré le 30 juin 2026

---

## 1. Ce qui a été fait

### 1.1 Backend API (Express / TypeScript)

| Module | Statut | Description |
|--------|--------|-------------|
| Auth (inscription/connexion/JWT) | ✅ Terminé | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PATCH /api/auth/me` |
| Admin CRUD | ✅ Terminé | Utilisateurs, clubs, compétitions, épreuves, inscriptions, PB — routes protégées |
| Notifications | ✅ Terminé | CRUD notifications, filtrage par rôle, marquer comme lu |
| Compétitions | ✅ Terminé | CRUD compétitions + épreuves + inscriptions |
| **LiveFFN (scraper)** | ✅ Terminé | 9 parseurs cheerio, 12 routes Express, cache mémoire |
| **Feedback nageur** | ✅ **Nouveau** | `POST/GET/DELETE /api/feedback` — persistance Supabase |
| Middleware auth | ✅ Terminé | `authMiddleware` + `requireRole()` |

### 1.2 Base de données Supabase

| Migration | Statut | Contenu |
|-----------|--------|---------|
| `001_init.sql` | ✅ Exécutée | Tables auth, clubs, notifications, PBs |
| `002_liveffn.sql` | ✅ **Exécutée** | `liveffn_competitions`, `liveffn_epreuves`, `liveffn_resultats` |
| `003_race_feedback.sql` | ⏳ **À exécuter** | `race_feedback` (ressenti, points forts, à améliorer) |

### 1.3 Frontend Mobile (Expo / React Native)

| Écran | Statut | Détails |
|-------|--------|---------|
| Inscription | ✅ Modifié | Sélecteur de rôle retiré — toujours 'swimmer' |
| Connexion | ✅ Terminé | Login avec email + mot de passe |
| Accueil | ✅ Terminé | Filtre "Mes compétitions"/"Global", par défaut local |
| Planning | ✅ Terminé | Filtrage nageur LiveFFN, sélecteur jour, aujourd'hui mis en valeur, pauses formatées, annotations session |
| **Race Feedback** | ✅ **Nouveau** | 3 champs (Ressenti, Points forts, À améliorer), AsyncStorage + API |
| Notifications | ✅ Terminé | Liste des notifications, marquer comme lu |
| Réglages | ✅ Modifié | Accès coach/admin restreint aux IDs 1 et 10 |
| Coach | ✅ Modifié | Accès restreint aux IDs 1 et 10 (au lieu de rôle coach) |
| Admin | ✅ Terminé | Panneau d'administration (utilisateurs, clubs, notifications, PB) |

### 1.4 LiveFFN — Scraper de résultats en direct

- Parsing HTML via cheerio (sites `liveffn.com`)
- 17 interfaces TypeScript, 9 parseurs spécialisés
- Cache mémoire non-bloquant
- Détection DQ/DNS/Forfait avec motif
- Sessions multiples par jour groupées
- Annotations de session filtrées par nageur
- Auto-refresh toutes les 3 minutes
- Badge "Live" vert dans RaceCard

### 1.5 Sécurité et configuration

- Chat désactivé (onglet retiré)
- Cleartext Android activé (pour développement)
- API accessible sur `0.0.0.0:4000`
- `react-test-renderer` fixé à 19.2.3 pour EAS Build

---

## 2. Ce qu'il reste à faire — Prioritaire

### ⚠️ AVANT LA SESSION DE TEST

| # | Tâche | Équipe | Détail |
|---|-------|--------|--------|
| 1 | **Exécuter `003_race_feedback.sql`** | Dev | Dashboard Supabase → SQL Editor → coller/coller `backend/migrations/003_race_feedback.sql` → Run |
| 2 | **Redémarrer le backend** | Dev | `cd backend && npm run dev` (après la migration) |
| 3 | **Build APK de test** | Dev/Com | `eas build --platform android --profile preview` |
| 4 | **Distribuer l'APK aux testeurs** | Com | Envoyer le lien EAS ou le .apk |
| 5 | **Tester le parcours complet** | QA | Voir `docs/equipes/3-inspection.md` |

### 📋 AVANT LANCEMENT PUBLIC

| # | Tâche | Équipe | Détail |
|---|-------|--------|--------|
| 6 | Activer le vrai guard admin | Dev | `config.nodeEnv !== 'production'` → `return next()` à corriger |
| 7 | Changer le JWT secret | Dev | Remplacer le fallback par une variable d'env |
| 8 | Configurer CORS prod | Dev | `origin: true` → restreindre au domaine |
| 9 | Tester dark mode tous écrans | Design | Contraster, lisibilité |
| 10 | États vides (onboarding) | Design/Redac | Illustrations + textes |
| 11 | Messages d'erreur FR | Redac | Uniformiser FR partout |
| 12 | Instructions de test | Com | Email avec lien APK + fonctionnalités |

---

## 3. Architecture technique

```
bancalais/
├── backend/
│   ├── src/
│   │   ├── index.ts              ← Point d'entrée Express
│   │   ├── config.ts             ← Variables d'env
│   │   ├── supabase.ts           ← Client Supabase
│   │   ├── middleware/auth.ts    ← JWT + requireRole
│   │   ├── routes/
│   │   │   ├── auth.ts           ← Inscription, connexion, profil
│   │   │   ├── admin.ts          ← CRUD admin
│   │   │   ├── competitions.ts   ← Compétitions club
│   │   │   ├── notifications.ts  ← Notifications
│   │   │   └── feedback.ts       ← Feedback nageur ★
│   │   ├── liveffn/              ← Scraper LiveFFN
│   │   │   ├── types.ts, parser.ts, fetcher.ts, routes.ts, cache.ts, persistence.ts
│   │   └── types/index.ts        ← Types backend
│   └── migrations/
│       ├── 001_init.sql          ← Tables de base
│       ├── 002_liveffn.sql       ← Cache LiveFFN
│       └── 003_race_feedback.sql ← Feedback nageur ★
├── src/ (mobile)
│   ├── app/
│   │   ├── (auth)/               ← Login, Register (modifié)
│   │   └── (tabs)/               ← Accueil, Planning, Notifications, Réglages, Coach, Developpeur
│   │       ├── race-feedback.tsx ← Écran feedback ★
│   │       └── coach.tsx         ← Modifié (accès par ID)
│   ├── context/auth.tsx          ← Auth context (isPrivileged ajouté)
│   ├── lib/api.ts                ← Client API (feedback endpoints)
│   └── components/               ← Composants réutilisables
└── docs/
    ├── RAPPORT.md                ← Ce fichier
    └── equipes/                  ← Plans par équipe
```

---

## 4. Équipes

| Équipe | Responsable | Fichier plan |
|--------|-------------|--------------|
| 🎨 Design | — | `docs/equipes/1-design.md` |
| 💻 Développement | — | `docs/equipes/2-developpement.md` |
| 🔍 Inspection (QA) | — | `docs/equipes/3-inspection.md` |
| ✍️ Rédaction | — | `docs/equipes/4-redaction.md` |
| 📣 Communication | — | `docs/equipes/5-communication.md` |

Chaque équipe a son propre fichier avec les tâches détaillées, les fichiers concernés, et les priorités.

---

## 5. Modifications récentes (au 30 juin 2026)

| Commit | Description |
|--------|-------------|
| `4bd30cd` | Persistance feedback en Supabase + API backend |
| `d299ad7` | Écran feedback course (Ressenti, Points forts, À améliorer) |
| `7d1dd98` | Nettoyage label début épreuve |
| `07b2f57` | Filtrage annotations de session par session du nageur |
| `d997526` | Annotations session planning + mise en valeur aujourd'hui |
| `HEAD (non commité)` | Retrait sélecteur rôle inscription + restriction dashboard aux IDs 1/10 |

---

## 6. Prochaines actions immédiates

1. ✅ **Exécuter la migration SQL** `003_race_feedback.sql` dans Supabase
2. ✅ **Redémarrer le backend**
3. ✅ **Rebuild l'APK** (`eas build --platform android --profile preview`)
4. ✅ **Lancer la session de test**
5. ❌ Itérer sur les retours QA
6. ❌ Préparer le lancement public
