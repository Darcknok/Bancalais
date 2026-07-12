# Bancalais Natation

**Application mobile de gestion de compétitions de natation** — suivez les résultats en direct, gérez vos clubs, et accompagnez vos nageurs en temps réel.

Développée avec **Expo (React Native)** pour le mobile et **Node.js/Express** pour le serveur, avec une base de données **Supabase (PostgreSQL)** et intégration **LiveFFN** pour les résultats de compétitions FFN.

---

## Architecture

```
┌─────────────────────────┐            ┌──────────────────────────────┐
│   📱 APPLICATION MOBILE  │──── REST ──▶│   🖥️ SERVEUR API (Express)  │
│   Expo / React Native   │            │   Port 4000                 │
│   src/*                 │            │   backend/src/*             │
└─────────────────────────┘            └──────────┬──────────────────┘
                                                  │
                                       ┌──────────▼──────────────┐
                                       │  Supabase (PostgreSQL)  │
                                       └─────────────────────────┘
                                       ┌─────────────────────────┐
                                       │  LiveFFN (Scraping)     │
                                       │  cheerio + cache TTL    │
                                       └─────────────────────────┘
```

---

# 📱 Application Mobile

> **Dossier :** `src/`
> **Technologie :** Expo SDK 56 / React Native / TypeScript / Expo Router

## Fonctionnalités

- **Authentification JWT** — connexion, inscription, code de parrainage club
- **Planning de compétitions** — calendrier et timeline des épreuves
- **LiveFFN** — résultats en direct des compétitions FFN
- **Feedback de course** — temps de passage, split times
- **Gestion de clubs** — adhésions, rôles (nageur / coach / admin)
- **Outils coach** — gestion des groupes d'entraînement
- **Dashboard admin** — gestion des utilisateurs et clubs
- **Notifications push** — alertes résultats et calendrier
- **Thème sombre/clair** — support automatique et manuel

## Tech Stack Mobile

| Technologie | Version |
|---|---|
| Expo | ~56.0.12 |
| React Native | 0.85.3 |
| React | 19.2.3 |
| TypeScript | ~6.0.3 |
| Expo Router | ~56.2.11 |
| React Native Reanimated | 4.3.1 |
| React Native Gesture Handler | ~2.31.1 |
| Jest (tests) | ^29.7.0 |

## Installation Mobile

```bash
# Depuis la racine du projet
npm install
npx expo start
```

Scannez le QR code avec **Expo Go** ou ouvrez dans un émulateur (`a` = Android, `i` = iOS).

## Scripts Mobile

| Commande | Description |
|---|---|
| `npx expo start` | Lance le bundler Expo |
| `npx expo start --clear` | Reset du cache |
| `npm test` | Tests unitaires |
| `npm run lint` | ESLint |

## Build APK (Production)

```bash
# Preview (APK interne)
npx eas build --platform android --profile preview

# Production (AAB pour Play Store)
npx eas build --platform android --profile production
```

## Structure Mobile

```
src/
├── app/                          # Pages Expo Router (file-based routing)
│   ├── _layout.tsx               #   Layout racine (auth, thème, notifications)
│   ├── index.tsx                 #   Page d'accueil / splash
│   ├── (auth)/                   #   Écrans d'authentification
│   │   ├── login.tsx             #     Connexion
│   │   ├── register.tsx          #     Inscription
│   │   └── club-code.tsx         #     Saisie du code club
│   └── (tabs)/                   #   Navigation par onglets
│       ├── _layout.tsx           #     Layout tabs (barre inférieure custom)
│       ├── accueil.tsx           #     Accueil
│       ├── planning.tsx          #     Planning compétitions
│       ├── notifications.tsx     #     Notifications / activité
│       ├── coach.tsx             #     Outils coach
│       ├── reglages.tsx          #     Profil et réglages
│       ├── serveur.tsx           #     Monitoring serveur (admin)
│       └── developpeur.tsx       #     Outils développeur
├── components/                   # Composants UI réutilisables
│   ├── animated-icon.tsx         #   Icône animée (native)
│   ├── animated-pressable.tsx    #   Pressable avec animation
│   ├── app-tabs.tsx              #   Barre d'onglets (native)
│   ├── double-bezel-card.tsx     #   Carte UI double cadre
│   ├── notification-scheduler.ts #   Planificateur notifications
│   ├── themed-text.tsx           #   Texte thématisé
│   ├── themed-view.tsx           #   Vue thématisée
│   └── ui/                       #   Composants UI atomiques
├── constants/
│   └── theme.ts                  # Couleurs, espacements, rayons
├── context/
│   └── auth.tsx                  # AuthContext (login, logout, rôles)
├── data/
│   ├── auth.ts                   # Types et helpers conversion (snake↔camel)
│   ├── chat.ts                   # Types chat
│   ├── competition-service.ts    # Service de récupération compétitions
│   ├── competitions.ts           # Données compétitions
│   ├── liveffn.ts                # Couche client LiveFFN
│   └── notification-messages.ts  # Templates messages notification
├── hooks/
│   ├── use-color-scheme.ts       # Détection thème (native)
│   ├── use-race-reminders.ts     # Rappels de courses
│   ├── use-theme.ts              # Hook thème
│   └── use-theme-mode.tsx        # Provider + hook thème
└── lib/
    ├── api.ts                    # Client API REST (JWT, tous les endpoints)
    ├── env.ts                    # Variables d'environnement
    ├── notifications.ts          # Initialisation notifications push
    └── reminder-storage.ts       # Stockage local rappels
```

