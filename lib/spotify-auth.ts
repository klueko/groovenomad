import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import {
  makeRedirectUri,
  useAuthRequest,
  ResponseType,
} from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Nécessaire pour fermer le navigateur web après auth
WebBrowser.maybeCompleteAuthSession();

// Configuration Spotify OAuth
const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

export function useSpotifyAuth() {
  // Générer l'URL de redirection pour Expo Go
  const redirectUri = makeRedirectUri({
    path: "auth",
  });

  console.log("🔧 Redirect URI généré:", redirectUri);

  const [request, response, promptAsync] = useAuthRequest(
    {
      responseType: ResponseType.Code, // Authorization Code avec PKCE
      clientId: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID!,
      scopes: [
        "user-read-email",
        "user-read-private",
        "playlist-read-private",
        "playlist-modify-public",
        "user-library-read",
        "user-library-modify",
        "user-top-read",
      ],
      redirectUri: redirectUri,
      usePKCE: true, // Utiliser PKCE automatiquement
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;

      console.log("🎉 Code d'autorisation Spotify reçu !");
      console.log("Code:", code?.substring(0, 20) + "...");
      console.log("Params complets:", response.params);

      // Échanger le code contre un access token
      exchangeCodeForToken(code);
    }

    if (response?.type === "error") {
      console.error("❌ Erreur Spotify Auth:", response.error);
      console.error("Détails erreur:", response.params);
    }
  }, [response]);

  const exchangeCodeForToken = async (code: string) => {
    console.log("🔄 Échange du code contre un token...");
    console.log(
      "🔑 Code verifier:",
      request?.codeVerifier ? "Présent" : "Manquant"
    );

    try {
      const formData = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
        client_id: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID!,
      });

      // Ajouter le code_verifier seulement s'il existe
      if (request?.codeVerifier) {
        formData.append("code_verifier", request.codeVerifier);
      }

      console.log(
        "📋 Paramètres envoyés:",
        Object.fromEntries(formData.entries())
      );

      const tokenResponse = await fetch(
        "https://accounts.spotify.com/api/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        }
      );

      const tokenData = await tokenResponse.json();

      if (tokenResponse.ok) {
        console.log("✅ Token Spotify obtenu avec succès !");
        console.log("Type de token:", tokenData.token_type);
        console.log("Expires in:", tokenData.expires_in, "secondes");

        // Sauvegarder le token
        if (Platform.OS !== "web") {
          await SecureStore.setItemAsync(
            "spotify_access_token",
            tokenData.access_token
          );
          await SecureStore.setItemAsync(
            "spotify_refresh_token",
            tokenData.refresh_token
          );
          await SecureStore.setItemAsync(
            "spotify_expires_at",
            (Date.now() + tokenData.expires_in * 1000).toString()
          );
        }

        // Récupérer les infos utilisateur
        fetchUserInfo(tokenData.access_token);
      } else {
        console.error("❌ Erreur lors de l'échange du token:", tokenData);
      }
    } catch (error) {
      console.error("❌ Erreur réseau lors de l'échange du token:", error);
    }
  };

  const fetchUserInfo = async (accessToken: string) => {
    console.log("👤 Récupération des infos utilisateur Spotify...");

    try {
      const userResponse = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userData = await userResponse.json();

      if (userResponse.ok) {
        console.log("✅ Infos utilisateur Spotify récupérées !");
        console.log("Nom:", userData.display_name);
        console.log("Email:", userData.email);
        console.log("Pays:", userData.country);
        console.log("Followers:", userData.followers?.total);
        console.log("Type de compte:", userData.product);
        console.log("ID utilisateur:", userData.id);

        // Sauvegarder les infos utilisateur
        if (Platform.OS !== "web") {
          await SecureStore.setItemAsync(
            "spotify_user_info",
            JSON.stringify(userData)
          );
        }
      } else {
        console.error(
          "❌ Erreur lors de la récupération des infos utilisateur:",
          userData
        );
      }
    } catch (error) {
      console.error(
        "❌ Erreur réseau lors de la récupération des infos utilisateur:",
        error
      );
    }
  };

  const loginWithSpotify = () => {
    console.log("🎵 Démarrage authentification Spotify...");
    promptAsync();
  };

  const getStoredToken = async () => {
    if (Platform.OS === "web") return null;

    try {
      const token = await SecureStore.getItemAsync("spotify_access_token");
      const expiresAt = await SecureStore.getItemAsync("spotify_expires_at");

      if (token && expiresAt && Date.now() < parseInt(expiresAt)) {
        console.log("✅ Token Spotify valide trouvé en cache");
        return token;
      }

      // Token expiré, le supprimer
      console.log("⚠️ Token Spotify expiré, suppression du cache");
      await SecureStore.deleteItemAsync("spotify_access_token");
      await SecureStore.deleteItemAsync("spotify_expires_at");
      await SecureStore.deleteItemAsync("spotify_user_info");
      return null;
    } catch (error) {
      console.error("❌ Erreur récupération token:", error);
      return null;
    }
  };

  const getStoredUserInfo = async () => {
    if (Platform.OS === "web") return null;

    try {
      const userInfo = await SecureStore.getItemAsync("spotify_user_info");
      if (userInfo) {
        const userData = JSON.parse(userInfo);
        console.log(
          "✅ Infos utilisateur Spotify trouvées en cache:",
          userData.display_name
        );
        return userData;
      }
      return null;
    } catch (error) {
      console.error("❌ Erreur récupération infos utilisateur:", error);
      return null;
    }
  };

  const logout = async () => {
    console.log("🚪 Déconnexion Spotify...");
    if (Platform.OS !== "web") {
      await SecureStore.deleteItemAsync("spotify_access_token");
      await SecureStore.deleteItemAsync("spotify_refresh_token");
      await SecureStore.deleteItemAsync("spotify_expires_at");
      await SecureStore.deleteItemAsync("spotify_user_info");
    }
  };

  return {
    loginWithSpotify,
    getStoredToken,
    getStoredUserInfo,
    logout,
    isAuthenticated: response?.type === "success",
    isLoading: !request,
    response,
  };
}
