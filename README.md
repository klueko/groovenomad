# GrooveNomad 🎵

Une application mobile pour découvrir et réserver des voyages vers des festivals adaptés à vos goûts musicaux.

## Configuration

### 1. Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Spotify OAuth
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# App Config
EXPO_PUBLIC_APP_SCHEME=groovenomad

# Base de données Supabase (pour Better Auth)
DATABASE_URL=postgresql://postgres:your-password@your-project.supabase.co:5432/postgres
SUPABASE_DB_PASSWORD=your-supabase-db-password
SUPABASE_PROJECT_REF=your-project-ref
```

### 2. Configuration Supabase

1. Créez un projet sur [Supabase](https://supabase.com)
2. Récupérez votre URL de projet et votre clé anonyme dans les paramètres API
3. Configurez les tables d'authentification Better Auth (voir section ci-dessous)

### 3. Configuration Spotify

1. Allez sur [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Créez une nouvelle application
3. **IMPORTANT** : Ajoutez exactement ces URLs de redirection :

   - `http://127.0.0.1:3000/auth/callback/spotify` (pour développement)
   - `groovenomad://auth/callback/spotify` (pour mobile)

   ⚠️ **Attention** : Spotify ne supporte pas les wildcards comme `groovenomad://` seul. Il faut spécifier le chemin complet.

4. Récupérez votre Client ID et Client Secret

### 4. Configuration Better Auth avec Supabase

Better Auth nécessite des tables spécifiques dans votre base de données Supabase. Exécutez ce SQL dans l'éditeur SQL de Supabase :

```sql
-- Tables pour Better Auth
CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    name TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    image TEXT
);

CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMP NOT NULL,
    token TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP,
    "refreshTokenExpiresAt" TIMESTAMP,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Installation

```bash
# Installer les dépendances
pnpm install

# Démarrer le serveur de développement
pnpm start
```

## Fonctionnalités

- ✅ Authentification avec Spotify
- ✅ Gestion des sessions sécurisées
- ✅ Deep linking pour OAuth
- 🔄 Récupération des goûts musicaux (à venir)
- 🔄 Recommandations de festivals (à venir)
- 🔄 Réservation de voyages (à venir)

## Architecture

- **Frontend** : React Native avec Expo Router
- **Authentification** : Better Auth avec support Spotify
- **Base de données** : Supabase (PostgreSQL)
- **Navigation** : Expo Router avec deep linking
- **Stockage sécurisé** : Expo SecureStore

## Développement

### Structure du projet

```
app/
├── _layout.tsx          # Layout principal
├── index.tsx            # Page d'accueil
├── login.tsx            # Page de connexion
├── home.tsx             # Page principale (utilisateurs connectés)
└── api/
    └── auth/
        └── [...auth]+api.ts  # Routes API Better Auth

lib/
├── auth.ts              # Configuration Better Auth
└── auth-client.ts       # Client Better Auth pour mobile
```

### Commandes utiles

```bash
# Démarrer avec cache vidé
pnpm start --clear

# Construire pour production
pnpm build

# Lancer sur iOS
pnpm ios

# Lancer sur Android
pnpm android
```

## Dépannage

### Problèmes courants avec Spotify OAuth

1. **Erreur "Invalid redirect URI"** : Vérifiez que vous avez ajouté exactement `groovenomad://auth/callback/spotify` dans votre dashboard Spotify
2. **Deep linking ne fonctionne pas** : Assurez-vous que le schéma `groovenomad` est bien configuré dans `app.json`
3. **Erreur de callback** : Vérifiez que l'URL de développement `http://localhost:8081/api/auth/callback/spotify` est aussi ajoutée

## Contribuer

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Commitez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request
