# Configuration des variables d'environnement

## 📁 Créer le fichier .env

Crée un fichier `.env` dans le dossier `groovenomad/` avec le contenu suivant :

```bash
# Configuration Supabase
EXPO_PUBLIC_SUPABASE_URL=https://zjkmcqmovbovuafwygbh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqa21jcW1vdmJvdnVhZnd5Z2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzQzMTAsImV4cCI6MjA1MjU1MDMxMH0.lAJJYZGjJwJsT6hKQdTZxvCqgGrE2IZfzrqIvCjXMrY

# Configuration Spotify OAuth (SANS le préfixe EXPO_PUBLIC_)
SPOTIFY_CLIENT_ID=625ab8accd47443abe9396fcb357af83
SPOTIFY_CLIENT_SECRET=ton_client_secret_spotify_ici

# Configuration App
EXPO_PUBLIC_APP_SCHEME=groovenomad
EXPO_PUBLIC_APP_URL=http://localhost:8081

# Configuration Better Auth
BETTER_AUTH_SECRET=un_secret_aleatoire_securise_ici
BETTER_AUTH_URL=http://localhost:8081/api/auth

# Configuration Base de données
DATABASE_URL=postgresql://postgres.zjkmcqmovbovuafwygbh:ton_mot_de_passe_db@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

## 🎯 Points importants :

1. **SPOTIFY_CLIENT_ID** : SANS le préfixe `EXPO_PUBLIC_`
2. **SPOTIFY_CLIENT_SECRET** : Tu dois le récupérer depuis le Spotify Developer Dashboard
3. **BETTER_AUTH_SECRET** : Génère un secret aléatoire sécurisé
4. **DATABASE_URL** : Remplace `ton_mot_de_passe_db` par ton vrai mot de passe Supabase

## 🔑 Obtenir les clés Spotify :

1. Va sur https://developer.spotify.com/dashboard
2. Crée une nouvelle app ou utilise une existante
3. Dans les paramètres, ajoute ces Redirect URIs :
   - `http://localhost:8081/api/auth/callback/spotify`
   - `groovenomad://auth/callback/spotify`
4. Copie le Client Secret depuis l'interface

## 🔒 Générer un secret Better Auth :

```bash
# Dans ton terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
