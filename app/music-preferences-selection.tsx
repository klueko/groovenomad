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
  Modal,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "../lib/auth-client";
import { spotifyService, MusicPreferences } from "../lib/spotify-service";
import {
  userPreferencesService,
  SelectedGenre,
  SelectedArtist,
  SelectedTrack,
} from "../lib/user-preferences-service";
import { FestiFunColors, FestiFunTypography } from "../lib/design-system";

const { width, height } = Dimensions.get("window");

export default function MusicPreferencesSelectionScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const [spotifyPreferences, setSpotifyPreferences] =
    useState<MusicPreferences | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<SelectedGenre[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<SelectedArtist[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<SelectedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState<"genres" | "artists">("genres");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (session?.user) {
      loadSpotifyPreferences();
    }
  }, [session]);

  const loadSpotifyPreferences = async () => {
    try {
      setLoading(true);
      console.log("🎵 Chargement des préférences Spotify...");

      const preferences = await spotifyService.getMusicPreferences();

      if (!preferences) {
        Alert.alert(
          "Erreur",
          "Impossible de récupérer vos préférences Spotify. Veuillez vous reconnecter."
        );
        router.push("/login");
        return;
      }

      setSpotifyPreferences(preferences);

      // Convertir en format sélectionnable
      const selectableGenres: SelectedGenre[] = preferences.topGenres.map(
        (genre) => ({
          ...genre,
          selected: true, // Par défaut, tout est sélectionné
        })
      );

      const selectableArtists: SelectedArtist[] = preferences.topArtists.map(
        (artist) => ({
          id: artist.id,
          name: artist.name,
          genres: artist.genres,
          popularity: artist.popularity,
          images: artist.images,
          external_urls: artist.external_urls,
          selected: true, // Par défaut, tout est sélectionné
        })
      );

      const selectableTracks: SelectedTrack[] = preferences.topTracks.map(
        (track) => ({
          id: track.id,
          name: track.name,
          artists: track.artists,
          album: {
            id: track.album.name, // Utiliser le nom comme ID par défaut
            name: track.album.name,
            images: track.album.images,
          },
          preview_url: null, // SpotifyTrack n'a pas preview_url
          external_urls: track.external_urls,
          selected: true, // Par défaut, tout est sélectionné
        })
      );

      setSelectedGenres(selectableGenres);
      setSelectedArtists(selectableArtists);
      setSelectedTracks(selectableTracks);

      console.log("✅ Préférences Spotify chargées:", {
        genres: selectableGenres.length,
        artists: selectableArtists.length,
        tracks: selectableTracks.length,
      });
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

  const toggleGenreSelection = (genreIndex: number) => {
    setSelectedGenres((prev) =>
      prev.map((genre, index) =>
        index === genreIndex ? { ...genre, selected: !genre.selected } : genre
      )
    );
  };

  const toggleArtistSelection = (artistIndex: number) => {
    setSelectedArtists((prev) =>
      prev.map((artist, index) =>
        index === artistIndex
          ? { ...artist, selected: !artist.selected }
          : artist
      )
    );
  };

  const savePreferences = async () => {
    if (!session?.user || !spotifyPreferences) {
      Alert.alert("Erreur", "Session utilisateur non trouvée");
      return;
    }

    try {
      setSaving(true);
      console.log("💾 Sauvegarde des préférences sélectionnées...");

      const result = await userPreferencesService.saveUserMusicPreferences(
        session.user.id,
        spotifyPreferences,
        {
          selectedGenres,
          selectedArtists,
          selectedTracks,
        }
      );

      if (result) {
        console.log("✅ Préférences sauvegardées avec succès");
        showSuccessModalWithAnimation();
      } else {
        throw new Error("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("❌ Erreur sauvegarde:", error);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors de la sauvegarde de vos préférences."
      );
    } finally {
      setSaving(false);
    }
  };

  const showSuccessModalWithAnimation = () => {
    setShowSuccessModal(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const hideSuccessModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccessModal(false);
      router.replace("/home");
    });
  };

  const getSelectedCount = () => {
    const genresCount = selectedGenres.filter((g) => g.selected).length;
    const artistsCount = selectedArtists.filter((a) => a.selected).length;
    return { genres: genresCount, artists: artistsCount };
  };

  const renderGenreItem = (genre: SelectedGenre, index: number) => {
    return (
      <TouchableOpacity
        key={genre.genre}
        style={[
          styles.preferenceItem,
          genre.selected ? styles.selectedItem : styles.unselectedItem,
        ]}
        onPress={() => toggleGenreSelection(index)}
      >
        <View style={styles.itemContent}>
          <Text
            style={[
              styles.itemTitle,
              genre.selected ? styles.selectedText : styles.unselectedText,
            ]}
          >
            {genre.genre}
          </Text>
          <Text
            style={[
              styles.itemSubtitle,
              genre.selected
                ? styles.selectedSubtext
                : styles.unselectedSubtext,
            ]}
          >
            {genre.percentage}% de votre écoute
          </Text>
        </View>
        <View
          style={[
            styles.checkbox,
            genre.selected ? styles.checkedBox : styles.uncheckedBox,
          ]}
        >
          {genre.selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  const renderArtistItem = (artist: SelectedArtist, index: number) => {
    const imageUrl = artist.images?.[0]?.url;

    return (
      <TouchableOpacity
        key={artist.id}
        style={[
          styles.preferenceItem,
          artist.selected ? styles.selectedItem : styles.unselectedItem,
        ]}
        onPress={() => toggleArtistSelection(index)}
      >
        <View style={styles.artistContent}>
          {imageUrl && (
            <Image source={{ uri: imageUrl }} style={styles.artistImage} />
          )}
          <View style={styles.artistInfo}>
            <Text
              style={[
                styles.itemTitle,
                artist.selected ? styles.selectedText : styles.unselectedText,
              ]}
            >
              {artist.name}
            </Text>
            <Text
              style={[
                styles.itemSubtitle,
                artist.selected
                  ? styles.selectedSubtext
                  : styles.unselectedSubtext,
              ]}
            >
              {artist.genres.slice(0, 2).join(", ")}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.checkbox,
            artist.selected ? styles.checkedBox : styles.uncheckedBox,
          ]}
        >
          {artist.selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  if (!session?.user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Vous devez être connecté pour configurer vos préférences
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.primaryButtonText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          style={styles.pedroLoadingImage}
          resizeMode="contain"
          source={require("./assets/pedropedropedro.png")}
        />
        <Text style={styles.loadingTitle}>
          🎵 Analyse de vos goûts musicaux...
        </Text>
        <Text style={styles.loadingSubtitle}>
          Pedro récupère vos artistes et genres préférés depuis Spotify
        </Text>
        <ActivityIndicator
          size="large"
          color={FestiFunColors.primary}
          style={styles.loadingSpinner}
        />
      </View>
    );
  }

  const selectedCount = getSelectedCount();

  return (
    <View style={styles.container}>
      {/* En-tête avec Pedro */}
      <View style={styles.header}>
        <Image
          style={styles.pedroHeaderImage}
          resizeMode="contain"
          source={require("./assets/pedropedropedro.png")}
        />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Personnalisez vos goûts</Text>
          <Text style={styles.headerSubtitle}>
            Pedro a analysé votre Spotify ! Désélectionnez ce qui ne vous
            intéresse pas.
          </Text>
        </View>
      </View>

      {/* Onglets */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            currentTab === "genres" ? styles.activeTab : styles.inactiveTab,
          ]}
          onPress={() => setCurrentTab("genres")}
        >
          <Text
            style={[
              styles.tabText,
              currentTab === "genres"
                ? styles.activeTabText
                : styles.inactiveTabText,
            ]}
          >
            🎭 Genres ({selectedCount.genres})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            currentTab === "artists" ? styles.activeTab : styles.inactiveTab,
          ]}
          onPress={() => setCurrentTab("artists")}
        >
          <Text
            style={[
              styles.tabText,
              currentTab === "artists"
                ? styles.activeTabText
                : styles.inactiveTabText,
            ]}
          >
            🎤 Artistes ({selectedCount.artists})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenu principal */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {currentTab === "genres" && (
          <View style={styles.section}>
            {selectedGenres.map((genre, index) =>
              renderGenreItem(genre, index)
            )}
          </View>
        )}

        {currentTab === "artists" && (
          <View style={styles.section}>
            {selectedArtists.map((artist, index) =>
              renderArtistItem(artist, index)
            )}
          </View>
        )}
      </ScrollView>

      {/* Bouton de sauvegarde fixe */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={savePreferences}
          disabled={saving}
        >
          {saving ? (
            <>
              <ActivityIndicator
                size="small"
                color={FestiFunColors.background}
              />
              <Text style={styles.saveButtonText}> Sauvegarde...</Text>
            </>
          ) : (
            <Text style={styles.saveButtonText}>
              ✅ Sauvegarder et continuer
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de succès personnalisée */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="none"
        onRequestClose={hideSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [
                  {
                    scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                opacity: modalAnimation,
              },
            ]}
          >
            {/* Pedro célébrant */}
            <View style={styles.modalHeader}>
              <Image
                style={styles.pedroSuccessImage}
                resizeMode="contain"
                source={require("./assets/pedropedropedro.png")}
              />
              <Text style={styles.successEmoji}>🎉</Text>
            </View>

            {/* Contenu principal */}
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Bravo ! 🎉</Text>
              <Text style={styles.modalSubtitle}>
                Vos préférences musicales ont été configurées avec succès !
              </Text>
              <Text style={styles.modalDescription}>
                Pedro peut maintenant vous recommander les festivals parfaits
                selon vos goûts musicaux.
              </Text>
            </View>

            {/* Statistiques */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{selectedCount.genres}</Text>
                <Text style={styles.statLabel}>Genres</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{selectedCount.artists}</Text>
                <Text style={styles.statLabel}>Artistes</Text>
              </View>
            </View>

            {/* Bouton d'action */}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={hideSuccessModal}
            >
              <Text style={styles.modalButtonText}>
                🎪 Découvrir mes festivals
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FestiFunColors.primaryDark, // #18002B
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: FestiFunColors.primaryDark,
    paddingHorizontal: 24,
  },

  pedroLoadingImage: {
    width: 150,
    height: 150,
    marginBottom: 32,
  },

  loadingTitle: {
    fontSize: 24,
    fontFamily: FestiFunTypography.title.fontFamily,
    color: FestiFunColors.background,
    textAlign: "center",
    marginBottom: 12,
  },

  loadingSubtitle: {
    fontSize: 16,
    fontFamily: FestiFunTypography.body.fontFamily,
    color: "#ad9cbb",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },

  loadingSpinner: {
    marginTop: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: FestiFunColors.primaryDark,
  },

  pedroHeaderImage: {
    width: 80,
    height: 80,
    marginRight: 16,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 24,
    fontFamily: FestiFunTypography.title.fontFamily,
    color: FestiFunColors.background,
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 14,
    fontFamily: FestiFunTypography.body.fontFamily,
    color: "#ad9cbb",
    lineHeight: 20,
  },

  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
  },

  activeTab: {
    backgroundColor: FestiFunColors.primary,
  },

  inactiveTab: {
    backgroundColor: FestiFunColors.secondaryDark,
    borderWidth: 2,
    borderColor: "#ad9cbb",
  },

  tabText: {
    fontSize: 16,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
  },

  activeTabText: {
    color: FestiFunColors.background,
  },

  inactiveTabText: {
    color: "#ad9cbb",
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Pour laisser de la place au bouton fixe
  },

  section: {
    gap: 12,
  },

  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
  },

  selectedItem: {
    backgroundColor: FestiFunColors.primary + "20",
    borderColor: FestiFunColors.primary,
  },

  unselectedItem: {
    backgroundColor: FestiFunColors.secondaryDark,
    borderColor: "#ad9cbb",
  },

  itemContent: {
    flex: 1,
  },

  artistContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  artistImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },

  artistInfo: {
    flex: 1,
  },

  itemTitle: {
    fontSize: 16,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
    marginBottom: 4,
    textTransform: "capitalize",
  },

  itemSubtitle: {
    fontSize: 14,
    fontFamily: FestiFunTypography.body.fontFamily,
  },

  selectedText: {
    color: FestiFunColors.background,
  },

  unselectedText: {
    color: "#ad9cbb",
  },

  selectedSubtext: {
    color: FestiFunColors.background + "CC",
  },

  unselectedSubtext: {
    color: "#8a7a9a",
  },

  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },

  checkedBox: {
    backgroundColor: FestiFunColors.primary,
  },

  uncheckedBox: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#ad9cbb",
  },

  checkmark: {
    color: FestiFunColors.background,
    fontSize: 16,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
  },

  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: FestiFunColors.primaryDark,
    borderTopWidth: 1,
    borderTopColor: FestiFunColors.secondaryDark,
  },

  saveButton: {
    backgroundColor: FestiFunColors.primary,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },

  saveButtonText: {
    fontSize: 18,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
    color: FestiFunColors.background,
  },

  primaryButton: {
    backgroundColor: FestiFunColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },

  primaryButtonText: {
    fontSize: 16,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
    color: FestiFunColors.background,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  errorText: {
    fontSize: 16,
    fontFamily: FestiFunTypography.body.fontFamily,
    color: FestiFunColors.background,
    textAlign: "center",
    marginBottom: 16,
  },

  // Styles pour la modal de succès
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  modalContainer: {
    backgroundColor: FestiFunColors.background,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    maxWidth: width - 48,
    width: "100%",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },

  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },

  pedroSuccessImage: {
    width: 120,
    height: 120,
  },

  successEmoji: {
    position: "absolute",
    top: -10,
    right: -10,
    fontSize: 32,
    backgroundColor: FestiFunColors.primary,
    borderRadius: 20,
    padding: 8,
    overflow: "hidden",
  },

  modalContent: {
    alignItems: "center",
    marginBottom: 24,
  },

  modalTitle: {
    fontSize: 28,
    fontFamily: FestiFunTypography.title.fontFamily,
    color: FestiFunColors.primaryDark,
    textAlign: "center",
    marginBottom: 8,
  },

  modalSubtitle: {
    fontSize: 18,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
    color: FestiFunColors.primaryDark,
    textAlign: "center",
    marginBottom: 12,
  },

  modalDescription: {
    fontSize: 16,
    fontFamily: FestiFunTypography.body.fontFamily,
    color: FestiFunColors.primary,
    textAlign: "center",
    lineHeight: 22,
  },

  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: FestiFunColors.primaryDark + "10",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: "100%",
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: FestiFunColors.primary + "30",
    marginHorizontal: 20,
  },

  statNumber: {
    fontSize: 24,
    fontFamily: FestiFunTypography.title.fontFamily,
    color: FestiFunColors.primary,
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 14,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
    color: FestiFunColors.primaryDark,
  },

  modalButton: {
    backgroundColor: FestiFunColors.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    width: "100%",
  },

  modalButtonText: {
    fontSize: 18,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
    color: FestiFunColors.background,
  },
});
