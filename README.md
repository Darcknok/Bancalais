# Bancalais Natation

**Application mobile de gestion de compétitions de natation** — suivez les résultats en direct, gérez vos clubs, et accompagnez vos nageurs en temps réel.

Bancalais Natation est une application full-stack développée avec **Expo (React Native)** pour le frontend mobile et **Node.js/Express** pour le backend, avec une base de données **Supabase (PostgreSQL)**. Elle intègre **LiveFFN** pour récupérer les résultats en direct des compétitions de la FFN.

---

## Fonctionnalités

- **Planification de compétitions** — calendrier et timeline des épreuves
- **LiveFFN** — intégration temps réel des résultats de compétitions FFN
- **Mode nageur** — filtrer les épreuves par nageur, afficher ses résultats en direct
- **Feedback de course** — temps de passage, split times, graphiques
- **Gestion de clubs** — adhésions, rôles, permissions
- **Outils coach** — gestion des groupes d'entraînement et des équipes
- **Dashboard administrateur** — gestion des utilisateurs et des clubs
- **Notifications push** — alertes sur les résultats et le calendrier
- **Chat** — messagerie intégrée entre membres
- **Thème sombre/clair** — support automatique et manuel
- **Authentification JWT** — sécurisée avec tokens

---

## Architecture

```
┌─────────────────────────┐      ┌──────────────────────────────┐
│   Application Mobile    │─────▶│    Backend API (Express)     │
│   (Expo / React Native) │      │    Port 4000                │
│   Port 8081             │      │    src/routes/*              │
└─────────────────────────┘      │    src/liveffn/*            │
                                 └──────────┬───────────────────┘
                                           │
                                 ┌─────────▼───────────────────┐
                                 │   Supabase (PostgreSQL)     │
                                 │   + Storage + Auth          │
                                 └─────────────────────────────┘
                                 ┌─────────────────────────────┐
                                 │   LiveFFN (Scraping)        │
                                 │   cheerio + cache           │
                                 └─────────────────────────────┘
```

L'application mobile communique avec le backend Express via une API REST. Le backend interroge Supabase pour les données persistantes et scrape LiveFFN pour les résultats de compétitions en direct, avec un système de cache pour optimiser les performances.

---

## Tech Stack

### Frontend mobile
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

### Backend
| Technologie | Version |
|---|---|
| Node.js | 18+ |
| Express | ^4.21.2 |
| TypeScript | ~5.7.0 |
| Supabase JS | ^2.49.0 |
| JSON Web Token | ^9.0.2 |
| cheerio (scraping) | ^1.2.0 |
| Jest + Supertest (tests) | ^30.4.2 |

### Site web marketing
- **Next.js** — site vitrine dans le dossier `website/`

---

## Prérequis

