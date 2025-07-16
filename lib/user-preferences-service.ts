import {
  SpotifyArtist,
  SpotifyTrack,
  MusicPreferences,
} from "./spotify-service";

// Types pour les préférences sélectionnées
export interface SelectedGenre {
  genre: string;
  count: number;
  percentage: number;
  selected: boolean; // Indique si l'utilisateur a gardé ce genre
}

export interface SelectedArtist {
  id: string;
  name: string;
  images: Array<{ url: string; height: number; width: number }>;
  genres: string[];
  popularity: number;
  external_urls: { spotify: string };
  selected: boolean; // Indique si l'utilisateur a gardé cet artiste
}

export interface SelectedTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  preview_url: string | null;
  external_urls: { spotify: string };
  selected: boolean; // Indique si l'utilisateur a gardé cette track
}

export interface UserMusicPreferences {
  id: string;
  userId: string;
  selectedGenres: SelectedGenre[];
  selectedArtists: SelectedArtist[];
  selectedTracks: SelectedTrack[];
  spotifyProfileData?: any;
  lastSpotifySync?: Date;
  preferencesVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_BETTER_AUTH_URL || "http://127.0.0.1:3000";

export class UserPreferencesService {
  /**
   * Sauvegarde ou met à jour les préférences musicales d'un utilisateur
   */
  async saveUserMusicPreferences(
    userId: string,
    musicPreferences: MusicPreferences,
    selections: {
      selectedGenres: SelectedGenre[];
      selectedArtists: SelectedArtist[];
      selectedTracks: SelectedTrack[];
    }
  ): Promise<UserMusicPreferences> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user-preferences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          musicPreferences,
          selections,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save preferences: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error saving user music preferences:", error);
      throw new Error("Failed to save user music preferences");
    }
  }

  /**
   * Récupère les préférences musicales d'un utilisateur
   */
  async getUserMusicPreferences(
    userId: string
  ): Promise<UserMusicPreferences | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user-preferences?userId=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch preferences: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching user music preferences:", error);
      throw new Error("Failed to fetch user music preferences");
    }
  }

  /**
   * Supprime les préférences musicales d'un utilisateur
   */
  async deleteUserMusicPreferences(userId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user-preferences?userId=${userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Error deleting user music preferences:", error);
      throw new Error("Failed to delete user music preferences");
    }
  }

  /**
   * Met à jour seulement les sélections de l'utilisateur
   */
  async updateUserSelections(
    userId: string,
    selections: {
      selectedGenres?: SelectedGenre[];
      selectedArtists?: SelectedArtist[];
      selectedTracks?: SelectedTrack[];
    }
  ): Promise<UserMusicPreferences | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user-preferences?userId=${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selections),
        }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to update selections: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating user selections:", error);
      throw new Error("Failed to update user selections");
    }
  }

  /**
   * Vérifie si un utilisateur a déjà des préférences configurées
   */
  async hasUserMusicPreferences(userId: string): Promise<boolean> {
    try {
      console.log("🔍 [Client] Vérification préférences pour userId:", userId);
      console.log(
        "🌐 [Client] URL appelée:",
        `${API_BASE_URL}/api/user-preferences/${userId}/exists`
      );

      const response = await fetch(
        `${API_BASE_URL}/api/user-preferences/${userId}/exists`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📡 [Client] Statut réponse:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("📋 [Client] Réponse API:", result);
        console.log(
          "✅ [Client] Utilisateur a des préférences:",
          result.exists
        );
        return result.exists;
      }

      console.log("❌ [Client] Réponse non OK, retour false");
      return false;
    } catch (error) {
      console.error(
        "❌ [Client] Erreur vérification préférences musicales:",
        error
      );
      return false;
    }
  }

  /**
   * Obtient des statistiques sur les préférences de l'utilisateur
   */
  async getUserPreferencesStats(userId: string): Promise<{
    totalGenres: number;
    totalArtists: number;
    totalTracks: number;
    lastUpdated: Date | null;
  } | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user-preferences?userId=${userId}&action=stats`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting user preferences stats:", error);
      return null;
    }
  }
}

// Export d'une instance unique du service
export const userPreferencesService = new UserPreferencesService();
