import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import {
  SpotifyProfile,
  SpotifyArtist,
  SpotifyTrack,
  SpotifyTopItemsResponse,
  MusicPreferences,
} from "./spotify-service";

class SpotifyServiceSimple {
  private async getStoredToken(): Promise<string | null> {
    if (Platform.OS === "web") return null;

    try {
      const token = await SecureStore.getItemAsync("spotify_access_token");
      const expiresAt = await SecureStore.getItemAsync("spotify_expires_at");

      if (token && expiresAt && Date.now() < parseInt(expiresAt)) {
        console.log("✅ Token Spotify valide trouvé en cache");
        return token;
      }

      console.log("⚠️ Token Spotify expiré ou manquant");
      return null;
    } catch (error) {
      console.error("❌ Erreur récupération token:", error);
      return null;
    }
  }

  private async makeSpotifyRequest<T>(
    endpoint: string,
    accessToken: string
  ): Promise<T> {
    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Erreur API Spotify: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async getUserProfile(): Promise<SpotifyProfile | null> {
    try {
      const accessToken = await this.getStoredToken();
      if (!accessToken) {
        console.log("❌ Pas de token d'accès Spotify");
        return null;
      }

      const profile = await this.makeSpotifyRequest<SpotifyProfile>(
        "/me",
        accessToken
      );
      console.log("✅ Profil Spotify récupéré:", profile.display_name);
      return profile;
    } catch (error) {
      console.error("❌ Erreur récupération profil:", error);
      return null;
    }
  }

  async getTopArtists(
    timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
    limit: number = 20
  ): Promise<SpotifyArtist[]> {
    try {
      const accessToken = await this.getStoredToken();
      if (!accessToken) {
        console.log("❌ Pas de token d'accès Spotify");
        return [];
      }

      const response = await this.makeSpotifyRequest<
        SpotifyTopItemsResponse<SpotifyArtist>
      >(`/me/top/artists?time_range=${timeRange}&limit=${limit}`, accessToken);

      console.log(
        `✅ Top artistes récupérés (${timeRange}):`,
        response.items.length
      );
      return response.items;
    } catch (error) {
      console.error("❌ Erreur récupération top artistes:", error);
      return [];
    }
  }

  async getTopTracks(
    timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
    limit: number = 20
  ): Promise<SpotifyTrack[]> {
    try {
      const accessToken = await this.getStoredToken();
      if (!accessToken) {
        console.log("❌ Pas de token d'accès Spotify");
        return [];
      }

      const response = await this.makeSpotifyRequest<
        SpotifyTopItemsResponse<SpotifyTrack>
      >(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`, accessToken);

      console.log(
        `✅ Top tracks récupérés (${timeRange}):`,
        response.items.length
      );
      return response.items;
    } catch (error) {
      console.error("❌ Erreur récupération top tracks:", error);
      return [];
    }
  }

  async getMusicPreferences(): Promise<MusicPreferences | null> {
    try {
      console.log("🎵 Récupération des préférences musicales...");

      const [profile, topArtists, topTracks] = await Promise.all([
        this.getUserProfile(),
        this.getTopArtists("medium_term", 50),
        this.getTopTracks("medium_term", 50),
      ]);

      if (!profile) {
        console.log("❌ Impossible de récupérer le profil");
        return null;
      }

      // Analyser les genres à partir des artistes
      const genreCount = new Map<string, number>();

      topArtists.forEach((artist) => {
        artist.genres.forEach((genre) => {
          genreCount.set(genre, (genreCount.get(genre) || 0) + 1);
        });
      });

      // Convertir en array et trier par popularité
      const totalGenres = Array.from(genreCount.values()).reduce(
        (a, b) => a + b,
        0
      );
      const topGenres = Array.from(genreCount.entries())
        .map(([genre, count]) => ({
          genre,
          count,
          percentage: Math.round((count / totalGenres) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 genres

      console.log("✅ Préférences musicales analysées:");
      console.log(`  - ${topGenres.length} genres identifiés`);
      console.log(`  - ${topArtists.length} artistes favoris`);
      console.log(`  - ${topTracks.length} tracks favoris`);

      return {
        topGenres,
        topArtists: topArtists.slice(0, 20),
        topTracks: topTracks.slice(0, 20),
        profile,
      };
    } catch (error) {
      console.error("❌ Erreur analyse préférences musicales:", error);
      return null;
    }
  }
}

export const spotifyServiceSimple = new SpotifyServiceSimple();