- **Node.js** 18 ou supérieur
- **npm** 9 ou supérieur
- **Expo CLI** — installé globalement (`npm install -g expo-cli`)
- **Compte Supabase** — gratuit sur [supabase.com](https://supabase.com)
- **Android Studio** (optionnel, pour l'émulateur Android)
- **Compte Expo EAS** (optionnel, pour les builds)

---

## Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-depot>
cd bancalais
```

### 2. Installer les dépendances

```bash
# Dépendances du projet mobile
npm install

# Dépendances du backend
cd backend
npm install
cd ..
```

### 3. Configurer les variables d'environnement

```bash
cd backend
cp .env.example .env
```

Éditez le fichier `backend/.env` avec vos propres valeurs :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
JWT_SECRET=une-chaine-aleatoire-tres-longue
PORT=4000
HOST=0.0.0.0
NODE_ENV=development
```

### 4. Configurer Supabase

1. Créez un projet sur [Supabase](https://supabase.com)
2. Récupérez votre `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` depuis les **Project Settings > API**
3. Générez un `JWT_SECRET` fort (minimum 32 caractères)
4. Exécutez les migrations SQL :

```bash
cd backend
npm run migrate
```

Cela exécutera tous les fichiers SQL dans `backend/migrations/` pour créer les tables nécessaires.

### 5. Lancer le backend

```bash
cd backend
npm run dev
```

Le serveur démarre sur `http://localhost:4000`.

### 6. Lancer l'application mobile

```bash
# Depuis la racine du projet
npx expo start
```

Scannez le QR code avec l'application **Expo Go** sur votre téléphone, ou ouvrez dans un émulateur en appuyant sur `a` (Android) ou `i` (iOS).

---

## Développement

### Scripts disponibles

| Commande | Description |
|---|---|
| `npx expo start` | Lance le bundler Expo |
| `npx expo start --clear` | Lance le bundler avec reset du cache |
| `cd backend && npm run dev` | Lance le backend en mode développement |
| `cd backend && npm run build` | Compile le backend TypeScript |
| `cd backend && npm test` | Lance les tests du backend |
| `npm test` | Lance les tests du frontend mobile |
| `npm run lint` | Lance ESLint sur le projet mobile |

### Structure du projet

```
bancalais/
├── src/                          # Application mobile Expo
│   ├── app/                      # Pages Expo Router
│   │   ├── _layout.tsx           # Layout racine
│   │   ├── index.tsx             # Page d'accueil
│   │   ├── (auth)/               # Authentification (connexion, inscription)
│   │   └── (tabs)/               # Navigation par onglets
│   ├── components/               # Composants UI réutilisables
│   ├── constants/                # Thème, couleurs, espacements
│   ├── context/                  # Contextes React (Auth, etc.)
│   ├── data/                     # Clients API (LiveFFN, compétitions, etc.)
│   ├── hooks/                    # Hooks personnalisés
│   └── lib/                      # Utilitaires API, environnement
├── backend/                      # API Express
│   ├── src/
│   │   ├── index.ts              # Point d'entrée du serveur
│   │   ├── config.ts             # Configuration (variables d'environnement)
│   │   ├── supabase.ts           # Client Supabase
│   │   ├── routes/               # Routes API
│   │   │   ├── auth.ts           # Authentification
│   │   │   ├── competitions.ts   # Compétitions
│   │   │   ├── admin.ts          # Administration
│   │   │   └── ...
│   │   ├── middleware/           # Middleware (auth JWT, etc.)
│   │   ├── liveffn/              # Scraping et cache LiveFFN
│   │   └── types/                # Types TypeScript partagés
│   ├── migrations/               # Migrations SQL
│   └── scripts/                  # Scripts de setup et migration
├── website/                      # Site web marketing (Next.js)
├── plugins/                      # Plugins Expo config
├── docs/                         # Documentation
├── assets/                       # Images, polices, icônes
├── app.json                      # Configuration Expo
├── eas.json                      # Configuration EAS Build
└── AGENTS.md                     # Instructions pour l'IA
```

---

## Build pour la production (APK)

### Build de preview (interne)

```bash
npx eas build --platform android --profile preview
```

Un fichier APK sera généré et téléchargeable depuis votre tableau de bord Expo EAS.

### Build de production

```bash
npx eas build --platform android --profile production
```

Cette commande génère un AAB (Android App Bundle) prêt pour le Play Store.

> **Note :** Vous devez avoir un compte Expo EAS configuré. Exécutez `npx eas login` avant le premier build.

### Configuration EAS

Les profils de build sont définis dans `eas.json` :

- **development** — build de développement avec client de débogage
- **preview** — APK interne pour test
- **production** — build de production avec incrémentation automatique de version

---

## API Backend

Le backend expose une API REST sur le port `4000`. Les principales routes :

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/competitions` | Liste des compétitions |
| GET | `/api/competitions/:id` | Détail d'une compétition |
| GET | `/api/liveffn/:competitionId` | Résultats LiveFFN |
| GET | `/api/users/me` | Profil utilisateur |
| GET | `/api/admin/users` | Liste des utilisateurs (admin) |
| GET | `/api/clubs` | Liste des clubs |
| POST | `/api/clubs` | Créer un club |

---

## Tests

```bash
# Backend
cd backend
npm test

# Mobile
npm test
npm run test:watch
```

---

## Contribuer

1. Créez une branche depuis `main` : `git checkout -b feature/ma-fonctionnalite`
2. Commitez vos changements : `git commit -m "feat: ajout de ma fonctionnalité"`
3. Poussez la branche : `git push origin feature/ma-fonctionnalite`
4. Ouvrez une Pull Request

Merci de suivre les conventions de code existantes et d'ajouter des tests pour les nouvelles fonctionnalités.

---

## Licence

**Usage privé** — Ce projet est actuellement en développement privé.

Le code source hérité du template Expo est distribué sous licence MIT (voir le fichier `LICENSE`). Le code spécifique à Bancalais Natation est soumis à des conditions d'utilisation restreintes — veuillez contacter l'auteur pour toute demande.

---

## Contact

Projet développé par **Bancalais Natation**.

Pour toute question, suggestion ou rapport de bug, merci d'ouvrir une issue sur le dépôt GitHub du projet.
