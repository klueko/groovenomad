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

# Configuration APIs externes
TICKETMASTER_API_KEY=ton_api_key_ticketmaster_ici
TICKETMASTER_SECRET=ton_secret_ticketmaster_ici
GROQ_API_KEY=ton_api_key_groq_ici
AMADEUS_CLIENT_ID=ton_client_id_amadeus_ici
AMADEUS_CLIENT_SECRET=ton_secret_amadeus_ici
OPENTRIPMAP_API_KEY=ton_api_key_opentripmap_ici
MAPBOX_API_KEY=ton_api_key_mapbox_ici
EXPO_PUBLIC_MAPBOX_API_KEY=ton_api_key_mapbox_ici
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

## 🗺️ Obtenir la clé OpenTripMap (pour Pedro Activités) :

1. Va sur https://opentripmap.io/docs
2. Clique sur "Get API Key" et crée un compte gratuit
3. Confirme ton email et connecte-toi
4. Va dans ton profil pour récupérer ta clé API
5. Copie la clé dans `OPENTRIPMAP_API_KEY=ta_cle_ici`

**Note :** OpenTripMap est gratuit sans limite stricte, parfait pour les activités touristiques !

---

## 🔤 **GUIDE DE DÉBOGAGE DES POLICES**

### **Problème résolu : Polices personnalisées**

✅ **Solution implementée :**

- Suppression des conflits `fontWeight` avec polices TTF intégrées
- Nouveau système `FestiFunTypography` pour éviter les erreurs
- Configuration Android améliorée
- Cache Metro nettoyé automatiquement

### **Comment vérifier que ça fonctionne :**

1. **Via l'écran de debug :**

   ```bash
   # Dans l'app, navigue vers /debug
   # Tu verras différents styles de polices testés
   ```

2. **Commandes de nettoyage (si problème persiste) :**

   ```bash
   # Nettoyer complètement le cache
   cd groovenomad
   npx expo start --clear

   # Si ça ne marche toujours pas
   pnpm start --reset-cache

   # Redémarrer Expo Go complètement
   # (fermer l'app et la relancer)
   ```

3. **Vérification des fichiers de polices :**
   ```bash
   ls -la assets/fonts/
   # Tu dois voir :
   # FasterOne-Regular.ttf
   # Poppins-Regular.ttf
   # Poppins-Medium.ttf
   # Poppins-SemiBold.ttf
   # Poppins-Bold.ttf
   ```

### **⚠️ Limitations Expo Go :**

- Expo Go peut avoir des limitations avec les polices
- Si le problème persiste, essaie avec `npx expo run:android`
- Pour production, un development build sera nécessaire

### **✅ Nouvelles bonnes pratiques :**

```typescript
// ❌ AVANT (causait le bug)
style={{
  fontFamily: "Poppins-Bold",
  fontWeight: "700" // ❌ Conflit !
}}

// ✅ MAINTENANT (corrigé)
style={{
  fontFamily: FestiFunTypography.bodyBold.fontFamily // ✅ Pas de fontWeight
}}
```

### **📱 Test sur Android :**

```bash
# Si les polices ne s'affichent toujours pas sur Android
npx expo run:android --device
# Cela crée un development build avec les polices intégrées
```
