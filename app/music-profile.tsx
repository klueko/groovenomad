import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "../lib/auth-client";
import { spotifyService, MusicPreferences } from "../lib/spotify-service";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function MusicProfileScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const [musicPreferences, setMusicPreferences] =
    useState<MusicPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      loadMusicProfile();
    }
  }, [session]);

  const loadMusicProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🎵 Chargement du profil musical...");
      const preferences = await spotifyService.getMusicPreferences();

      if (!preferences) {
        throw new Error("Impossible de récupérer votre profil musical Spotify");
      }

      setMusicPreferences(preferences);
      console.log("✅ Profil musical chargé:", {
        artists: preferences.topArtists.length,
        genres: preferences.topGenres.length,
        tracks: preferences.topTracks.length,
      });
    } catch (err) {
      console.error("❌ Erreur chargement profil:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du profil"
      );
    } finally {
      setLoading(false);
    }
  };

  const navigateToRecommendations = () => {
    console.log("🎪 Navigation vers les recommandations...");
    router.push("/festival-recommendations");
  };

  const renderTopArtists = () => {
    if (!musicPreferences?.topArtists.length) return null;

    const topArtists = musicPreferences.topArtists.slice(0, 12);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎤 Vos Artistes Préférés</Text>
        <Text style={styles.sectionSubtitle}>
          Basé sur vos écoutes récentes sur Spotify
        </Text>

        <View style={styles.artistsGrid}>
          {topArtists.map((artist, index) => (
            <View key={artist.id} style={styles.artistCard}>
              {artist.images && artist.images.length > 0 && (
                <Image
                  source={{ uri: artist.images[0].url }}
                  style={styles.artistImage}
                />
              )}
              <Text style={styles.artistName} numberOfLines={2}>
                {artist.name}
              </Text>
              <View style={styles.popularityBadge}>
                <Text style={styles.popularityText}>#{index + 1}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTopGenres = () => {
    if (!musicPreferences?.topGenres.length) return null;

    const topGenres = musicPreferences.topGenres.slice(0, 15);

    // Couleurs pour les genres
    const genreColors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E9",
      "#F8C471",
      "#82E0AA",
      "#F1948A",
      "#85C1E9",
      "#D2B4DE",
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎵 Vos Genres Musicaux</Text>
        <Text style={styles.sectionSubtitle}>
          Nous avons identifié {topGenres.length} genres dans vos goûts
        </Text>

        <View style={styles.genresContainer}>
          {topGenres.map((genre, index) => (
            <TouchableOpacity
              key={genre.genre}
              style={[
                styles.genreTag,
                { backgroundColor: genreColors[index % genreColors.length] },
              ]}
            >
              <Text style={styles.genreText}>{genre.genre}</Text>
              <Text style={styles.genreCount}>
                {Math.round(genre.percentage)}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderMusicSummary = () => {
    if (!musicPreferences) return null;

    const totalTracks = musicPreferences.topTracks.length;
    const totalArtists = musicPreferences.topArtists.length;
    const totalGenres = musicPreferences.topGenres.length;

    return (
      <View style={styles.summarySection}>
        <LinearGradient
          colors={["#1DB954", "#1ed760"]}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryTitle}>🎯 Votre Profil Musical</Text>
          <Text style={styles.summarySubtitle}>
            Salut {musicPreferences.profile?.display_name || "Mélomane"} !
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalArtists}</Text>
              <Text style={styles.statLabel}>Artistes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalGenres}</Text>
              <Text style={styles.statLabel}>Genres</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalTracks}</Text>
              <Text style={styles.statLabel}>Titres</Text>
            </View>
          </View>

          <Text style={styles.summaryDescription}>
            Nous avons analysé vos goûts musicaux pour vous trouver les
            festivals parfaits !
          </Text>
        </LinearGradient>
      </View>
    );
  };

  if (!session?.user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Vous devez être connecté pour voir votre profil musical
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.loginButtonText}>Se connecter avec Spotify</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>
          🎵 Analyse de votre profil musical Spotify...
        </Text>
        <Text style={styles.loadingSubText}>
          Nous découvrons vos artistes et genres préférés
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMusicProfile}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* En-tête */}
      <LinearGradient
        colors={["#1DB954", "#1ed760", "#21e065"]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Votre Profil Musical</Text>
      </LinearGradient>

      {/* Résumé musical */}
      {renderMusicSummary()}

      {/* Top artistes */}
      {renderTopArtists()}

      {/* Top genres */}
      {renderTopGenres()}

      {/* Bouton CTA */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={navigateToRecommendations}
        >
          <LinearGradient
            colors={["#FF6B6B", "#FF8E53"]}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaButtonText}>🎪 Découvrir mes festivals</Text>
            <Text style={styles.ctaButtonSubText}>
              Trouvez des événements parfaits pour vos goûts !
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerTitle: {
    flex: 1,
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginRight: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  loadingSubText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  summarySection: {
    margin: 20,
    marginTop: -10,
  },
  summaryCard: {
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  summarySubtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 5,
  },
  summaryDescription: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 22,
  },
  section: {
    margin: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  artistsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  artistCard: {
    width: (width - 60) / 3,
    marginBottom: 20,
    alignItems: "center",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  artistImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },
  artistName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    minHeight: 30,
  },
  popularityBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#1DB954",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  popularityText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  genresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  genreTag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  genreText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  genreCount: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "500",
  },
  ctaSection: {
    margin: 20,
    marginTop: 30,
    marginBottom: 40,
  },
  ctaButton: {
    borderRadius: 25,
    overflow: "hidden",
  },
  ctaGradient: {
    padding: 25,
    alignItems: "center",
  },
  ctaButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  ctaButtonSubText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    textAlign: "center",
  },
});