---

# 🖥️ Serveur Backend

> **Dossier :** `backend/`
> **Technologie :** Node.js 18+ / Express / TypeScript / Supabase

## Fonctionnalités

- **API REST** — port 4000, routes structurées par domaine
- **Authentification JWT** — bcrypt, tokens 30 jours, middleware rôle
- **Supabase PostgreSQL** — base de données avec RLS
- **LiveFFN** — scraping HTML (cheerio), cache TTL, persistance DB
- **Notifications** — système de notifications multi-types (coach/system/reminder)
- **Feedback nageur** — ressentis de course avec split times
- **Monitoring** — statut machine hôte (CPU, RAM, batterie)
- **Admin** — gestion CRUD des users, clubs, compétitions, PBs
- **Docker** — Dockerfile multi-stage (Node 20 Alpine)
- **Heroku** — Procfile prêt au déploiement

## Tech Stack Backend

| Technologie | Version |
|---|---|
| Node.js | 18+ |
| Express | ^4.21.2 |
| TypeScript | ~5.7.0 |
| Supabase JS | ^2.49.0 |
| JSON Web Token | ^9.0.2 |
| bcryptjs | ^2.4.3 |
| cheerio (scraping) | ^1.2.0 |
| Helmet (sécurité) | ^8.0.0 |
| Jest + Supertest | ^30.4.2 |

## Installation Backend

```bash
cd backend

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs Supabase + JWT_SECRET

# Exécuter les migrations SQL
npm run migrate

# Lancer en développement
npm run dev
```

Le serveur démarre sur `http://localhost:4000`.

### Variables d'environnement (`backend/.env`)

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
JWT_SECRET=une-chaine-aleatoire-tres-longue
PORT=4000
HOST=0.0.0.0
NODE_ENV=development
```

## Scripts Backend

| Commande | Description |
|---|---|
| `cd backend && npm run dev` | Serveur en mode développement |
| `cd backend && npm run build` | Compilation TypeScript |
| `cd backend && npm test` | Tests unitaires + intégration |
| `cd backend && npm run migrate` | Exécuter les migrations SQL |

## API Backend — Routes

### Authentification

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Inscription (avec code club) |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil utilisateur connecté |
| PATCH | `/api/auth/me` | Mise à jour du profil |
| GET | `/api/auth/pbs` | Mes records personnels |
| GET | `/api/auth/clubs` | Liste des clubs |
| GET | `/api/auth/club/:code` | Recherche club par code parrainage |

### Compétitions

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/competitions` | Liste des compétitions |
| GET | `/api/competitions/:id` | Détail d'une compétition |
| POST | `/api/competitions/:id/inscrire` | S'inscrire à une épreuve |
| DELETE | `/api/competitions/:id/desinscrire` | Se désinscrire d'une épreuve |

### LiveFFN (FFN)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/liveffn/competitions` | Compétitions en cours |
| GET | `/api/liveffn/competitions/:id` | Détail compétition LiveFFN |
| GET | `/api/liveffn/competitions/:id/program` | Programme (épreuves) |
| GET | `/api/liveffn/competitions/:id/events` | Liste plate des épreuves |
| GET | `/api/liveffn/competitions/:id/participants` | Liste des participants |
| GET | `/api/liveffn/competitions/:id/results/:eventId` | Résultats d'une épreuve |
| GET | `/api/liveffn/competitions/:id/startlist/:eventId` | Liste de départ |
| GET | `/api/liveffn/swimmer/:iuf` | Détails et résultats d'un nageur |
| GET | `/api/liveffn/club/:structureId` | Détails d'un club |
| GET | `/api/liveffn/live/:id` | Données temps réel |
| GET | `/api/liveffn/cache/stats` | Statistiques cache |
| DELETE | `/api/liveffn/cache` | Invalider le cache |

### Notifications

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/notifications` | Notifications de l'utilisateur |
| POST | `/api/notifications` | Créer une notification |
| POST | `/api/notifications/read` | Marquer comme lu |
| POST | `/api/notifications/read-all` | Tout marquer comme lu |
| GET | `/api/notifications/unread-count` | Nombre non lues |
| DELETE | `/api/notifications/:id` | Supprimer une notification |

### Feedback Nageur

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/feedback` | Sauvegarder un ressenti |
| GET | `/api/feedback` | Récupérer un ressenti |
| GET | `/api/feedback/swimmer/:iuf` | Tous les ressentis d'un nageur |

