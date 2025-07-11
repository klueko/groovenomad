import { authClient } from "./auth-client";

export interface SpotifyProfile {
  id: string;
  display_name: string;
  email: string;
  country: string;
  followers: {
    total: number;
  };
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  product: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyTopItemsResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  href: string;
  next: string | null;
  previous: string | null;
}

export interface MusicPreferences {
  topGenres: Array<{
    genre: string;
    count: number;
    percentage: number;
  }>;
  topArtists: SpotifyArtist[];
  topTracks: SpotifyTrack[];
  profile: SpotifyProfile;
}

class SpotifyService {
  private async getAccessToken(): Promise<string | null> {
    try {
      const session = await authClient.getSession();

      if (!session?.data?.user) {
        console.log("❌ Pas de session utilisateur");
        return null;
      }

      console.log("🔍 Récupération du token Spotify via API...");

      // Récupérer le token depuis l'API alternative avec l'ID utilisateur
      const response = await fetch(
        "http://10.224.162.166:8081/api/spotify-token-alt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: session.data.user.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erreur API token:", errorData.error);
        return null;
      }

      const tokenData = await response.json();
      console.log("✅ Token Spotify récupéré avec succès");

      return tokenData.accessToken;
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
      const accessToken = await this.getAccessToken();
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
      const accessToken = await this.getAccessToken();
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
      const accessToken = await this.getAccessToken();
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

export const spotifyService = new SpotifyService();
