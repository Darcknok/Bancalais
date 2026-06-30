# Steps — Configuration manuelle (à faire par toi)

## 1. Créer le projet Supabase

1. Va sur [https://supabase.com](https://supabase.com) et connecte-toi (ou crée un compte)
2. Clique **New project**
3. Organisation : la tienne (par défaut)
4. Name : `bancalais`
5. Database password : **note ce mot de passe** (il servira pour PostgreSQL)
6. Region : **Paris** (`eu-west-3`) ou **Frankfurt** (`eu-central-1`)
7. Pricing plan : **Free** (ça suffit largement)
8. Clique **Create new project** et attends ~2 minutes

## 2. Récupérer les clés Supabase

1. Une fois le projet créé, va dans **Settings → API** dans le menu latéral
2. Note les valeurs suivantes (elles seront dans `.env` du backend) :
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role** (🔴 ne jamais exposer côté frontend) → `SUPABASE_SERVICE_ROLE_KEY`
3. **Settings → API → JWT Secret** : clique **Reveal** et copie la valeur → `JWT_SECRET`

## 3. Exécuter la migration SQL

1. Va dans **SQL Editor** dans le menu latéral
2. Clique **New query**
3. Copie-colle le contenu du fichier `backend/migrations/001_init.sql` (voir ci-dessous)
4. Clique **Run** (ou `Ctrl+Enter`)
5. Vérifie que les tables sont créées : va dans **Table Editor** → tu dois voir `clubs` et `profiles`

### Contenu de `backend/migrations/001_init.sql`

```sql
-- ============================================================
-- Migration 001 : Tables clubs + profiles
-- ============================================================

-- 1. Clubs
create table if not exists clubs (
  id            bigint generated always as identity primary key,
  name          text not null,
  city          text not null,
  referral_code text not null unique,
  logo_url      text,
  created_at    timestamptz default now()
);

-- 2. Profils utilisateur (auth gérée par Express, pas Supabase Auth)
create table if not exists profiles (
  id            bigint generated always as identity primary key,
  email         text not null unique,
  hashed_password text not null,
  prenom        text not null,
  nom           text not null,
  role          text not null check (role in ('swimmer', 'coach')),
  bio           text default '',
  avatar        text default 'person',
  club_id       bigint references clubs(id) on delete set null,
  referral_code_used text,
  joined_at     timestamptz default now(),
  message_notifications    boolean default true,
  announcement_notifications boolean default true,
  event_notifications      boolean default true,
  mention_notifications    boolean default true,
  invite_notifications     boolean default true
);

-- Index pour les recherches fréquentes
create index if not exists idx_profiles_email on profiles(email);
create index if not exists idx_profiles_club_id on profiles(club_id);
create index if not exists idx_clubs_referral_code on clubs(referral_code);

-- ============================================================
-- Seed data : 4 clubs + utilisateurs de démo
-- ============================================================

-- Clubs
insert into clubs (name, city, referral_code) values
  ('CN Bancalais', 'Chalon-sur-Saône', 'CNB-2026'),
  ('CN Mâcon', 'Mâcon', 'CNM-2026'),
  ('Dauphins Dijonnais', 'Dijon', 'DAUPH-2026'),
  ('Stade Laurentin Natation', 'Saint-Laurent-du-Var', 'SLN-2026')
on conflict (referral_code) do nothing;

-- Utilisateurs de démo (mot de passe en clair hashé avec bcrypt)
-- Les hash ci-dessous correspondent au mot de passe "123456"
-- Générés avec bcryptjs (10 rounds)
insert into profiles (email, hashed_password, prenom, nom, role, bio, avatar, club_id) values
  ('mathias@test.com', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9Rn6bm1FZwOJK3v0pMl0IRLG2y', 'Mathias', 'Durand', 'swimmer', 'Nageur en compétition depuis 5 ans', 'person', 1),
  ('pierre@test.com', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9Rn6bm1FZwOJK3v0pMl0IRLG2y', 'Pierre', 'Lefèvre', 'coach', 'Coach principal CN Bancalais', 'person', 1),
  ('sophie@test.com', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9Rn6bm1FZwOJK3v0pMl0IRLG2y', 'Sophie', 'Moreau', 'coach', 'Coach perfectionnement', 'person', 1),
  ('lucas@test.com', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9Rn6bm1FZwOJK3v0pMl0IRLG2y', 'Lucas', 'Petit', 'swimmer', 'Compétition région', 'person', 1),
  ('emma@test.com', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9Rn6bm1FZwOJK3v0pMl0IRLG2y', 'Emma', 'Bernard', 'swimmer', 'Perfectionnement', 'person', 1),
  ('jules@test.com', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9Rn6bm1FZwOJK3v0pMl0IRLG2y', 'Jules', 'Mossers', 'coach', 'Coach Stade Laurentin', 'person', 4),
  ('camille@test.com', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9Rn6bm1FZwOJK3v0pMl0IRLG2y', 'Camille', 'Renaud', 'swimmer', 'Compétition Nice', 'person', 4),
  ('antoine@test.com', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9Rn6bm1FZwOJK3v0pMl0IRLG2y', 'Antoine', 'Leroy', 'swimmer', 'Natation sportive', 'person', 4)
on conflict (email) do nothing;
```

## 4. Configurer le JWT secret partagé

1. Va dans **Settings → API → JWT Secret** dans le dashboard Supabase
2. Copie la valeur (ex: `super-secret-jwt-token-with-at-least-32-characters-long`)
3. Colle-la dans le fichier `backend/.env` sous `JWT_SECRET=...`
4. Cette même valeur doit être EXACTEMENT la même que celle que Supabase utilise
5. C'est ce qui permet à Supabase Realtime de reconnaître nos JWTs customs plus tard

## 5. Lancer le backend

```bash
# Installer les dépendances
cd backend
npm install

# Copier le fichier d'env
cp .env.example .env
# Puis édite .env avec les valeurs récupérées à l'étape 2

# Lancer en dev
npm run dev
```

Le serveur démarre sur `http://localhost:4000`.

## 6. Tester les endpoints

```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","prenom":"Test","nom":"User","role":"swimmer"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mathias@test.com","password":"123456"}'

# Me (avec le token récupéré du login)
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

## 7. Problèmes courants

| Symptôme | Solution |
|---|---|
| `ECONNREFUSED` au démarrage | Vérifie que Supabase URL est correcte |
| `401 Unauthorized` sur /me | Le token JWT est invalide ou expiré |
| Les hash bcrypt ne matchent pas | Le mot de passe en base est mal formaté — supprime la ligne et réinsère |
| Port 4000 déjà utilisé | Change `PORT` dans `.env` et mets à jour l'URL dans le frontend |

## 8. Structure du backend

```
backend/
├── .env                   ← Tes clés (NE PAS COMMIT)
├── .env.example           ← Template des clés
├── package.json
├── tsconfig.json
├── migrations/
│   └── 001_init.sql       ← Script SQL à exécuter dans Supabase
└── src/
    ├── index.ts           ← Point d'entrée Express
    ├── config.ts          ← Charge les vars d'env
    ├── supabase.ts        ← Client Supabase (service_role)
    ├── middleware/
    │   └── auth.ts        ← Vérification JWT
    ├── routes/
    │   └── auth.ts        ← Register / Login / Me
    └── types/
        └── index.ts       ← Types partagés
```
