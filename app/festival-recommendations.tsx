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
  Linking,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "../lib/auth-client";
import {
  festivalMatcher,
  FestivalMatch,
  FestivalMatchingOptions,
} from "../lib/festival-matcher";
import { useTranslation } from "../lib/useTranslation";

const { width } = Dimensions.get("window");

interface FilterState {
  countryCode: string;
  maxResults: number;
  minMatchScore: number;
  includePopularityBoost: boolean;
}

export default function FestivalRecommendationsScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [festivals, setFestivals] = useState<FestivalMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    countryCode: "FR",
    maxResults: 20,
    minMatchScore: 0.1,
    includePopularityBoost: true,
  });

  useEffect(() => {
    if (session?.user) {
      loadFestivalRecommendations();
    }
  }, [session]);

  const loadFestivalRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🎯 Recherche de festivals pour l'utilisateur");

      const options: FestivalMatchingOptions = {
        location: {
          countryCode: filters.countryCode,
        },
        minMatchScore: filters.minMatchScore,
        maxResults: filters.maxResults,
        includePopularityBoost: filters.includePopularityBoost,
      };

      const recommendations = await festivalMatcher.findMatchingFestivals(
        session?.user?.id || "",
        options
      );

      setFestivals(recommendations);

      if (recommendations.length === 0) {
        setError(t("festival.recommendations.loginRequired"));
      }
    } catch (err) {
      console.error("❌ Erreur chargement festivals:", err);
      setError(t("errors.festival"));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFestivalRecommendations();
    setRefreshing(false);
  };

  const handleTicketPress = async (festival: FestivalMatch) => {
    try {
      const canOpen = await Linking.canOpenURL(festival.ticketUrl);
      if (canOpen) {
        await Linking.openURL(festival.ticketUrl);
      } else {
        Alert.alert(t("common.error"), t("errors.network"));
      }
    } catch (error) {
      console.error("❌ Erreur ouverture lien:", error);
      Alert.alert(t("common.error"), t("errors.network"));
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getMatchScoreColor = (score: number): string => {
    if (score >= 0.8) return "#4CAF50"; // Vert
    if (score >= 0.6) return "#FF9800"; // Orange
    if (score >= 0.4) return "#2196F3"; // Bleu
    return "#9E9E9E"; // Gris
  };

  const getMatchScoreText = (score: number): string => {
    if (score >= 0.8) return "Excellent match!";
    if (score >= 0.6) return "Bon match";
    if (score >= 0.4) return "Match intéressant";
    return "Match possible";
  };

  const renderFestivalCard = (festival: FestivalMatch) => {
    const matchColor = getMatchScoreColor(festival.matchScore);
    const matchText = getMatchScoreText(festival.matchScore);
    const matchPercentage = Math.round(festival.matchScore * 100);

    return (
      <View key={festival.id} style={styles.festivalCard}>
        {/* Image du festival */}
        {festival.image && (
          <Image
            source={{ uri: festival.image }}
            style={styles.festivalImage}
          />
        )}

        {/* Contenu principal */}
        <View style={styles.festivalContent}>
          <View style={styles.festivalHeader}>
            <Text style={styles.festivalName}>{festival.name}</Text>
            <View style={[styles.matchBadge, { backgroundColor: matchColor }]}>
              <Text style={styles.matchText}>{matchPercentage}%</Text>
            </View>
          </View>

          <Text style={styles.festivalDescription}>{festival.description}</Text>

          {/* Informations sur le lieu et la date */}
          <View style={styles.festivalInfo}>
            <Text style={styles.infoText}>
              📍 {festival.location.venue}, {festival.location.city},{" "}
              {festival.location.country}
            </Text>
            <Text style={styles.infoText}>
              📅 {formatDate(festival.dates.start)}
              {festival.dates.end && ` - ${formatDate(festival.dates.end)}`}
            </Text>
            {/* Popularité estimée */}
            <Text style={styles.infoText}>
              🔥 Popularité: {Math.round(festival.estimatedPopularity * 100)}%
            </Text>
          </View>

          {/* Genres correspondants */}
          <View style={styles.genresContainer}>
            <Text style={styles.genresLabel}>Genres:</Text>
            <View style={styles.genresRow}>
              {festival.matchingGenres.slice(0, 3).map((genre, index) => (
                <View key={index} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
              {festival.matchingGenres.length > 3 && (
                <View style={styles.genreTag}>
                  <Text style={styles.genreText}>
                    +{festival.matchingGenres.length - 3}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Raisons du match */}
          <View style={styles.reasonsContainer}>
            <Text style={styles.reasonsLabel}>Pourquoi ce festival:</Text>
            {festival.reasons.slice(0, 2).map((reason, index) => (
              <Text key={index} style={styles.reasonText}>
                • {reason}
              </Text>
            ))}
          </View>

          {/* Prix */}
          {festival.priceRange && (
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>
                💰 {festival.priceRange.min}€ - {festival.priceRange.max}€
              </Text>
            </View>
          )}

          {/* Score de match */}
          <View style={styles.matchContainer}>
            <Text style={[styles.matchLabel, { color: matchColor }]}>
              {matchText}
            </Text>
            <View style={styles.matchBarContainer}>
              <View
                style={[
                  styles.matchBar,
                  {
                    width: `${matchPercentage}%`,
                    backgroundColor: matchColor,
                  },
                ]}
              />
            </View>
          </View>

          {/* Bouton pour acheter des billets */}
          <TouchableOpacity
            style={[styles.ticketButton, { backgroundColor: matchColor }]}
            onPress={() => handleTicketPress(festival)}
          >
            <Text style={styles.ticketButtonText}>🎫 Voir les billets</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersTitle}>
        🌍 Recherche Géographique Intelligente
      </Text>

      {/* Information sur la recherche concentrique */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          🎯 Recherche automatique : local → régional → européen → international
        </Text>
        <Text style={styles.infoSubText}>
          Les festivals proches de vous sont automatiquement favorisés dans le
          scoring
        </Text>
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Zone géographique préférée:</Text>
        <View style={styles.countryButtons}>
          {[
            { code: "FR", flag: "🇫🇷", name: "France" },
            { code: "DE", flag: "🇩🇪", name: "Allemagne" },
            { code: "GB", flag: "🇬🇧", name: "UK" },
            { code: "ES", flag: "🇪🇸", name: "Espagne" },
            { code: "US", flag: "🇺🇸", name: "USA" },
          ].map((country) => (
            <TouchableOpacity
              key={country.code}
              style={[
                styles.countryButton,
                filters.countryCode === country.code &&
                  styles.countryButtonActive,
              ]}
              onPress={() =>
                setFilters((prev) => ({ ...prev, countryCode: country.code }))
              }
            >
              <Text
                style={[
                  styles.countryButtonText,
                  filters.countryCode === country.code &&
                    styles.countryButtonTextActive,
                ]}
              >
                {country.flag} {country.code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Filtre saisonnier */}
      <View style={styles.seasonalBox}>
        <Text style={styles.seasonalTitle}>🌤️ Bonus Saisonnier Actif</Text>
        <Text style={styles.seasonalText}>
          • Festivals d'été (mai-septembre) : +8% de score
        </Text>
        <Text style={styles.seasonalText}>
          • Événements dans les 3 prochains mois : +5% de score
        </Text>
        <Text style={styles.seasonalText}>
          • Distance géographique intégrée automatiquement
        </Text>
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Nombre de résultats:</Text>
        <View style={styles.countryButtons}>
          {[10, 20, 50].map((count) => (
            <TouchableOpacity
              key={count}
              style={[
                styles.countryButton,
                filters.maxResults === count && styles.countryButtonActive,
              ]}
              onPress={() =>
                setFilters((prev) => ({ ...prev, maxResults: count }))
              }
            >
              <Text
                style={[
                  styles.countryButtonText,
                  filters.maxResults === count &&
                    styles.countryButtonTextActive,
                ]}
              >
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.applyFiltersButton}
        onPress={loadFestivalRecommendations}
      >
        <Text style={styles.applyFiltersText}>🔍 Appliquer les filtres</Text>
      </TouchableOpacity>
    </View>
  );

  if (!session?.user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Vous devez être connecté pour voir vos recommandations de festivals
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.loginButtonText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Festivals pour vous</Text>
      </View>

      {/* Filtres */}
      {renderFilters()}

      {/* Chargement */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.loadingText}>
            Recherche des festivals parfaits pour vous...
          </Text>
        </View>
      )}

      {/* Erreur */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadFestivalRecommendations}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Liste des festivals */}
      {!loading && !error && festivals.length > 0 && (
        <View style={styles.festivalsContainer}>
          <Text style={styles.festivalsTitle}>
            {festivals.length} festivals trouvés
          </Text>
          {festivals.map(renderFestivalCard)}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#1DB954",
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
  filtersContainer: {
    backgroundColor: "white",
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  infoBox: {
    backgroundColor: "#e8f5e8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#1DB954",
  },
  infoSubText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  seasonalBox: {
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
  },
  seasonalTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  seasonalText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  filterRow: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  countryButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  countryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  countryButtonActive: {
    backgroundColor: "#1DB954",
    borderColor: "#1DB954",
  },
  countryButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  countryButtonTextActive: {
    color: "white",
  },
  applyFiltersButton: {
    backgroundColor: "#1DB954",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  applyFiltersText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorContainer: {
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#1DB954",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginButton: {
    backgroundColor: "#1DB954",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  festivalsContainer: {
    padding: 15,
  },
  festivalsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  festivalCard: {
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  festivalImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  festivalContent: {
    padding: 20,
  },
  festivalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  festivalName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  matchBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  matchText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  festivalDescription: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
    lineHeight: 22,
  },
  festivalInfo: {
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  genresContainer: {
    marginBottom: 15,
  },
  genresLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  genresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genreTag: {
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  genreText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "600",
  },
  reasonsContainer: {
    marginBottom: 15,
  },
  reasonsLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  priceContainer: {
    marginBottom: 15,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF9800",
  },
  matchContainer: {
    marginBottom: 20,
  },
  matchLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  matchBarContainer: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
  },
  matchBar: {
    height: "100%",
    borderRadius: 3,
  },
  ticketButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  ticketButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
