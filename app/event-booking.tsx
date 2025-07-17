import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import {
  ArrowLeft,
  Share2,
  MapPin,
  Calendar,
  Users,
  Clock,
  Navigation,
  Search,
  X,
  CalendarDays,
  Plane,
} from "lucide-react-native";
import { FestiFunColors, FestiFunTypography } from "../lib/design-system";

type FestivalData = {
  name: string;
  location: {
    venue: string;
    city: string;
    country: string;
  };
  dates: {
    start: string;
    end?: string;
  };
};

type MapboxSuggestion = {
  id: string;
  place_name: string;
  place_name_fr?: string;
  center: [number, number];
  properties: {
    address?: string;
  };
};

export default function EventBooking() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Mémoriser les données du festival pour éviter les re-rendus
  const festivalData = useMemo<FestivalData | null>(() => {
    try {
      // Support pour les nouveaux paramètres individuels (venant de Pedro)
      if (params.festivalName && params.festivalVenue) {
        return {
          name: params.festivalName as string,
          location: {
            venue: params.festivalVenue as string,
            city:
              (params.festivalCity as string) ||
              (params.festivalVenue as string),
            country: (params.festivalCountry as string) || "France",
          },
          dates: {
            start: params.festivalStartDate as string,
            end: params.festivalEndDate as string,
          },
        };
      }

      // Fallback pour l'ancien format JSON
      if (params.festivalData) {
        return JSON.parse(params.festivalData as string);
      }
    } catch (error) {
      console.error("Erreur parsing festivalData:", error);
    }
    return null;
  }, [params]);

  // États pour les sélections
  const [personCount, setPersonCount] = useState(2);
  const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // États pour le point de départ
  const [departurePoint, setDeparturePoint] = useState("Ma position");
  const [showDepartureSearch, setShowDepartureSearch] = useState(false);
  const [departureSearchQuery, setDepartureSearchQuery] = useState("");
  const [mapboxSuggestions, setMapboxSuggestions] = useState<
    MapboxSuggestion[]
  >([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Vérifier si nous avons un transport validé depuis Pedro
  const validatedTransport = useMemo(() => {
    if (params.transportValidated === "true") {
      return {
        type: params.transportType as string,
        company: params.transportCompany as string,
        price: params.transportPrice as string,
        departureTime: params.transportDepartureTime as string,
        arrivalTime: params.transportArrivalTime as string,
        duration: params.transportDuration as string,
        origin: params.transportOrigin as string,
        destination: params.transportDestination as string,
      };
    }
    return null;
  }, [params]);

  // Pré-remplir le point de départ si nous avons des informations du transport validé
  useEffect(() => {
    if (params.prefilledDeparturePoint) {
      setDeparturePoint(params.prefilledDeparturePoint as string);
    }
  }, [params.prefilledDeparturePoint]);

  // Calculer les dates du festival et les options disponibles
  const festivalDates = useMemo(() => {
    if (!festivalData?.dates.start) return null;

    const start = new Date(festivalData.dates.start);
    const end = festivalData.dates.end
      ? new Date(festivalData.dates.end)
      : start;

    return { start, end };
  }, [festivalData]);

  // Générer les dates disponibles (3 jours avant le festival jusqu'à 3 jours après)
  const availableDates = useMemo(() => {
    if (!festivalDates) return [];

    const dates = [];
    const startRange = new Date(festivalDates.start);
    startRange.setDate(startRange.getDate() - 3); // 3 jours avant

    const endRange = new Date(festivalDates.end);
    endRange.setDate(endRange.getDate() + 3); // 3 jours après

    let currentDate = new Date(startRange);
    while (currentDate <= endRange) {
      const isFestivalDate =
        currentDate >= festivalDates.start && currentDate <= festivalDates.end;
      dates.push({
        date: new Date(currentDate),
        day: currentDate.toLocaleDateString("fr-FR", { weekday: "short" }),
        dayNumber: currentDate.getDate(),
        month: currentDate.toLocaleDateString("fr-FR", { month: "short" }),
        isFestivalDate,
        isToday: currentDate.toDateString() === new Date().toDateString(),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }, [festivalDates]);

  // Sélectionner automatiquement des dates par défaut
  useEffect(() => {
    if (availableDates.length > 0 && !arrivalDate && !departureDate) {
      const festivalStart = availableDates.find((d) => d.isFestivalDate);
      const festivalEnd = [...availableDates]
        .reverse()
        .find((d) => d.isFestivalDate);

      if (festivalStart && festivalEnd) {
        // Arriver la veille du festival
        const defaultArrival =
          availableDates.find(
            (d) =>
              d.date.getTime() ===
              festivalStart.date.getTime() - 24 * 60 * 60 * 1000
          ) || festivalStart;

        // Repartir le lendemain de la fin
        const defaultDeparture =
          availableDates.find(
            (d) =>
              d.date.getTime() ===
              festivalEnd.date.getTime() + 24 * 60 * 60 * 1000
          ) || festivalEnd;

        setArrivalDate(defaultArrival.date);
        setDepartureDate(defaultDeparture.date);
      }
    }
  }, [availableDates, arrivalDate, departureDate]);

  // Horaires disponibles
  const availableTimes = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
  ];

  // Fonction pour nettoyer l'état de recherche
  const clearSearchState = () => {
    setDepartureSearchQuery("");
    setMapboxSuggestions([]);
    setIsLoadingSuggestions(false);
  };

  // Recherche d'autocomplete Mapbox
  const searchMapboxPlaces = async (query: string) => {
    if (query.length < 3) {
      setMapboxSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?` +
          `access_token=${mapboxToken}&` +
          `country=fr&` +
          `language=fr&` +
          `limit=5&` +
          `types=address,poi,place`
      );

      if (response.ok) {
        const data = await response.json();
        setMapboxSuggestions(data.features || []);
      }
    } catch (error) {
      console.error("Erreur recherche Mapbox:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Géolocalisation corrigée
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      // Vérifier les permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "L'autorisation de localisation est nécessaire pour cette fonctionnalité."
        );
        setIsGettingLocation(false);
        return;
      }

      // Obtenir la position avec des options optimisées
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      console.log("Position obtenue:", { latitude, longitude });

      // Géocodage inverse avec Mapbox
      const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;
      if (!mapboxToken) {
        throw new Error("Token Mapbox manquant");
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?` +
          `access_token=${mapboxToken}&` +
          `language=fr&` +
          `limit=1&` +
          `types=address`
      );

      if (!response.ok) {
        throw new Error(`Erreur API Mapbox: ${response.status}`);
      }

      const data = await response.json();
      console.log("Réponse géocodage:", data);

      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        const addressName = place.place_name_fr || place.place_name;
        setDeparturePoint(addressName);
        setShowDepartureSearch(false);
        clearSearchState();
        Alert.alert("Position trouvée", `Votre position : ${addressName}`);
      } else {
        throw new Error("Aucune adresse trouvée");
      }
    } catch (error) {
      console.error("Erreur géolocalisation:", error);
      Alert.alert(
        "Erreur",
        `Impossible d'obtenir votre position : ${error.message}`
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Gestionnaires d'événements
  const handlePersonCountChange = (increment: boolean) => {
    if (increment) {
      setPersonCount(Math.min(personCount + 1, 100));
    } else {
      setPersonCount(Math.max(personCount - 1, 1));
    }
  };

  const handleDateSelect = (date: Date, type: "arrival" | "departure") => {
    if (type === "arrival") {
      setArrivalDate(date);
      // Si la date d'arrivée est après la date de départ, ajuster la date de départ
      if (departureDate && date >= departureDate) {
        const newDeparture = new Date(date);
        newDeparture.setDate(newDeparture.getDate() + 1);
        setDepartureDate(newDeparture);
      }
    } else {
      // Vérifier que la date de départ est après l'arrivée
      if (arrivalDate && date <= arrivalDate) {
        Alert.alert(
          "Date invalide",
          "La date de départ doit être après la date d'arrivée"
        );
        return;
      }
      setDepartureDate(date);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleDepartureSearch = (query: string) => {
    setDepartureSearchQuery(query);
    // Nettoyer les suggestions précédentes immédiatement
    if (query.length < 3) {
      setMapboxSuggestions([]);
      setIsLoadingSuggestions(false);
    } else {
      searchMapboxPlaces(query);
    }
  };

  const selectMapboxSuggestion = (suggestion: MapboxSuggestion) => {
    setDeparturePoint(suggestion.place_name_fr || suggestion.place_name);
    setShowDepartureSearch(false);
    clearSearchState();
  };

  const calculateStayDuration = () => {
    if (!arrivalDate || !departureDate) return 0;
    const diffTime = departureDate.getTime() - arrivalDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleBooking = () => {
    if (!arrivalDate || !departureDate || !selectedTime) {
      Alert.alert(
        "Information manquante",
        "Veuillez sélectionner les dates d'arrivée, de départ et l'heure"
      );
      return;
    }

    // Préparer les données pour l'étape suivante
    const bookingData = {
      festivalData: JSON.stringify(festivalData),
      arrivalDate: arrivalDate.toISOString(),
      departureDate: departureDate.toISOString(),
      personCount: personCount.toString(),
      selectedTime,
      departurePoint,
    };

    // Naviguer vers la planification de voyage
    router.push({
      pathname: "/trip-planning",
      params: bookingData,
    });
  };

  if (!festivalData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>
          Erreur: Données du festival non trouvées
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec titre */}
        <View style={styles.pageHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={FestiFunColors.background} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Réserver votre séjour</Text>
          <Text style={styles.festivalName}>{festivalData.name}</Text>
        </View>

        {/* Point de départ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Point de départ</Text>
          <TouchableOpacity
            style={styles.departureButton}
            onPress={() => setShowDepartureSearch(true)}
          >
            <MapPin size={20} color={FestiFunColors.primary} />
            <Text style={styles.departureText}>{departurePoint}</Text>
            <Search
              size={16}
              color={FestiFunColors.background}
              style={styles.editIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Modal de recherche de départ */}
        {showDepartureSearch && (
          <View style={styles.searchModal}>
            <View style={styles.searchHeader}>
              <Text style={styles.searchTitle}>Choisir le point de départ</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowDepartureSearch(false);
                  clearSearchState();
                }}
              >
                <X size={24} color={FestiFunColors.background} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchInputContainer}>
              <Search
                size={20}
                color={FestiFunColors.background}
                style={styles.searchInputIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher une adresse..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={departureSearchQuery}
                onChangeText={handleDepartureSearch}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={isGettingLocation}
            >
              <Navigation size={20} color={FestiFunColors.primary} />
              <Text style={styles.locationButtonText}>
                {isGettingLocation
                  ? "Localisation en cours..."
                  : "Utiliser ma position actuelle"}
              </Text>
              {isGettingLocation && (
                <ActivityIndicator
                  size="small"
                  color={FestiFunColors.primary}
                />
              )}
            </TouchableOpacity>

            {isLoadingSuggestions && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="small"
                  color={FestiFunColors.primary}
                />
                <Text style={styles.loadingText}>Recherche en cours...</Text>
              </View>
            )}

            <View style={styles.suggestionsList}>
              {mapboxSuggestions.map((item, index) => (
                <TouchableOpacity
                  key={`suggestion-${item.id}-${index}`}
                  style={styles.suggestionItem}
                  onPress={() => selectMapboxSuggestion(item)}
                >
                  <MapPin
                    size={16}
                    color={FestiFunColors.background}
                    style={styles.suggestionIcon}
                  />
                  <Text style={styles.suggestionText}>
                    {item.place_name_fr || item.place_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Section Personnes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nombre de personnes</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => handlePersonCountChange(false)}
              >
                <Text style={styles.counterButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{personCount}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => handlePersonCountChange(true)}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Informations du festival */}
        {festivalDates && (
          <View style={styles.festivalInfo}>
            <View style={styles.festivalHeader}>
              <Calendar size={20} color={FestiFunColors.primary} />
              <Text style={styles.festivalInfoTitle}>Dates du festival</Text>
            </View>
            <Text style={styles.festivalDates}>
              Du{" "}
              {festivalDates.start.toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {festivalDates.end.getTime() !== festivalDates.start.getTime() &&
                ` au ${festivalDates.end.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}`}
            </Text>
          </View>
        )}

        {/* Section Date d'arrivée */}
        <View style={styles.section}>
          <View style={styles.dateHeader}>
            <Plane size={20} color={FestiFunColors.primary} />
            <Text style={styles.sectionTitle}>Date d'arrivée</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.datesScroll}
          >
            <View style={styles.datesContainer}>
              {availableDates.map((dateItem, index) => (
                <TouchableOpacity
                  key={`arrival-${index}`}
                  style={[
                    styles.dateItem,
                    arrivalDate &&
                      dateItem.date.toDateString() ===
                        arrivalDate.toDateString() &&
                      styles.dateItemSelected,
                    dateItem.isFestivalDate && styles.festivalDateItem,
                  ]}
                  onPress={() => handleDateSelect(dateItem.date, "arrival")}
                >
                  <Text
                    style={[
                      styles.dayText,
                      arrivalDate &&
                        dateItem.date.toDateString() ===
                          arrivalDate.toDateString() &&
                        styles.dayTextSelected,
                    ]}
                  >
                    {dateItem.day}
                  </Text>
                  <Text
                    style={[
                      styles.dateText,
                      arrivalDate &&
                        dateItem.date.toDateString() ===
                          arrivalDate.toDateString() &&
                        styles.dateTextSelected,
                    ]}
                  >
                    {dateItem.dayNumber}
                  </Text>
                  <Text
                    style={[
                      styles.monthText,
                      arrivalDate &&
                        dateItem.date.toDateString() ===
                          arrivalDate.toDateString() &&
                        styles.monthTextSelected,
                    ]}
                  >
                    {dateItem.month}
                  </Text>
                  {dateItem.isFestivalDate && (
                    <Text style={styles.festivalIndicator}>🎵</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Section Date de départ */}
        <View style={styles.section}>
          <View style={styles.dateHeader}>
            <Plane
              size={20}
              color={FestiFunColors.primary}
              style={styles.departureIcon}
            />
            <Text style={styles.sectionTitle}>Date de départ</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.datesScroll}
          >
            <View style={styles.datesContainer}>
              {availableDates.map((dateItem, index) => (
                <TouchableOpacity
                  key={`departure-${index}`}
                  style={[
                    styles.dateItem,
                    departureDate &&
                      dateItem.date.toDateString() ===
                        departureDate.toDateString() &&
                      styles.dateItemSelected,
                    dateItem.isFestivalDate && styles.festivalDateItem,
                    // Griser les dates avant l'arrivée
                    arrivalDate &&
                      dateItem.date <= arrivalDate &&
                      styles.disabledDateItem,
                  ]}
                  onPress={() => handleDateSelect(dateItem.date, "departure")}
                  disabled={arrivalDate ? dateItem.date <= arrivalDate : false}
                >
                  <Text
                    style={[
                      styles.dayText,
                      departureDate &&
                        dateItem.date.toDateString() ===
                          departureDate.toDateString() &&
                        styles.dayTextSelected,
                      arrivalDate &&
                        dateItem.date <= arrivalDate &&
                        styles.disabledText,
                    ]}
                  >
                    {dateItem.day}
                  </Text>
                  <Text
                    style={[
                      styles.dateText,
                      departureDate &&
                        dateItem.date.toDateString() ===
                          departureDate.toDateString() &&
                        styles.dateTextSelected,
                      arrivalDate &&
                        dateItem.date <= arrivalDate &&
                        styles.disabledText,
                    ]}
                  >
                    {dateItem.dayNumber}
                  </Text>
                  <Text
                    style={[
                      styles.monthText,
                      departureDate &&
                        dateItem.date.toDateString() ===
                          departureDate.toDateString() &&
                        styles.monthTextSelected,
                      arrivalDate &&
                        dateItem.date <= arrivalDate &&
                        styles.disabledText,
                    ]}
                  >
                    {dateItem.month}
                  </Text>
                  {(dateItem.isFestivalDate && !arrivalDate) ||
                    (arrivalDate && dateItem.date > arrivalDate && (
                      <Text style={styles.festivalIndicator}>🎵</Text>
                    ))}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Résumé du séjour */}
        {arrivalDate && departureDate && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Résumé de votre séjour</Text>
            <Text style={styles.summaryText}>
              Durée : {calculateStayDuration()} nuit
              {calculateStayDuration() > 1 ? "s" : ""} et{" "}
              {calculateStayDuration() + 1} jours
            </Text>
            <Text style={styles.summaryText}>
              Point de départ : {departurePoint}
            </Text>

            <Text style={styles.summaryText}>
              Nombre de personnes : {personCount}
            </Text>
            <Text style={styles.summaryText}>
              Du {arrivalDate.toLocaleDateString("fr-FR")} au{" "}
              {departureDate.toLocaleDateString("fr-FR")}
            </Text>
          </View>
        )}

        {/* Section Heure d'arrivée */}
        <View style={styles.section}>
          <View style={styles.dateHeader}>
            <Clock size={20} color={FestiFunColors.primary} />
            <Text style={styles.sectionTitle}>
              {arrivalDate
                ? `Heure d'arrivée souhaitée le ${
                    arrivalDate
                      .toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                      .charAt(0)
                      .toUpperCase() +
                    arrivalDate
                      .toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                      .slice(1)
                      .toLowerCase()
                  }`
                : "Heure d'arrivée"}
            </Text>
          </View>
          <View style={styles.timesContainer}>
            {availableTimes.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeItem,
                  selectedTime === time && styles.timeItemSelected,
                ]}
                onPress={() => handleTimeSelect(time)}
              >
                <Text
                  style={[
                    styles.timeText,
                    selectedTime === time && styles.timeTextSelected,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bouton de réservation fixe */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.bookingButton,
            (!arrivalDate || !departureDate || !selectedTime) &&
              styles.bookingButtonDisabled,
          ]}
          onPress={handleBooking}
          disabled={!arrivalDate || !departureDate || !selectedTime}
        >
          <Text style={styles.bookingButtonText}>
            Planifier mon séjour ({calculateStayDuration()} nuit
            {calculateStayDuration() > 1 ? "s" : ""})
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FestiFunColors.primaryDark,
  },
  scrollView: {
    flex: 1,
  },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: FestiFunColors.background,
    marginBottom: 8,
    fontFamily: FestiFunTypography.title.fontFamily,
  },
  festivalName: {
    fontSize: 16,
    color: FestiFunColors.primary,
    fontWeight: "500",
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.title.fontFamily,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  departureIcon: {
    transform: [{ rotate: "180deg" }],
  },
  departureButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 12,
  },
  departureText: {
    flex: 1,
    color: FestiFunColors.background,
    fontSize: 16,
    marginLeft: 12,
  },
  editIcon: {
    opacity: 0.6,
  },
  festivalInfo: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: FestiFunColors.primary,
  },
  festivalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  festivalInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: FestiFunColors.background,
    marginLeft: 8,
  },
  festivalDates: {
    fontSize: 14,
    color: FestiFunColors.background,
    opacity: 0.9,
    lineHeight: 20,
  },
  datesScroll: {
    marginHorizontal: -20,
  },
  datesContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
  },
  dateItem: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    minWidth: 70,
    borderWidth: 1,
    borderColor: "transparent",
  },
  dateItemSelected: {
    backgroundColor: FestiFunColors.primary,
    borderColor: FestiFunColors.primary,
  },
  festivalDateItem: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  disabledDateItem: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 12,
    color: FestiFunColors.background,
    opacity: 0.7,
    marginBottom: 4,
    textTransform: "capitalize",
  },
  dayTextSelected: {
    opacity: 1,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 20,
    fontWeight: "700",
    color: FestiFunColors.background,
    marginBottom: 2,
  },
  dateTextSelected: {
    color: FestiFunColors.background,
  },
  monthText: {
    fontSize: 10,
    color: FestiFunColors.background,
    opacity: 0.7,
    textTransform: "uppercase",
  },
  monthTextSelected: {
    opacity: 1,
    fontWeight: "600",
  },
  disabledText: {
    opacity: 0.3,
  },
  festivalIndicator: {
    fontSize: 10,
    marginTop: 4,
  },
  summarySection: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#22c55e",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: FestiFunColors.background,
    opacity: 0.9,
    marginBottom: 4,
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 25,
    paddingHorizontal: 4,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    margin: 4,
  },
  counterButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: FestiFunColors.background,
  },
  counterValue: {
    fontSize: 18,
    fontWeight: "600",
    color: FestiFunColors.background,
    marginHorizontal: 20,
  },
  timesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  timeItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    minWidth: 80,
    alignItems: "center",
  },
  timeItemSelected: {
    backgroundColor: FestiFunColors.primary,
  },
  timeText: {
    fontSize: 16,
    fontWeight: "500",
    color: FestiFunColors.background,
    opacity: 0.8,
  },
  timeTextSelected: {
    opacity: 1,
    fontWeight: "600",
  },
  searchModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: FestiFunColors.primaryDark,
    zIndex: 1000,
    padding: 20,
  },
  searchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 40,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: FestiFunColors.background,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 25,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputIcon: {
    marginRight: 12,
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: FestiFunColors.background,
    fontSize: 16,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  locationButtonText: {
    color: FestiFunColors.primary,
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
    flex: 1,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    color: FestiFunColors.background,
    marginLeft: 12,
    opacity: 0.7,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  suggestionIcon: {
    marginRight: 16,
    opacity: 0.7,
  },
  suggestionText: {
    color: FestiFunColors.background,
    fontSize: 16,
    flex: 1,
  },
  bottomSpacing: {
    height: 100,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: FestiFunColors.primaryDark,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  bookingButton: {
    backgroundColor: FestiFunColors.primary,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  bookingButtonDisabled: {
    backgroundColor: "rgba(99, 102, 241, 0.5)",
  },
  bookingButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.title.fontFamily,
  },
  errorText: {
    color: FestiFunColors.background,
    fontSize: 16,
    textAlign: "center",
    margin: 20,
  },
});