### Monitoring

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/server/status` | Status serveur (admin) |
| GET | `/api/health` | Health check |

### Administration (admin only)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/admin/users` | Liste des utilisateurs |
| PATCH | `/api/admin/users/:id` | Modifier un utilisateur |
| GET | `/api/admin/clubs` | Liste des clubs |
| POST | `/api/admin/clubs` | Créer un club |
| PATCH | `/api/admin/clubs/:id` | Modifier un club |
| POST | `/api/admin/clubs/:id/logo` | Upload logo club |
| POST | `/api/admin/competitions` | Créer une compétition |
| PATCH | `/api/admin/competitions/:id` | Modifier une compétition |
| DELETE | `/api/admin/competitions/:id` | Supprimer une compétition |
| POST | `/api/admin/competitions/:id/epreuves` | Ajouter une épreuve |
| PATCH | `/api/admin/competitions/epreuves/:id` | Modifier une épreuve |
| DELETE | `/api/admin/competitions/epreuves/:id` | Supprimer une épreuve |
| GET | `/api/admin/competitions/:id/inscriptions` | Inscriptions d'une comp |
| POST | `/api/admin/pbs/:userId` | Ajouter/modifier un PB |
| PATCH | `/api/admin/pbs/:pbId` | Modifier un PB |
| DELETE | `/api/admin/pbs/:pbId` | Supprimer un PB |

## Structure Backend

```
backend/
├── src/
│   ├── index.ts                  # Point d'entrée (Express, middlewares, routes)
│   ├── config.ts                 # Configuration centralisée (.env)
│   ├── supabase.ts               # Client Supabase (service_role, bypass RLS)
│   ├── types/
│   │   └── index.ts              # Types partagés (Profile, Club, Notification, JWT)
│   ├── middleware/
│   │   ├── auth.ts               # Auth JWT + contrôle par rôle (401/403)
│   │   └── upload.ts             # Multer pour upload fichiers
│   ├── routes/
│   │   ├── auth.ts               # Authentification (register, login, me, clubs)
│   │   ├── admin.ts              # Administration (users, clubs, competitions, PBs)
│   │   ├── competitions.ts       # Compétitions et inscriptions
│   │   ├── notifications.ts      # Système de notifications
│   │   ├── feedback.ts           # Ressenti nageur
│   │   └── server.ts             # Monitoring machine hôte
│   └── liveffn/                  # Module LiveFFN (scraping FFN)
│       ├── index.ts              #   Barrel export
│       ├── types.ts              #   Types LiveFFN
│       ├── fetcher.ts            #   Requêtes HTTP vers liveffn.com
│       ├── parser.ts             #   Extraction HTML → données structurées
│       ├── cache.ts              #   Cache TTL en mémoire
│       ├── persistence.ts        #   Sauvegarde en base PostgreSQL
│       └── routes.ts             #   Routes API LiveFFN
├── migrations/                   # Migrations SQL
│   ├── 001_init.sql              #   Schéma initial (profiles, clubs, competitions...)
│   ├── 002_liveffn.sql           #   Tables LiveFFN
│   ├── 003_race_feedback.sql     #   Tables feedback
│   ├── 004_liveffn_unique.sql    #   Contraintes uniques
│   └── 005_reminder_delay.sql    #   Délai de rappel
├── scripts/                      # Scripts de vérification
├── Dockerfile                    # Build Docker (Node 20 Alpine)
├── Procfile                      # Heroku process
├── package.json                  # Dépendances et scripts
├── tsconfig.json                 # Configuration TypeScript
├── jest.config.js                # Configuration tests
└── .env.example                  # Template variables d'environnement
```

---

## Documentation

Le dossier `docs/` contient :

| Fichier | Description |
|---|---|
| `CHARTE_GRAPHIQUE.md` | Charte graphique et guidelines UI |
| `LIVEFFN_STRUCTURE.md` | Structure des données LiveFFN |
| `equipes/` | Documentation par équipe (design, dev, inspection, rédaction, com) |

---

## Contribuer

1. Créez une branche : `git checkout -b feature/ma-fonctionnalite`
2. Commitez : `git commit -m "feat: ajout de ma fonctionnalité"`
3. Poussez : `git push origin feature/ma-fonctionnalite`
4. Ouvrez une Pull Request

---

## Licence

**Usage privé** — Projet en développement privé.

Le template Expo est sous licence MIT (`LICENSE`). Le code Bancalais Natation est soumis à des conditions d'utilisation restreintes.

---

## Contact

Projet **Bancalais Natation** — pour toute question, ouvrez une issue sur le dépôt.
