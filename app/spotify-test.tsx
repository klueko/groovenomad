import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  spotifyServiceSimple,
  MusicPreferences,
} from "../lib/spotify-service-simple";

export default function SpotifyTest() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<MusicPreferences | null>(null);
  const [loading, setLoading] = useState(false);

  const testSpotifyAPI = async () => {
    try {
      setLoading(true);
      console.log("🎵 Test de l'API Spotify...");

      const data = await spotifyServiceSimple.getMusicPreferences();

      if (data) {
        setPreferences(data);
        console.log("✅ Données récupérées avec succès");
        Alert.alert("Succès", "Données Spotify récupérées avec succès !");
      } else {
        console.log("❌ Impossible de récupérer les données");
        Alert.alert(
          "Erreur",
          "Impossible de récupérer vos données Spotify. Assurez-vous d'être connecté avec Spotify via l'ancienne méthode."
        );
      }
    } catch (error) {
      console.error("❌ Erreur test Spotify:", error);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors du test de l'API Spotify."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🧪 Test API Spotify</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructions}>
          1. Connectez-vous d'abord avec Spotify via l'ancienne méthode (page de
          connexion)
          {"\n"}2. Revenez sur cette page et cliquez sur "Tester l'API Spotify"
          {"\n"}3. Vos préférences musicales s'afficheront ci-dessous
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={testSpotifyAPI}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <Text style={styles.buttonText}>🎵 Tester l'API Spotify</Text>
        )}
      </TouchableOpacity>

      {preferences && (
        <>
          {/* Profil utilisateur */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Profil Spotify</Text>
            <View style={styles.profileContainer}>
              <Text style={styles.profileName}>
                {preferences.profile.display_name}
              </Text>
              <Text style={styles.profileDetails}>
                {preferences.profile.country} •{" "}
                {preferences.profile.followers.total} followers
              </Text>
              <Text style={styles.profileProduct}>
                {preferences.profile.product}
              </Text>
            </View>
          </View>

          {/* Genres préférés */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎭 Genres préférés</Text>
            <View style={styles.genreContainer}>
              {preferences.topGenres.map((genre, index) => (
                <View key={genre.genre} style={styles.genreItem}>
                  <Text style={styles.genreName}>
                    {index + 1}. {genre.genre}
                  </Text>
                  <Text style={styles.genrePercentage}>
                    {genre.percentage}%
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Top artistes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎤 Top artistes</Text>
            <View style={styles.artistContainer}>
              {preferences.topArtists.slice(0, 10).map((artist, index) => (
                <View key={artist.id} style={styles.artistItem}>
                  <Text style={styles.artistRank}>#{index + 1}</Text>
                  <Text style={styles.artistName}>{artist.name}</Text>
                  <Text style={styles.artistGenres}>
                    {artist.genres.slice(0, 2).join(", ")}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Top tracks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎵 Top tracks</Text>
            <View style={styles.trackContainer}>
              {preferences.topTracks.slice(0, 10).map((track, index) => (
                <View key={track.id} style={styles.trackItem}>
                  <Text style={styles.trackRank}>#{index + 1}</Text>
                  <Text style={styles.trackName}>{track.name}</Text>
                  <Text style={styles.trackArtist}>
                    {track.artists.map((a) => a.name).join(", ")}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: "#1DB954",
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  instructions: {
    fontSize: 14,
    color: "#b3b3b3",
    lineHeight: 20,
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 10,
  },
  button: {
    backgroundColor: "#1DB954",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginHorizontal: 20,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  profileContainer: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  profileDetails: {
    fontSize: 14,
    color: "#b3b3b3",
    marginTop: 5,
  },
  profileProduct: {
    fontSize: 12,
    color: "#1DB954",
    marginTop: 5,
    textTransform: "uppercase",
  },
  genreContainer: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 10,
  },
  genreItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  genreName: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    textTransform: "capitalize",
    flex: 1,
  },
  genrePercentage: {
    fontSize: 14,
    color: "#1DB954",
    fontWeight: "bold",
  },
  artistContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    overflow: "hidden",
  },
  artistItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  artistRank: {
    fontSize: 14,
    color: "#1DB954",
    fontWeight: "bold",
    width: 30,
  },
  artistName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  artistGenres: {
    fontSize: 12,
    color: "#b3b3b3",
  },
  trackContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    overflow: "hidden",
  },
  trackItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  trackRank: {
    fontSize: 14,
    color: "#1DB954",
    fontWeight: "bold",
    width: 30,
  },
  trackName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  trackArtist: {
    fontSize: 12,
    color: "#b3b3b3",
  },
});
