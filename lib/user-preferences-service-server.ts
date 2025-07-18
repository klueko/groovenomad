import { db } from "./database-server";
import { userMusicPreferences } from "./schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
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

export class UserPreferencesService {
  /**
   * Helper function pour parser les données JSON de manière sécurisée
   */
  private safeJsonParse(data: any): any {
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error("Error parsing JSON:", error, "Data:", data);
        return null;
      }
    }
    return data; // Si ce n'est pas une string, retourner tel quel
  }

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
      // Vérifier si l'utilisateur a déjà des préférences
      const existingPreferences = await db
        .select()
        .from(userMusicPreferences)
        .where(eq(userMusicPreferences.userId, userId))
        .limit(1);

      const preferencesData = {
        userId,
        selectedGenres: JSON.stringify(selections.selectedGenres),
        selectedArtists: JSON.stringify(selections.selectedArtists),
        selectedTracks: JSON.stringify(selections.selectedTracks),
        spotifyProfileData: JSON.stringify(musicPreferences),
        lastSpotifySync: new Date(),
        preferencesVersion: 1,
        updatedAt: new Date(),
      };

      let result;

      if (existingPreferences.length > 0) {
        // Mettre à jour les préférences existantes
        result = await db
          .update(userMusicPreferences)
          .set(preferencesData)
          .where(eq(userMusicPreferences.userId, userId))
          .returning();
      } else {
        // Créer de nouvelles préférences
        result = await db
          .insert(userMusicPreferences)
          .values({
            id: uuidv4(),
            ...preferencesData,
            createdAt: new Date(),
          })
          .returning();
      }

      const savedPreferences = result[0];

      return {
        id: savedPreferences.id,
        userId: savedPreferences.userId,
        selectedGenres:
          this.safeJsonParse(savedPreferences.selectedGenres) || [],
        selectedArtists:
          this.safeJsonParse(savedPreferences.selectedArtists) || [],
        selectedTracks:
          this.safeJsonParse(savedPreferences.selectedTracks) || [],
        spotifyProfileData: savedPreferences.spotifyProfileData
          ? this.safeJsonParse(savedPreferences.spotifyProfileData)
          : undefined,
        lastSpotifySync: savedPreferences.lastSpotifySync || undefined,
        preferencesVersion: savedPreferences.preferencesVersion,
        createdAt: savedPreferences.createdAt,
        updatedAt: savedPreferences.updatedAt,
      };
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
      const preferences = await db
        .select()
        .from(userMusicPreferences)
        .where(eq(userMusicPreferences.userId, userId))
        .limit(1);

      if (preferences.length === 0) {
        return null;
      }

      const userPrefs = preferences[0];

      return {
        id: userPrefs.id,
        userId: userPrefs.userId,
        selectedGenres: this.safeJsonParse(userPrefs.selectedGenres) || [],
        selectedArtists: this.safeJsonParse(userPrefs.selectedArtists) || [],
        selectedTracks: this.safeJsonParse(userPrefs.selectedTracks) || [],
        spotifyProfileData: userPrefs.spotifyProfileData
          ? this.safeJsonParse(userPrefs.spotifyProfileData)
          : undefined,
        lastSpotifySync: userPrefs.lastSpotifySync || undefined,
        preferencesVersion: userPrefs.preferencesVersion,
        createdAt: userPrefs.createdAt,
        updatedAt: userPrefs.updatedAt,
      };
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
      const result = await db
        .delete(userMusicPreferences)
        .where(eq(userMusicPreferences.userId, userId))
        .returning();

      return result.length > 0;
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
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (selections.selectedGenres) {
        updateData.selectedGenres = JSON.stringify(selections.selectedGenres);
      }
      if (selections.selectedArtists) {
        updateData.selectedArtists = JSON.stringify(selections.selectedArtists);
      }
      if (selections.selectedTracks) {
        updateData.selectedTracks = JSON.stringify(selections.selectedTracks);
      }

      const result = await db
        .update(userMusicPreferences)
        .set(updateData)
        .where(eq(userMusicPreferences.userId, userId))
        .returning();

      if (result.length === 0) {
        return null;
      }

      const updatedPrefs = result[0];

      return {
        id: updatedPrefs.id,
        userId: updatedPrefs.userId,
        selectedGenres: this.safeJsonParse(updatedPrefs.selectedGenres) || [],
        selectedArtists: this.safeJsonParse(updatedPrefs.selectedArtists) || [],
        selectedTracks: this.safeJsonParse(updatedPrefs.selectedTracks) || [],
        spotifyProfileData: updatedPrefs.spotifyProfileData
          ? this.safeJsonParse(updatedPrefs.spotifyProfileData)
          : undefined,
        lastSpotifySync: updatedPrefs.lastSpotifySync || undefined,
        preferencesVersion: updatedPrefs.preferencesVersion,
        createdAt: updatedPrefs.createdAt,
        updatedAt: updatedPrefs.updatedAt,
      };
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
      console.log("🔍 Vérification préférences pour userId:", userId);

      const preferences = await db
        .select({ id: userMusicPreferences.id })
        .from(userMusicPreferences)
        .where(eq(userMusicPreferences.userId, userId))
        .limit(1);

      console.log("📊 Résultats trouvés:", preferences.length);
      console.log("📝 Données trouvées:", preferences);

      const hasPrefs = preferences.length > 0;
      console.log("✅ A des préférences:", hasPrefs);

      return hasPrefs;
    } catch (error) {
      console.error("❌ Erreur vérification préférences musicales:", error);
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
      const preferences = await this.getUserMusicPreferences(userId);

      if (!preferences) {
        return null;
      }

      return {
        totalGenres: preferences.selectedGenres.filter((g) => g.selected)
          .length,
        totalArtists: preferences.selectedArtists.filter((a) => a.selected)
          .length,
        totalTracks: preferences.selectedTracks.filter((t) => t.selected)
          .length,
        lastUpdated: preferences.updatedAt,
      };
    } catch (error) {
      console.error("Error getting user preferences stats:", error);
      return null;
    }
  }
}

// Export d'une instance unique du service
export const userPreferencesService = new UserPreferencesService();
