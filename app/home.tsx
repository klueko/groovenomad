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
  StatusBar,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "../lib/auth-client";
import { MapPin, Search, X } from "lucide-react-native";
import { FestiFunColors, FestiFunTypography } from "../lib/design-system";
import {
  festivalMatcher,
  FestivalMatch,
  StoredUserPreferences,
} from "../lib/festival-matcher";
import { userPreferencesService } from "../lib/user-preferences-service";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import des nouveaux composants
import BottomNavigation from "../components/BottomNavigation";
import FestivalCard from "../components/FestivalCard";
import DateRangePicker from "../components/DateRangePicker";

const { width, height } = Dimensions.get("window");

// Constantes pour le cache
const CACHE_KEY_PREFIX = "festival_cache_";
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 heures en millisecondes

interface UserLocation {
  city: string;
  country: string;
  countryCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface CachedFestivalData {
  festivals: FestivalMatch[];
  availableGenres: string[];
  userArtists: any[];
  timestamp: number;
  userId: string;
}

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const [festivals, setFestivals] = useState<FestivalMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("Tous");
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({
    startDate: new Date(),
    endDate: (() => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 365);
      return endDate;
    })(),
  });
  const [hasPreferences, setHasPreferences] = useState(false);
  const [userArtists, setUserArtists] = useState<any[]>([]);
  const [availableGenres, setAvailableGenres] = useState<string[]>(["Tous"]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [newLocationCity, setNewLocationCity] = useState("");
  const [newLocationCountry, setNewLocationCountry] = useState("");

  // Fonction pour capitaliser la première lettre
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Fonctions utilitaires pour le cache
  const getCacheKey = (userId: string) => `${CACHE_KEY_PREFIX}${userId}`;

  const isCacheValid = (timestamp: number): boolean => {
    const now = Date.now();
    return now - timestamp < CACHE_DURATION;
  };

  const saveFestivalsToCache = async (
    userId: string,
    festivals: FestivalMatch[],
    availableGenres: string[],
    userArtists: any[]
  ) => {
    try {
      const cacheData: CachedFestivalData = {
        festivals,
        availableGenres,
        userArtists,
        timestamp: Date.now(),
        userId,
      };
      await AsyncStorage.setItem(
        getCacheKey(userId),
        JSON.stringify(cacheData)
      );
      console.log(
        "🗂️ [Cache] Données sauvegardées en cache pour l'utilisateur:",
        userId
      );
    } catch (error) {
      console.error("❌ [Cache] Erreur sauvegarde cache:", error);
    }
  };

  const loadFestivalsFromCache = async (
    userId: string
  ): Promise<CachedFestivalData | null> => {
    try {
      const cachedData = await AsyncStorage.getItem(getCacheKey(userId));
      if (!cachedData) {
        console.log("🗂️ [Cache] Aucune donnée en cache trouvée");
        return null;
      }

      const parsedData: CachedFestivalData = JSON.parse(cachedData);

      // Vérifier si le cache est valide
      if (!isCacheValid(parsedData.timestamp)) {
        console.log("🗂️ [Cache] Cache expiré, suppression...");
        await AsyncStorage.removeItem(getCacheKey(userId));
        return null;
      }

      // Vérifier si c'est le bon utilisateur
      if (parsedData.userId !== userId) {
        console.log(
          "🗂️ [Cache] Cache pour un autre utilisateur, suppression..."
        );
        await AsyncStorage.removeItem(getCacheKey(userId));
        return null;
      }

      console.log("🗂️ [Cache] Données valides trouvées en cache");
      return parsedData;
    } catch (error) {
      console.error("❌ [Cache] Erreur lecture cache:", error);
      return null;
    }
  };

  const clearFestivalsCache = async (userId: string) => {
    try {
      await AsyncStorage.removeItem(getCacheKey(userId));
      console.log("🗂️ [Cache] Cache supprimé pour l'utilisateur:", userId);
    } catch (error) {
      console.error("❌ [Cache] Erreur suppression cache:", error);
    }
  };

  // Fonction pour obtenir la géolocalisation
  const getCurrentLocation = async (): Promise<UserLocation | null> => {
    try {
      // Demander la permission de géolocalisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission de géolocalisation refusée");
        return {
          city: "Paris",
          country: "France",
          countryCode: "FR",
        };
      }

      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({});

      // Faire du géocodage inverse pour obtenir l'adresse
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        return {
          city: address.city || "Ville inconnue",
          country: address.country || "Pays inconnu",
          countryCode: address.isoCountryCode || "XX",
          coordinates: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        };
      }
    } catch (error) {
      console.error("Erreur géolocalisation:", error);
    }

    // Valeur par défaut si erreur
    return {
      city: "Paris",
      country: "France",
      countryCode: "FR",
    };
  };

  useEffect(() => {
    if (session?.user) {
      initializeLocation();
    }
  }, [session]);

  const initializeLocation = async () => {
    const location = await getCurrentLocation();
    setUserLocation(location);
    checkUserPreferences();
  };

  const checkUserPreferences = async () => {
    if (!session?.user) return;

    try {
      console.log(
        "📊 [Home] Vérification préférences pour userId:",
        session.user.id
      );

      const hasConfiguredPrefs =
        await userPreferencesService.hasUserMusicPreferences(session.user.id);

      console.log(
        "📊 [Home] Utilisateur a des préférences configurées:",
        hasConfiguredPrefs
      );
      setHasPreferences(hasConfiguredPrefs);

      // Redirection automatique vers onboarding si pas de préférences configurées
      if (!hasConfiguredPrefs) {
        console.log(
          "🚀 [Home] Redirection vers onboarding - préférences non configurées"
        );
        router.replace("/onboarding");
        return;
      }

      // Si on a des préférences, charger les données
      loadHomeData();
    } catch (error) {
      console.error("❌ [Home] Erreur vérification préférences:", error);
      setHasPreferences(false);
      // En cas d'erreur, on redirige aussi vers onboarding par sécurité
      router.replace("/onboarding");
    }
  };

  const loadHomeData = async (forceRefresh: boolean = false) => {
    if (!session?.user) return;

    try {
      setLoading(true);

      // Essayer de charger depuis le cache d'abord (sauf si refresh forcé)
      if (!forceRefresh) {
        const cachedData = await loadFestivalsFromCache(session.user.id);
        if (cachedData) {
          console.log("🗂️ [Cache] Utilisation des données en cache");
          setFestivals(cachedData.festivals);
          setAvailableGenres(cachedData.availableGenres);
          setUserArtists(cachedData.userArtists);
          setLoading(false);
          return;
        }
      }

      console.log("🔄 [API] Chargement des données depuis l'API...");

      // Récupérer les préférences utilisateur
      const preferences = await userPreferencesService.getUserMusicPreferences(
        session.user.id
      );

      if (!preferences) {
        console.error("❌ Aucune préférence trouvée pour cet utilisateur");
        return;
      }

      // Mapper les préférences au format attendu par festival matcher
      const storedPreferences: StoredUserPreferences = {
        spotifyProfileData: preferences.spotifyProfileData,
        selectedGenres: preferences.selectedGenres.map((g) => ({
          name: g.genre,
          count: g.count,
          percentage: g.percentage,
        })),
        selectedArtists: preferences.selectedArtists.map((a) => ({
          name: a.name,
          id: a.id,
          popularity: a.popularity,
          followers: { total: 0 },
          genres: a.genres,
          images: a.images,
          external_urls: a.external_urls,
        })),
        selectedTracks: preferences.selectedTracks,
      };

      // Charger les festivals recommandés avec les préférences
      const recommendations = await festivalMatcher.findMatchingFestivals(
        storedPreferences,
        {
          maxResults: 50, // Augmenté pour avoir plus de choix
          minMatchScore: 0.1,
          includePopularityBoost: true,
        }
      );

      // Trier et dédupliquer les festivals
      const uniqueFestivals = recommendations.reduce(
        (acc: FestivalMatch[], current) => {
          const existingIndex = acc.findIndex(
            (fest) =>
              fest.name.toLowerCase() === current.name.toLowerCase() &&
              fest.location.city.toLowerCase() ===
                current.location.city.toLowerCase()
          );

          if (existingIndex === -1) {
            acc.push(current);
          } else {
            // Garder celui avec le meilleur score de match
            if (current.matchScore > acc[existingIndex].matchScore) {
              acc[existingIndex] = current;
            }
          }
          return acc;
        },
        []
      );

      // Trier par score de match décroissant
      uniqueFestivals.sort((a, b) => b.matchScore - a.matchScore);

      // Extraire les genres disponibles des festivals récupérés (filtres intelligents)
      const genresFromFestivals = new Set<string>();
      uniqueFestivals.forEach((festival) => {
        festival.matchingGenres.forEach((genre) => {
          if (genre && genre.trim()) {
            genresFromFestivals.add(capitalizeFirst(genre.trim()));
          }
        });
      });

      // Ajouter "Tous" et créer la liste finale des genres
      const availableGenresList = [
        "Tous",
        ...Array.from(genresFromFestivals).sort(),
      ];

      // Préparer les artistes utilisateur
      const userArtistsList = preferences?.selectedArtists || [];

      // Mettre à jour l'état
      setFestivals(uniqueFestivals);
      setAvailableGenres(availableGenresList);
      setUserArtists(userArtistsList);

      // Sauvegarder en cache
      await saveFestivalsToCache(
        session.user.id,
        uniqueFestivals,
        availableGenresList,
        userArtistsList
      );

      console.log("✅ [API] Données chargées et sauvegardées en cache");
    } catch (error) {
      console.error("❌ Erreur chargement données home:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeLocation(); // Réactualiser aussi la localisation
    await loadHomeData(true); // Forcer le rechargement depuis l'API
    setRefreshing(false);
  };

  // Filtrage par genre et plage de dates
  const filteredFestivals = festivals.filter((festival) => {
    // Filtre par genre
    const genreMatch =
      selectedGenre === "Tous" ||
      festival.matchingGenres.some((genre) =>
        capitalizeFirst(genre)
          .toLowerCase()
          .includes(selectedGenre.toLowerCase())
      );

    // Filtre par plage de dates
    const festivalDate = new Date(festival.dates.start);
    const dateMatch =
      !selectedDateRange.startDate ||
      !selectedDateRange.endDate ||
      (festivalDate >= selectedDateRange.startDate &&
        festivalDate <= selectedDateRange.endDate);

    return genreMatch && dateMatch;
  });

  // Séparation intelligente des festivals
  const getPopularFestivals = () => {
    // Populaires = festivals avec haute popularité estimée (top général)
    return filteredFestivals
      .filter((f) => f.estimatedPopularity > 0.7)
      .slice(0, 6);
  };

  const getPersonalizedFestivals = () => {
    // Pour vous = festivals avec bon score de match personnel mais pas forcément très populaires
    const popularIds = new Set(getPopularFestivals().map((f) => f.id));
    return filteredFestivals
      .filter((f) => !popularIds.has(f.id)) // Exclure les populaires
      .filter((f) => f.matchScore > 0.3) // Score de match personnel correct
      .slice(0, 8);
  };

  const handleLocationChange = async () => {
    if (newLocationCity.trim() && newLocationCountry.trim()) {
      setUserLocation({
        city: newLocationCity.trim(),
        country: newLocationCountry.trim(),
        countryCode: "XX", // Code par défaut
      });
      setLocationModalVisible(false);
      setNewLocationCity("");
      setNewLocationCountry("");

      // Vider le cache car la localisation a changé
      if (session?.user) {
        await clearFestivalsCache(session.user.id);
      }

      // Recharger les données avec la nouvelle localisation
      loadHomeData(true); // Forcer le rechargement
    } else {
      Alert.alert("Erreur", "Veuillez renseigner la ville et le pays");
    }
  };

  const renderGenreFilter = (genre: string) => (
    <TouchableOpacity
      key={genre}
      style={[
        styles.genreFilter,
        selectedGenre === genre && styles.genreFilterActive,
      ]}
      onPress={() => setSelectedGenre(genre)}
    >
      <Text
        style={[
          styles.genreFilterText,
          selectedGenre === genre && styles.genreFilterTextActive,
        ]}
      >
        {genre}
      </Text>
    </TouchableOpacity>
  );

  const renderArtistAvatar = (artist: any, index: number) => (
    <TouchableOpacity key={index} style={styles.artistContainer}>
      <Image
        source={{
          uri: artist.images?.[0]?.url || "https://via.placeholder.com/47x47",
        }}
        style={styles.artistImage}
      />
      <Text style={styles.artistName} numberOfLines={1}>
        {artist.name}
      </Text>
    </TouchableOpacity>
  );

  // Écran de chargement avec le design sombre cohérent
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={FestiFunColors.primaryDark}
        />
        <Image
          style={styles.pedroImage}
          resizeMode="contain"
          source={require("./assets/pedropedropedro.png")}
        />
        <Text style={styles.loadingTitle}>🎪 Recherche de festivals...</Text>
        <Text style={styles.loadingSubtitle}>
          Pedro analyse vos goûts pour vous trouver les meilleurs événements !
        </Text>
        <ActivityIndicator size="large" color={FestiFunColors.primary} />
      </View>
    );
  }

  const popularFestivals = getPopularFestivals();
  const personalizedFestivals = getPersonalizedFestivals();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={FestiFunColors.primaryDark}
      />

      {/* Contenu principal scrollable */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec localisation et date */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.locationContainer}
            onPress={() => setLocationModalVisible(true)}
          >
            <View style={styles.locationRow}>
              <MapPin size={16} color={FestiFunColors.background} />
              <Text style={styles.locationText}>
                {userLocation?.city || "Paris"},{" "}
                {userLocation?.country || "France"}
              </Text>
            </View>
            <Text style={styles.locationSubtext}>Appuyez pour changer</Text>
          </TouchableOpacity>

          {/* Utilisation du nouveau composant DateRangePicker */}
          <DateRangePicker
            value={selectedDateRange}
            onChange={setSelectedDateRange}
          />
        </View>

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <TouchableOpacity style={styles.searchBar}>
            <Search size={20} color="#ad9cbb" />
            <Text style={styles.searchPlaceholder}>
              Rechercher un festival...
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filtres de genres intelligents basés sur les festivals récupérés */}
        <View style={styles.genreFiltersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genreFilters}
          >
            {availableGenres.map(renderGenreFilter)}
          </ScrollView>
        </View>

        {/* Section Populaires - Festivals avec haute popularité */}
        {popularFestivals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Populaires</Text>
            <Text style={styles.sectionSubtitle}>
              Les festivals les plus attendus
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.festivalsScrollContent}
            >
              {popularFestivals.map((festival) => (
                <FestivalCard
                  key={festival.id}
                  festival={festival}
                  userLocation={userLocation}
                  onPress={() =>
                    router.push(
                      `/festival-detail?data=${encodeURIComponent(
                        JSON.stringify(festival)
                      )}`
                    )
                  }
                  onLikePress={() =>
                    console.log("Like pressed:", festival.name)
                  }
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Section Vos artistes - Liste complète */}
        {userArtists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vos artistes</Text>
            <Text style={styles.sectionSubtitle}>
              Basé sur vos goûts Spotify
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.artistsScrollContent}
            >
              {userArtists.map(renderArtistAvatar)}
            </ScrollView>
          </View>
        )}

        {/* Section Pour vous - Pleine largeur et personnalisée */}
        {personalizedFestivals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pour vous</Text>
            <Text style={styles.sectionSubtitle}>
              Sélectionnés selon vos préférences musicales
            </Text>
            <View style={styles.forYouGrid}>
              {personalizedFestivals.map((festival) => (
                <FestivalCard
                  key={festival.id}
                  festival={festival}
                  userLocation={userLocation}
                  isFullWidth={true}
                  onPress={() =>
                    router.push(
                      `/festival-detail?data=${encodeURIComponent(
                        JSON.stringify(festival)
                      )}`
                    )
                  }
                  onLikePress={() =>
                    console.log("Like pressed:", festival.name)
                  }
                />
              ))}
            </View>
          </View>
        )}

        {/* Espace pour la bottom nav */}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Modal pour changer la localisation */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={locationModalVisible}
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Changer de localisation</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <X size={24} color={FestiFunColors.background} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Ville</Text>
              <TextInput
                style={styles.textInput}
                value={newLocationCity}
                onChangeText={setNewLocationCity}
                placeholder="Ex: Paris"
                placeholderTextColor="#ad9cbb"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Pays</Text>
              <TextInput
                style={styles.textInput}
                value={newLocationCountry}
                onChangeText={setNewLocationCountry}
                placeholder="Ex: France"
                placeholderTextColor="#ad9cbb"
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleLocationChange}
            >
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.getCurrentLocationButton}
              onPress={async () => {
                setLocationModalVisible(false);
                const location = await getCurrentLocation();
                if (location) {
                  setUserLocation(location);
                  // Vider le cache car la localisation a changé
                  if (session?.user) {
                    await clearFestivalsCache(session.user.id);
                  }
                  loadHomeData(true); // Forcer le rechargement
                }
              }}
            >
              <MapPin size={16} color={FestiFunColors.primary} />
              <Text style={styles.getCurrentLocationText}>
                Utiliser ma position actuelle
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation avec le nouveau composant */}
      <BottomNavigation
        activeTab="home"
        onTabPress={(tab) => {
          if (tab === "profile") {
            router.push("/music-profile");
          } else if (tab === "tickets") {
            router.push("/mes-billets");
          }
          // Ajouter d'autres navigations au fur et à mesure
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FestiFunColors.primaryDark,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: FestiFunColors.primaryDark,
    paddingHorizontal: 24,
    gap: 20,
  },

  pedroImage: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },

  loadingTitle: {
    fontSize: 24,
    fontFamily: FestiFunTypography.title.fontFamily,
    color: FestiFunColors.background,
    textAlign: "center",
    marginBottom: 8,
  },

  loadingSubtitle: {
    fontSize: 16,
    fontFamily: FestiFunTypography.body.fontFamily,
    color: "#ad9cbb",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 60,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 24,
  },

  locationContainer: {
    gap: 2,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  locationText: {
    fontSize: 16,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
  },

  locationSubtext: {
    fontSize: 12,
    color: "#ad9cbb",
    fontFamily: FestiFunTypography.body.fontFamily,
  },

  searchContainer: {
    paddingHorizontal: 18,
    marginBottom: 20,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: FestiFunColors.secondaryDark,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },

  searchPlaceholder: {
    fontSize: 16,
    color: "#ad9cbb",
    fontFamily: FestiFunTypography.body.fontFamily,
  },

  genreFiltersContainer: {
    marginBottom: 32,
  },

  genreFilters: {
    paddingLeft: 18,
    paddingRight: 18,
    gap: 8,
  },

  genreFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ad9cbb",
    backgroundColor: "transparent",
    minHeight: 36,
  },

  genreFilterActive: {
    backgroundColor: FestiFunColors.primary,
    borderColor: FestiFunColors.primary,
  },

  genreFilterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ad9cbb",
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
    textAlign: "center",
  },

  genreFilterTextActive: {
    color: FestiFunColors.background,
  },

  section: {
    marginBottom: 32,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.title.fontFamily,
    marginBottom: 4,
    paddingHorizontal: 18,
  },

  sectionSubtitle: {
    fontSize: 14,
    color: "#ad9cbb",
    fontFamily: FestiFunTypography.body.fontFamily,
    marginBottom: 16,
    paddingHorizontal: 18,
  },

  festivalsScrollContent: {
    paddingLeft: 18,
    paddingRight: 18,
    gap: 12,
  },

  artistsScrollContent: {
    paddingLeft: 18,
    paddingRight: 18,
    gap: 12,
  },

  artistContainer: {
    alignItems: "center",
    gap: 6,
  },

  artistImage: {
    width: 47,
    height: 47,
    borderRadius: 47,
  },

  artistName: {
    fontSize: 12,
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.body.fontFamily,
    textAlign: "center",
    width: 47,
  },

  forYouGrid: {
    paddingHorizontal: 18,
    gap: 12,
  },

  bottomSpace: {
    height: 105, // Ajusté pour correspondre au nouveau design de la navbar avec espacement
  },

  // Styles pour les modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalContent: {
    backgroundColor: FestiFunColors.secondaryDark,
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.title.fontFamily,
  },

  inputContainer: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 14,
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
    marginBottom: 8,
  },

  textInput: {
    backgroundColor: FestiFunColors.primaryDark,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: FestiFunColors.background,
    borderWidth: 1,
    borderColor: "#ad9cbb",
  },

  saveButton: {
    backgroundColor: FestiFunColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
  },

  getCurrentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 10,
  },

  getCurrentLocationText: {
    fontSize: 14,
    color: FestiFunColors.primary,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
  },
});
