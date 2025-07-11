import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "../lib/auth-client";
import { spotifyService, MusicPreferences } from "../lib/spotify-service";

const { width } = Dimensions.get("window");

export default function MusicPreferencesScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<MusicPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "short_term" | "medium_term" | "long_term"
  >("medium_term");

  useEffect(() => {
    loadMusicPreferences();
  }, [selectedTimeRange]);

  const loadMusicPreferences = async () => {
    try {
      setLoading(true);
      console.log("🎵 Chargement des préférences musicales...");

      const data = await spotifyService.getMusicPreferences();

      if (data) {
        setPreferences(data);
        console.log("✅ Préférences chargées avec succès");
      } else {
        console.log("❌ Impossible de charger les préférences");
        Alert.alert(
          "Erreur",
          "Impossible de récupérer vos préférences musicales. Assurez-vous d'être connecté avec Spotify."
        );
      }
    } catch (error) {
      console.error("❌ Erreur chargement préférences:", error);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors du chargement de vos préférences musicales."
      );
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case "short_term":
        return "4 dernières semaines";
      case "medium_term":
        return "6 derniers mois";
      case "long_term":
        return "Plusieurs années";
      default:
        return range;
    }
  };

  const renderGenreChart = () => {
    if (!preferences?.topGenres.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎭 Tes genres préférés</Text>
        <View style={styles.genreContainer}>
          {preferences.topGenres.map((genre, index) => (
            <View key={genre.genre} style={styles.genreItem}>
              <View style={styles.genreHeader}>
                <Text style={styles.genreName}>
                  {index + 1}. {genre.genre}
                </Text>
                <Text style={styles.genrePercentage}>{genre.percentage}%</Text>
              </View>
              <View style={styles.genreBar}>
                <View
                  style={[
                    styles.genreBarFill,
                    { width: `${genre.percentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.genreCount}>{genre.count} artistes</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderArtistCard = (artist: any, index: number) => {
    const imageUrl = artist.images?.[0]?.url;

    return (
      <View key={artist.id} style={styles.artistCard}>
        <Text style={styles.artistRank}>#{index + 1}</Text>
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.artistImage} />
        )}
        <Text style={styles.artistName} numberOfLines={2}>
          {artist.name}
        </Text>
        <Text style={styles.artistGenres} numberOfLines={1}>
          {artist.genres.slice(0, 2).join(", ")}
        </Text>
        <Text style={styles.artistPopularity}>
          Popularité: {artist.popularity}/100
        </Text>
      </View>
    );
  };

  const renderTrackCard = (track: any, index: number) => {
    const imageUrl = track.album?.images?.[0]?.url;

    return (
      <View key={track.id} style={styles.trackCard}>
        <Text style={styles.trackRank}>#{index + 1}</Text>
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.trackImage} />
        )}
        <View style={styles.trackInfo}>
          <Text style={styles.trackName} numberOfLines={1}>
            {track.name}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {track.artists.map((a: any) => a.name).join(", ")}
          </Text>
          <Text style={styles.trackAlbum} numberOfLines={1}>
            {track.album.name}
          </Text>
        </View>
      </View>
    );
  };

  if (!session?.user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Vous devez être connecté pour voir vos préférences musicales
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.buttonText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎵 Tes goûts musicaux</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.loadingText}>
            Analyse de tes goûts musicaux...
          </Text>
        </View>
      ) : preferences ? (
        <>
          {/* Profil utilisateur */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Profil Spotify</Text>
            <View style={styles.profileContainer}>
              {preferences.profile.images?.[0] && (
                <Image
                  source={{ uri: preferences.profile.images[0].url }}
                  style={styles.profileImage}
                />
              )}
              <View style={styles.profileInfo}>
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
          </View>

          {/* Filtre période */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Période d'analyse</Text>
            <View style={styles.timeRangeContainer}>
              {(["short_term", "medium_term", "long_term"] as const).map(
                (range) => (
                  <TouchableOpacity
                    key={range}
                    style={[
                      styles.timeRangeButton,
                      selectedTimeRange === range &&
                        styles.timeRangeButtonActive,
                    ]}
                    onPress={() => setSelectedTimeRange(range)}
                  >
                    <Text
                      style={[
                        styles.timeRangeButtonText,
                        selectedTimeRange === range &&
                          styles.timeRangeButtonTextActive,
                      ]}
                    >
                      {getTimeRangeLabel(range)}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>

          {/* Genres préférés */}
          {renderGenreChart()}

          {/* Top artistes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎤 Tes artistes préférés</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.artistsScroll}
            >
              {preferences.topArtists.map((artist, index) =>
                renderArtistCard(artist, index)
              )}
            </ScrollView>
          </View>

          {/* Top tracks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎵 Tes titres préférés</Text>
            <View style={styles.tracksContainer}>
              {preferences.topTracks
                .slice(0, 10)
                .map((track, index) => renderTrackCard(track, index))}
            </View>
          </View>
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Impossible de charger vos préférences musicales
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={loadMusicPreferences}
          >
            <Text style={styles.buttonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 50,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 15,
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
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 10,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
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
  timeRangeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeRangeButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    alignItems: "center",
  },
  timeRangeButtonActive: {
    backgroundColor: "#1DB954",
  },
  timeRangeButtonText: {
    color: "#b3b3b3",
    fontSize: 12,
    textAlign: "center",
  },
  timeRangeButtonTextActive: {
    color: "#000",
    fontWeight: "bold",
  },
  genreContainer: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 10,
  },
  genreItem: {
    marginBottom: 15,
  },
  genreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  genreName: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  genrePercentage: {
    fontSize: 14,
    color: "#1DB954",
    fontWeight: "bold",
  },
  genreBar: {
    height: 6,
    backgroundColor: "#333",
    borderRadius: 3,
    marginBottom: 5,
  },
  genreBarFill: {
    height: "100%",
    backgroundColor: "#1DB954",
    borderRadius: 3,
  },
  genreCount: {
    fontSize: 12,
    color: "#b3b3b3",
  },
  artistsScroll: {
    paddingLeft: 0,
  },
  artistCard: {
    width: 140,
    backgroundColor: "#1a1a1a",
    padding: 10,
    borderRadius: 10,
    marginRight: 15,
    alignItems: "center",
  },
  artistRank: {
    fontSize: 12,
    color: "#1DB954",
    fontWeight: "bold",
    alignSelf: "flex-start",
  },
  artistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginVertical: 10,
  },
  artistName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 5,
  },
  artistGenres: {
    fontSize: 12,
    color: "#b3b3b3",
    textAlign: "center",
    marginBottom: 5,
  },
  artistPopularity: {
    fontSize: 11,
    color: "#1DB954",
    textAlign: "center",
  },
  tracksContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    overflow: "hidden",
  },
  trackCard: {
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
  trackImage: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 15,
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  trackArtist: {
    fontSize: 14,
    color: "#b3b3b3",
    marginTop: 2,
  },
  trackAlbum: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 50,
  },
  errorText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#1DB954",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});
