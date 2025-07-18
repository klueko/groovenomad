import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ImageBackground,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Plus,
  Guitar,
  Clock,
  Plane,
  Bed,
  MapPin,
  Users,
  Heart,
  MoreHorizontal,
  Star,
} from "lucide-react-native";
import { FestiFunColors, FestiFunFonts } from "../lib/design-system";
import { useSession } from "../lib/auth-client";

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

type BookingData = {
  festivalData: FestivalData;
  arrivalDate: string;
  departureDate: string;
  personCount: number;
  selectedTime: string;
  departurePoint: string;
};

type ActivityType = "travel" | "accommodation" | "activity" | "festival";

type TripActivity = {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  time?: string;
  description?: string;
  isFixed?: boolean; // Pour les événements du festival
};

type DayPlan = {
  date: Date;
  dayName: string;
  dayNumber: string;
  month: string;
  isFestivalDay: boolean;
  activities: TripActivity[];
};

// Fonction utilitaire pour extraire l'heure de début d'une activité pour le tri
function getActivityStartTime(activity: TripActivity): number {
  if (!activity.time) return 9999; // Les activités sans heure vont à la fin

  // Gérer les formats d'heure : "14:00 - 16:00", "18h - 2h", "Toute la journée"
  const timeStr = activity.time.toLowerCase();

  if (timeStr.includes("toute la journée")) return 0; // Début de journée

  // Extraire la première heure (avant le tiret ou avant le h)
  const hourMatch = timeStr.match(/(\d{1,2})[h:]/);
  if (hourMatch) {
    return parseInt(hourMatch[1]);
  }

  return 9999; // Si pas d'heure trouvée, mettre à la fin
}

// Fonction utilitaire pour calculer l'heure de fin basée sur l'heure de début et la durée
function calculateEndTime(startTime: string, duration: string): string {
  try {
    // Parse l'heure de début (format "HH:MM")
    const [startHour, startMinute] = startTime.split(":").map(Number);

    // Parse la durée (format "2h", "1-2h", "30min", etc.)
    let durationHours = 0;
    let durationMinutes = 0;

    if (duration.includes("h")) {
      const hourMatch = duration.match(/(\d+)h/);
      if (hourMatch) {
        durationHours = parseInt(hourMatch[1]);
      }
    }

    if (duration.includes("min")) {
      const minuteMatch = duration.match(/(\d+)min/);
      if (minuteMatch) {
        durationMinutes = parseInt(minuteMatch[1]);
      }
    }

    // Si pas de durée trouvée, default à 2h
    if (durationHours === 0 && durationMinutes === 0) {
      durationHours = 2;
    }

    // Calculer l'heure de fin
    const endHour = startHour + durationHours;
    const endMinute = startMinute + durationMinutes;

    // Ajuster les minutes si nécessaire
    const finalEndHour = endHour + Math.floor(endMinute / 60);
    const finalEndMinute = endMinute % 60;

    // Formatter au format HH:MM
    return `${finalEndHour.toString().padStart(2, "0")}:${finalEndMinute
      .toString()
      .padStart(2, "0")}`;
  } catch (error) {
    console.error("Erreur calcul heure fin:", error);
    return "12:00"; // Fallback
  }
}

export default function TripPlanning() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { data: session } = useSession();

  // Configuration
  const MAX_ACTIVITIES_PER_DAY = 4; // Nombre maximum d'activités personnalisées par jour

  // Récupérer les données de réservation
  const bookingData = useMemo<BookingData | null>(() => {
    console.log(
      "🔍 [Trip Planning] Paramètres reçus:",
      JSON.stringify(params, null, 2)
    );

    try {
      // Si nous avons les nouveaux paramètres individuels du festival
      if (params.festivalName && params.festivalVenue) {
        console.log(
          "✅ [Trip Planning] Utilisation des paramètres individuels"
        );
        const data = {
          festivalData: {
            name: params.festivalName as string,
            location: {
              venue: params.festivalVenue as string,
              city:
                (params.festivalCity as string) ||
                (params.festivalVenue as string),
              country: (params.festivalCountry as string) || "France",
            },
            dates: {
              start:
                (params.festivalStartDate as string) ||
                (params.arrivalDate as string),
              end:
                (params.festivalEndDate as string) ||
                (params.departureDate as string),
            },
          },
          arrivalDate: params.arrivalDate as string,
          departureDate: params.departureDate as string,
          personCount: parseInt(params.personCount as string) || 1,
          selectedTime: (params.selectedTime as string) || "flexible",
          departurePoint: params.departurePoint as string,
        };
        console.log(
          "📋 [Trip Planning] BookingData créé:",
          JSON.stringify(data, null, 2)
        );
        return data;
      }

      // Fallback pour l'ancien format avec JSON
      if (params.festivalData) {
        const data = {
          festivalData: JSON.parse(params.festivalData as string),
          arrivalDate: params.arrivalDate as string,
          departureDate: params.departureDate as string,
          personCount: parseInt(params.personCount as string),
          selectedTime: params.selectedTime as string,
          departurePoint: params.departurePoint as string,
        };
        return data;
      }

      return null;
    } catch (error) {
      console.error("Erreur parsing booking data:", error);
      return null;
    }
  }, [params]);

  // État pour les activités ajoutées
  const [tripActivities, setTripActivities] = useState<
    Record<string, TripActivity[]>
  >({});

  // Générer la planification des jours
  const tripDays = useMemo<DayPlan[]>(() => {
    console.log(
      "📅 [Trip Planning] Génération des jours, bookingData:",
      bookingData ? "présent" : "null"
    );

    if (!bookingData) {
      console.log("❌ [Trip Planning] Pas de bookingData, retour tableau vide");
      return [];
    }

    const arrival = new Date(bookingData.arrivalDate);
    const departure = new Date(bookingData.departureDate);

    console.log("📅 [Trip Planning] Dates:", {
      arrivalDate: bookingData.arrivalDate,
      departureDate: bookingData.departureDate,
      arrival: arrival.toString(),
      departure: departure.toString(),
    });
    const festivalStart = new Date(bookingData.festivalData.dates.start);
    const festivalEnd = bookingData.festivalData.dates.end
      ? new Date(bookingData.festivalData.dates.end)
      : festivalStart;

    const days: DayPlan[] = [];
    const currentDate = new Date(arrival);

    while (currentDate <= departure) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const isFestivalDay =
        currentDate >= festivalStart && currentDate <= festivalEnd;

      const dayPlan: DayPlan = {
        date: new Date(currentDate),
        dayName: currentDate.toLocaleDateString("fr-FR", { weekday: "long" }),
        dayNumber: currentDate.getDate().toString(),
        month: currentDate.toLocaleDateString("fr-FR", { month: "short" }),
        isFestivalDay,
        activities: [],
      };

      // Ajouter l'activité de transport validé selon la direction
      const isArrivalDay = dateStr === bookingData.arrivalDate.split("T")[0];
      const isDepartureDay =
        dateStr === bookingData.departureDate.split("T")[0];

      if (params.transportValidated === "true") {
        const shouldAddTransport =
          (params.transportDirection === "outbound" && isArrivalDay) ||
          (params.transportDirection === "return" && isDepartureDay);

        if (shouldAddTransport) {
          const transportIcon =
            params.transportType === "flight"
              ? "✈️"
              : params.transportType === "train"
              ? "🚆"
              : "🚌";
          const transportLabel =
            params.transportType === "flight"
              ? "Vol"
              : params.transportType === "train"
              ? "Train"
              : "Bus";

          const transportId =
            params.transportDirection === "outbound"
              ? `transport-arrival-${dateStr}`
              : `transport-departure-${dateStr}`;

          dayPlan.activities.push({
            id: transportId,
            type: "travel",
            title: `${transportIcon} ${transportLabel} ${params.transportCompany}`,
            subtitle: `${params.transportOrigin} → ${params.transportDestination}`,
            time: `${params.transportDepartureTime} - ${params.transportArrivalTime}`,
            description: `${params.transportDuration} • ${params.transportPrice}`,
            isFixed: true,
          });
        }
      }

      // Ajouter le logement validé pour chaque jour du séjour
      if (params.accommodationValidated === "true") {
        dayPlan.activities.push({
          id: `accommodation-${dateStr}`,
          type: "accommodation",
          title: `🏨 ${
            Array.isArray(params.accommodationHotelName)
              ? params.accommodationHotelName[0]
              : params.accommodationHotelName
          }`,
          subtitle: Array.isArray(params.accommodationRoomDescription)
            ? params.accommodationRoomDescription[0]
            : params.accommodationRoomDescription,
          time: "Toute la journée",
          description: `${
            Array.isArray(params.accommodationPricePerNight)
              ? params.accommodationPricePerNight[0]
              : params.accommodationPricePerNight
          }/nuit`,
          isFixed: true,
        });
      }

      // Ajouter les activités du festival si c'est un jour de festival
      if (isFestivalDay) {
        dayPlan.activities.push({
          id: `festival-${dateStr}`,
          type: "festival",
          title: bookingData.festivalData.name,
          subtitle: bookingData.festivalData.location.venue,
          time: "18h - 2h",
          isFixed: true,
        });
      }

      // Ajouter l'activité validée via Pedro si c'est le bon jour
      if (
        params.activityValidated === "true" &&
        params.activityDate === dateStr
      ) {
        const activityIcon =
          params.activityCategory === "cultural"
            ? "🎭"
            : params.activityCategory === "natural"
            ? "🌳"
            : "📍";

        // Calculer l'heure de fin basée sur la durée
        const startTime =
          typeof params.activityTime === "string"
            ? params.activityTime
            : params.activityTime?.[0];
        const duration =
          typeof params.activityDuration === "string"
            ? params.activityDuration
            : params.activityDuration?.[0];
        const endTime =
          startTime && duration ? calculateEndTime(startTime, duration) : null;

        dayPlan.activities.push({
          id: `pedro-activity-${dateStr}`,
          type: "activity",
          title: `${activityIcon} ${
            typeof params.activityName === "string"
              ? params.activityName
              : params.activityName?.[0] || "Activité"
          }`,
          subtitle:
            typeof params.activityDescription === "string"
              ? params.activityDescription
              : params.activityDescription?.[0] || "",
          time:
            startTime && endTime
              ? `${startTime} - ${endTime}`
              : "Heure flexible",
          description: `${
            typeof params.activityDistance === "string"
              ? params.activityDistance
              : params.activityDistance?.[0] || "0"
          }m du festival • ${
            typeof params.activityPrice === "string"
              ? params.activityPrice
              : params.activityPrice?.[0] || "Gratuit"
          }`,
          isFixed: true,
        });
      }

      // Ajouter les activités personnalisées
      if (tripActivities[dateStr]) {
        dayPlan.activities.push(...tripActivities[dateStr]);
      }

      days.push(dayPlan);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(
      `🎯 [Trip Planning] ${days.length} jours générés:`,
      days.map((d) => ({
        date: d.date.toISOString().split("T")[0],
        dayName: d.dayName,
        isFestivalDay: d.isFestivalDay,
        activitiesCount: d.activities.length,
      }))
    );

    return days;
  }, [bookingData, tripActivities]);

  // Helper pour déterminer s'il y a encore de la place pour des activités
  const hasSpaceForMoreActivities = (day: DayPlan) => {
    const customActivities = day.activities.filter(
      (activity) => !activity.isFixed
    );
    return customActivities.length < MAX_ACTIVITIES_PER_DAY;
  };

  // Fonction pour rendre les activités et boutons intercalés pour les jours non-festival
  const renderNonFestivalContent = (day: DayPlan) => {
    const dateStr = day.date.toISOString().split("T")[0];
    const customActivities = day.activities.filter(
      (activity) => !activity.isFixed
    );

    // Si aucune activité, un seul bouton
    if (customActivities.length === 0) {
      if (!hasSpaceForMoreActivities(day)) {
        return (
          <View style={styles.dayFullMessage}>
            <Text style={styles.dayFullText}>
              Journée complète ({MAX_ACTIVITIES_PER_DAY} activités max)
            </Text>
          </View>
        );
      }
      return (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddActivity(dateStr)}
        >
          <Plus size={24} color={FestiFunColors.accent} />
          <Text style={styles.addButtonText}>Ajouter une activité</Text>
        </TouchableOpacity>
      );
    }

    // Trier les activités par heure pour avoir l'ordre correct
    const sortedActivities = [...customActivities].sort((a, b) => {
      if (!a.time || !b.time) return 0;
      return a.time.localeCompare(b.time);
    });

    const elements = [];

    // Bouton avant la première activité (si place disponible)
    if (hasSpaceForMoreActivities(day)) {
      elements.push(
        <TouchableOpacity
          key={`before-0`}
          style={styles.addButton}
          onPress={() => handleAddActivity(dateStr)}
        >
          <Plus size={20} color={FestiFunColors.accent} />
          <Text style={styles.addButtonText}>
            Avant {sortedActivities[0].time || "première activité"}
          </Text>
        </TouchableOpacity>
      );
    }

    // Intercaler activités et boutons
    sortedActivities.forEach((activity, index) => {
      // Ajouter l'activité
      elements.push(
        <View key={activity.id} style={styles.activityCard}>
          <View style={styles.customActivityCard}>
            <Star
              size={20}
              color={FestiFunColors.accent}
              style={{ marginRight: 12 }}
            />
            <View style={styles.customActivityInfo}>
              <Text style={styles.customActivityTitle}>{activity.title}</Text>
              {activity.time && (
                <Text style={styles.customActivityTime}>{activity.time}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.festivalOptionsButton}>
              <MoreHorizontal
                size={20}
                color={FestiFunColors.background + "60"}
              />
            </TouchableOpacity>
          </View>
        </View>
      );

      // Ajouter bouton "entre" ou "après" selon la position
      if (hasSpaceForMoreActivities(day)) {
        if (index < sortedActivities.length - 1) {
          // Bouton entre cette activité et la suivante
          elements.push(
            <TouchableOpacity
              key={`between-${index}`}
              style={styles.addButton}
              onPress={() => handleAddActivity(dateStr)}
            >
              <Plus size={20} color={FestiFunColors.accent} />
              <Text style={styles.addButtonText}>
                Entre {activity.time || "activité"} et{" "}
                {sortedActivities[index + 1].time || "activité"}
              </Text>
            </TouchableOpacity>
          );
        } else {
          // Bouton après la dernière activité
          elements.push(
            <TouchableOpacity
              key={`after-${index}`}
              style={styles.addButton}
              onPress={() => handleAddActivity(dateStr)}
            >
              <Plus size={20} color={FestiFunColors.accent} />
              <Text style={styles.addButtonText}>
                Après {activity.time || "dernière activité"}
              </Text>
            </TouchableOpacity>
          );
        }
      }
    });

    // Si pas de place, afficher le message à la fin
    if (!hasSpaceForMoreActivities(day)) {
      elements.push(
        <View key="day-full" style={styles.dayFullMessage}>
          <Text style={styles.dayFullText}>
            Journée complète ({MAX_ACTIVITIES_PER_DAY} activités max)
          </Text>
        </View>
      );
    }

    return elements;
  };

  const handleAddTravel = (direction: "outbound" | "return") => {
    if (!bookingData) return;

    router.push({
      pathname: "/travel-config",
      params: {
        // ===== PRÉSERVER TOUS LES PARAMÈTRES EXISTANTS =====
        ...params,

        // ===== PARAMÈTRES SPÉCIFIQUES AU TRAJET =====
        direction: direction,
        festivalName: bookingData.festivalData.name,
        festivalLocation: bookingData.festivalData.location.city,
        departurePoint: bookingData.departurePoint,
        arrivalDate: bookingData.arrivalDate,
        departureDate: bookingData.departureDate,
      },
    });
  };

  const handleAddAccommodation = (date: string) => {
    if (!bookingData) return;

    // Calculer les dates de séjour (de l'arrivée au départ)
    const checkInDate = bookingData.arrivalDate.split("T")[0];
    const checkOutDate = bookingData.departureDate.split("T")[0];

    // Déterminer le cityCode basé sur la localisation du festival
    const festivalLocation =
      bookingData.festivalData.location.city.toLowerCase();
    let cityCode = "LON"; // Default

    if (
      festivalLocation.includes("london") ||
      festivalLocation.includes("londres")
    ) {
      cityCode = "LON";
    } else if (festivalLocation.includes("paris")) {
      cityCode = "PAR";
    } else if (
      festivalLocation.includes("new york") ||
      festivalLocation.includes("nyc")
    ) {
      cityCode = "NYC";
    } else if (festivalLocation.includes("madrid")) {
      cityCode = "MAD";
    } else if (
      festivalLocation.includes("rome") ||
      festivalLocation.includes("roma")
    ) {
      cityCode = "ROM";
    } else if (festivalLocation.includes("barcelona")) {
      cityCode = "BCN";
    } else if (festivalLocation.includes("amsterdam")) {
      cityCode = "AMS";
    } else if (festivalLocation.includes("berlin")) {
      cityCode = "BER";
    } else if (
      festivalLocation.includes("brussels") ||
      festivalLocation.includes("bruxelles")
    ) {
      cityCode = "BRU";
    } else {
      // Pour les villes belges comme Nieuwpoort, utiliser Bruxelles comme référence
      cityCode = "BRU";
    }

    router.push({
      pathname: "/accommodation-config",
      params: {
        // ===== PRÉSERVER TOUS LES PARAMÈTRES EXISTANTS =====
        ...params,

        // ===== PARAMÈTRES SPÉCIFIQUES AU LOGEMENT =====
        festivalName: bookingData.festivalData.name,
        festivalLocation: bookingData.festivalData.location.city,
        cityCode: cityCode,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        guests: bookingData.personCount.toString(),
        rooms: "1", // Default to 1 room
      },
    });
  };

  const handleAddActivity = (date: string) => {
    console.log("🎭 [Navigation] Redirection vers Pedro Activités");

    if (!bookingData) {
      Alert.alert("Erreur", "Données du festival manquantes");
      return;
    }

    // Trouver les informations du jour sélectionné
    const selectedDay = tripDays.find(
      (day) => day.date.toISOString().split("T")[0] === date
    );

    if (!selectedDay) {
      Alert.alert("Erreur", "Jour sélectionné introuvable");
      return;
    }

    // Calculer les créneaux occupés pour ce jour
    const occupiedSlots = selectedDay.activities
      .filter((activity) => activity.isFixed)
      .map((activity) => ({
        name: activity.title,
        type: activity.type,
        time: activity.time || "Toute la journée",
        description: activity.subtitle || activity.description || "",
      }));

    // Calculer les créneaux libres disponibles
    const availableSlots = [];

    if (selectedDay.isFestivalDay) {
      // Jour de festival : créneaux avant et après le festival
      const hasMorningSlot = !occupiedSlots.some(
        (slot) =>
          slot.time.includes("matin") ||
          (slot.time.includes(":") && parseInt(slot.time.split(":")[0]) < 14)
      );
      const hasEveningSlot = !occupiedSlots.some(
        (slot) =>
          slot.time.includes("soir") ||
          (slot.time.includes(":") && parseInt(slot.time.split(":")[0]) > 14)
      );

      if (hasMorningSlot) {
        availableSlots.push({
          period: "morning",
          time: "09:00-17:00",
          description:
            "Avant le festival (recommandé pour visites culturelles)",
        });
      }
      if (hasEveningSlot) {
        availableSlots.push({
          period: "evening",
          time: "15:00-17:00",
          description: "Après-midi avant le festival (activités courtes)",
        });
      }
    } else {
      // Jour sans festival : créneaux flexibles
      availableSlots.push(
        {
          period: "morning",
          time: "09:00-12:00",
          description: "Matinée libre",
        },
        {
          period: "afternoon",
          time: "14:00-17:00",
          description: "Après-midi libre",
        },
        {
          period: "evening",
          time: "19:00-22:00",
          description: "Soirée libre",
        }
      );
    }

    // Préparer les paramètres enrichis pour Pedro Activités
    const festivalLocation = bookingData.festivalData.location;
    const activityParams = {
      // Contexte festival de base
      festivalName: bookingData.festivalData.name,
      festivalLocation: festivalLocation.city || festivalLocation.venue,
      latitude: (festivalLocation as any).coordinates?.latitude || "51.14103",
      longitude: (festivalLocation as any).coordinates?.longitude || "2.7463",
      festivalStartDate: bookingData.festivalData.dates.start,
      festivalEndDate:
        bookingData.festivalData.dates.end || bookingData.departureDate,

      // Planning détaillé du jour
      selectedDate: date,
      dayType: selectedDay.isFestivalDay ? "festival" : "free",
      dayName: selectedDay.dayName,

      // Créneaux occupés (pour éviter les conflits)
      occupiedSlots: JSON.stringify(occupiedSlots),

      // Créneaux libres disponibles
      availableSlots: JSON.stringify(availableSlots),

      // Contraintes temporelles
      maxActivitiesPerDay: MAX_ACTIVITIES_PER_DAY.toString(),
      currentActivitiesCount: selectedDay.activities
        .filter((a) => !a.isFixed)
        .length.toString(),

      // Toutes les dates du voyage pour le contexte
      availableDates: tripDays
        .map((day) => day.date.toISOString().split("T")[0])
        .join(","),

      // Préserver le contexte existant du voyage
      ...params, // Inclure tous les paramètres de transport, logement, etc.
    };

    console.log(
      "📤 [Activity Navigation] Paramètres enrichis envoyés:",
      JSON.stringify(activityParams, null, 2)
    );

    // Navigation vers Pedro Activités avec contexte complet
    router.push({
      pathname: "/activity-config",
      params: activityParams,
    });
  };

  // État pour le chargement du devis
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);

  // Fonction pour vérifier si la réservation est complète
  const isBookingComplete = () => {
    const hasAccommodation = params.accommodationValidated === "true";

    // Compter les transports validés pour aller et retour
    const transports = [];

    // Transport principal
    if (params.transportValidated === "true") {
      transports.push({
        direction: params.transportDirection || "round-trip",
        validated: true,
      });
    }

    // Transport secondaire (si il y en a un)
    if (params.transportValidated2 === "true") {
      transports.push({
        direction: params.transportDirection2 || "unknown",
        validated: true,
      });
    }

    // Transport retour explicite
    if (params.transportReturnValidated === "true") {
      transports.push({
        direction: "return",
        validated: true,
      });
    }

    // Debug des paramètres pour diagnostiquer
    console.log("🔍 [Debug Validation] Paramètres actuels:", {
      accommodationValidated: params.accommodationValidated,
      transportValidated: params.transportValidated,
      transportDirection: params.transportDirection,
      transportValidated2: params.transportValidated2,
      transportDirection2: params.transportDirection2,
      transportReturnValidated: params.transportReturnValidated,
      transports: transports,
      allParams: Object.keys(params).filter((key) => key.includes("transport")),
    });

    // Analyser si on a aller ET retour
    const hasOutbound = transports.some(
      (t) =>
        t.direction === "outbound" ||
        t.direction === "round-trip" ||
        t.direction === null ||
        t.direction === undefined
    );

    const hasReturn = transports.some(
      (t) =>
        t.direction === "return" ||
        t.direction === "round-trip" ||
        t.direction === null ||
        t.direction === undefined
    );

    // Si on a un seul transport validé sans direction spécifique,
    // on considère que c'est un aller-retour complet
    const hasSingleRoundTrip =
      transports.length === 1 &&
      (transports[0].direction === "round-trip" ||
        !transports[0].direction ||
        transports[0].direction === null);

    // Si on a exactement 2 transports validés (peu importe les directions)
    const hasTwoSeparateTransports = transports.length >= 2;

    const hasCompleteTransport =
      hasSingleRoundTrip ||
      hasTwoSeparateTransports ||
      (hasOutbound && hasReturn);

    // Solution temporaire : si on a logement + au moins 1 transport, on considère comme complet
    // car dans notre app, l'utilisateur valide séparément aller et retour
    const isComplete = hasAccommodation && transports.length >= 1;

    console.log("🔍 [Debug Validation] Résultats:", {
      hasAccommodation,
      transportsCount: transports.length,
      hasOutbound,
      hasReturn,
      hasSingleRoundTrip,
      hasTwoSeparateTransports,
      hasCompleteTransport,
      isComplete,
      finalResult: isComplete,
    });

    return isComplete;
  };

  // Fonction pour obtenir les détails des éléments manquants
  const getMissingItems = () => {
    const missing = [];
    if (params.accommodationValidated !== "true") missing.push("🏨 Logement");

    // Utiliser la même logique que isBookingComplete pour la cohérence
    const transports = [];

    if (params.transportValidated === "true") {
      transports.push({
        direction: params.transportDirection || "round-trip",
        validated: true,
      });
    }

    if (params.transportValidated2 === "true") {
      transports.push({
        direction: params.transportDirection2 || "unknown",
        validated: true,
      });
    }

    if (params.transportReturnValidated === "true") {
      transports.push({
        direction: "return",
        validated: true,
      });
    }

    const hasOutbound = transports.some(
      (t) =>
        t.direction === "outbound" ||
        t.direction === "round-trip" ||
        t.direction === null ||
        t.direction === undefined
    );

    const hasReturn = transports.some(
      (t) =>
        t.direction === "return" ||
        t.direction === "round-trip" ||
        t.direction === null ||
        t.direction === undefined
    );

    const hasSingleRoundTrip =
      transports.length === 1 &&
      (transports[0].direction === "round-trip" ||
        !transports[0].direction ||
        transports[0].direction === null);

    const hasTwoSeparateTransports = transports.length >= 2;

    const hasCompleteTransport =
      hasSingleRoundTrip ||
      hasTwoSeparateTransports ||
      (hasOutbound && hasReturn);

    // Utiliser la même logique simplifiée que isBookingComplete
    const hasTransport = transports.length >= 1;

    if (!hasTransport) {
      missing.push("✈️ Transport");
    }

    return missing;
  };

  const handleBookTrip = async () => {
    if (!bookingData) return;

    // Vérifier si la réservation est complète
    if (!isBookingComplete()) {
      const missing = [];
      if (params.accommodationValidated !== "true") missing.push("🏨 Logement");
      if (
        params.transportValidated !== "true" ||
        params.transportDirection !== "outbound"
      )
        missing.push("✈️ Vol aller");

      const hasReturnTransport =
        Object.keys(params).some(
          (key) => key.includes("transport") && params[key] === "return"
        ) || params.transportReturnValidated === "true";

      if (!hasReturnTransport) missing.push("🔄 Vol retour");

      Alert.alert(
        "Réservation incomplète",
        `Pour finaliser votre réservation, il manque :\n\n${missing.join(
          "\n"
        )}\n\nVeuillez compléter ces éléments avant de continuer.`,
        [{ text: "Compris", style: "default" }]
      );
      return;
    }

    // Si la réservation est complète, procéder à l'envoi du devis
    Alert.alert(
      "Demande de devis",
      `Votre voyage au ${bookingData.festivalData.name} est prêt !\n\n` +
        `📍 Départ: ${bookingData.departurePoint}\n` +
        `👥 ${bookingData.personCount} personne${
          bookingData.personCount > 1 ? "s" : ""
        }\n` +
        `📅 Du ${new Date(bookingData.arrivalDate).toLocaleDateString(
          "fr-FR"
        )} au ${new Date(bookingData.departureDate).toLocaleDateString(
          "fr-FR"
        )}\n\n` +
        `💰 Un devis détaillé va être généré et envoyé.`,
      [
        { text: "Modifier", style: "cancel" },
        {
          text: "Demander un devis",
          onPress: async () => {
            try {
              // Vérifier que l'utilisateur est connecté
              if (!session?.user) {
                Alert.alert(
                  "Erreur",
                  "Vous devez être connecté pour demander un devis. Veuillez vous connecter.",
                  [{ text: "OK", style: "default" }]
                );
                return;
              }

              // Envoyer la demande de devis à Airtable
              const baseURL =
                process.env.EXPO_PUBLIC_BETTER_AUTH_URL ||
                "http://localhost:8081";
              const response = await fetch(
                `${baseURL}/api/create-booking-request`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    bookingData,
                    params,
                    userId: session.user.id, // Passer l'ID utilisateur directement
                  }),
                }
              );

              if (response.ok) {
                const result = await response.json();
                Alert.alert(
                  "Devis envoyé !",
                  "Votre demande de devis a été enregistrée. Vous recevrez une réponse sous 24h.",
                  [
                    {
                      text: "Parfait",
                      onPress: () => router.push("/home"),
                    },
                  ]
                );
              } else {
                throw new Error("Erreur lors de l'envoi du devis");
              }
            } catch (error) {
              console.error("Erreur:", error);
              Alert.alert(
                "Erreur",
                "Une erreur s'est produite lors de l'envoi du devis. Veuillez réessayer.",
                [{ text: "OK", style: "default" }]
              );
            }
          },
        },
      ]
    );
  };

  if (!bookingData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>
          Erreur: Données de réservation manquantes
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={FestiFunColors.background} />
          </TouchableOpacity>
          <Text style={styles.festivalTitle}>
            {bookingData.festivalData.name}
          </Text>
          <TouchableOpacity style={styles.backButton}>
            <MoreHorizontal size={24} color={FestiFunColors.background} />
          </TouchableOpacity>
        </View>

        <View style={styles.subtitle}>
          <Text style={styles.subtitleText}>
            Ajoutez les différentes étapes de votre séjour avant de réserver
          </Text>
        </View>

        {/* Trajet Aller */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trajet aller</Text>
          {params.transportValidated === "true" ? (
            // Transport validé - Afficher la carte validée
            <View style={styles.validatedTransportCard}>
              <View style={styles.validatedTransportHeader}>
                <View style={styles.validatedTransportIcon}>
                  <Text style={styles.transportEmoji}>
                    {params.transportType === "flight"
                      ? "✈️"
                      : params.transportType === "train"
                      ? "🚆"
                      : "🚌"}
                  </Text>
                </View>
                <View style={styles.validatedTransportInfo}>
                  <Text style={styles.validatedTransportTitle}>
                    {params.transportType === "flight"
                      ? "Vol"
                      : params.transportType === "train"
                      ? "Train"
                      : "Bus"}{" "}
                    {params.transportCompany}
                  </Text>
                  <Text style={styles.validatedTransportSubtitle}>
                    {params.transportOrigin} → {params.transportDestination}
                  </Text>
                </View>
                <View style={styles.validatedTransportBadge}>
                  <Text style={styles.validatedBadgeText}>✓ Validé</Text>
                </View>
              </View>
              <View style={styles.validatedTransportDetails}>
                <Text style={styles.transportDetailText}>
                  {params.transportDepartureTime} -{" "}
                  {params.transportArrivalTime} • {params.transportDuration} •{" "}
                  {params.transportPrice}
                </Text>
              </View>
            </View>
          ) : (
            // Pas de transport validé - Afficher le bouton d'ajout
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddTravel("outbound")}
            >
              <Plus size={24} color={FestiFunColors.accent} />
              <Text style={styles.addButtonText}>Ajouter un trajet</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logement */}
        {params.accommodationValidated === "true" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Logement</Text>
            <View style={styles.validatedAccommodationCard}>
              <View style={styles.validatedAccommodationHeader}>
                <View style={styles.validatedAccommodationIcon}>
                  <Text style={styles.accommodationEmoji}>🏨</Text>
                </View>
                <View style={styles.validatedAccommodationInfo}>
                  <Text style={styles.validatedAccommodationTitle}>
                    {params.accommodationHotelName}
                  </Text>
                  <View style={styles.accommodationRatingContainer}>
                    {Array.from({
                      length: parseInt(
                        Array.isArray(params.accommodationRating)
                          ? params.accommodationRating[0] || "0"
                          : params.accommodationRating || "0"
                      ),
                    }).map((_, i) => (
                      <Text key={i} style={styles.starEmoji}>
                        ⭐
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.validatedAccommodationSubtitle}>
                    {params.accommodationRoomDescription}
                  </Text>
                </View>
                <View style={styles.validatedAccommodationBadge}>
                  <Text style={styles.validatedBadgeText}>✓ Réservé</Text>
                </View>
              </View>
              <View style={styles.validatedAccommodationDetails}>
                <Text style={styles.accommodationDetailText}>
                  📅{" "}
                  {new Date(
                    params.accommodationCheckIn as string
                  ).toLocaleDateString("fr-FR")}{" "}
                  →{" "}
                  {new Date(
                    params.accommodationCheckOut as string
                  ).toLocaleDateString("fr-FR")}
                </Text>
                <Text style={styles.accommodationDetailText}>
                  🛏️ {params.accommodationNights} nuits •{" "}
                  {params.accommodationGuests} invité(s) •{" "}
                  {params.accommodationPrice}
                </Text>
                {params.accommodationAmenities && (
                  <Text style={styles.accommodationDetailText}>
                    🏢{" "}
                    {(Array.isArray(params.accommodationAmenities)
                      ? params.accommodationAmenities[0] || ""
                      : params.accommodationAmenities || ""
                    )
                      .split(",")
                      .slice(0, 3)
                      .join(", ")}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Jours du séjour */}
        {tripDays.map((day, index) => (
          <View key={`day-${day.date.toISOString()}`} style={styles.daySection}>
            {/* En-tête du jour */}
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>
                {day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1)}{" "}
                {day.dayNumber} {day.month}
              </Text>
              {params.accommodationValidated === "true" ? (
                <View style={styles.accommodationValidatedBadge}>
                  <Bed size={16} color="#22c55e" />
                  <Text style={styles.accommodationValidatedText}>
                    Logement validé
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.accommodationButton}
                  onPress={() =>
                    handleAddAccommodation(day.date.toISOString().split("T")[0])
                  }
                >
                  <Plus size={18} color={FestiFunColors.accent} />
                  <Text style={styles.accommodationButtonText}>Logement</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Logique d'affichage des activités et boutons selon le type de jour */}
            {day.isFestivalDay ? (
              // Jour avec festival : bouton avant + festival + bouton après (si place)
              <>
                {/* Bouton avant le festival pour ajouter une activité */}
                {hasSpaceForMoreActivities(day) && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() =>
                      handleAddActivity(day.date.toISOString().split("T")[0])
                    }
                  >
                    <Plus size={24} color={FestiFunColors.accent} />
                    <Text style={styles.addButtonText}>
                      Ajouter une activité
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Afficher toutes les activités (festival + personnalisées) triées par heure */}
                {day.activities
                  .sort(
                    (a, b) => getActivityStartTime(a) - getActivityStartTime(b)
                  )
                  .map((activity) => (
                    <View key={activity.id} style={styles.activityCard}>
                      {activity.type === "festival" ? (
                        <ImageBackground
                          style={styles.festivalCard}
                          imageStyle={styles.festivalCardImage}
                        >
                          <View style={styles.festivalCardContent}>
                            <View style={styles.festivalInfo}>
                              <Guitar
                                size={24}
                                color={FestiFunColors.background}
                              />
                              <Text style={styles.festivalName}>
                                {activity.title}
                              </Text>
                            </View>
                            <View style={styles.festivalTime}>
                              <Clock
                                size={13}
                                color={FestiFunColors.background}
                              />
                              <Text style={styles.festivalTimeText}>
                                {activity.time}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.festivalOptionsButton}
                            >
                              <MoreHorizontal
                                size={24}
                                color={FestiFunColors.background}
                              />
                            </TouchableOpacity>
                          </View>
                        </ImageBackground>
                      ) : activity.type === "activity" ? (
                        // Activités validées via Pedro
                        <View style={styles.pedroActivityCard}>
                          <View style={styles.pedroActivityContent}>
                            <View style={styles.pedroActivityInfo}>
                              <MapPin size={24} color={FestiFunColors.accent} />
                              <View style={styles.pedroActivityTextContainer}>
                                <Text style={styles.pedroActivityTitle}>
                                  {activity.title}
                                </Text>
                                <Text style={styles.pedroActivitySubtitle}>
                                  {activity.subtitle}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.pedroActivityTime}>
                              <Clock size={16} color={FestiFunColors.white} />
                              <Text style={styles.pedroActivityTimeText}>
                                {activity.time}
                              </Text>
                            </View>
                            <Text style={styles.pedroActivityDescription}>
                              {activity.description}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        // Activités personnalisées
                        <View style={styles.customActivityCard}>
                          <Star
                            size={20}
                            color={FestiFunColors.accent}
                            style={{ marginRight: 12 }}
                          />
                          <View style={styles.customActivityInfo}>
                            <Text style={styles.customActivityTitle}>
                              {activity.title}
                            </Text>
                            {activity.time && (
                              <Text style={styles.customActivityTime}>
                                {activity.time}
                              </Text>
                            )}
                          </View>
                          <TouchableOpacity
                            style={styles.festivalOptionsButton}
                          >
                            <MoreHorizontal
                              size={20}
                              color={FestiFunColors.background + "60"}
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}

                {/* Bouton après le festival (si place disponible) */}
                {hasSpaceForMoreActivities(day) ? (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() =>
                      handleAddActivity(day.date.toISOString().split("T")[0])
                    }
                  >
                    <Plus size={24} color={FestiFunColors.accent} />
                    <Text style={styles.addButtonText}>
                      Ajouter une activité
                    </Text>
                  </TouchableOpacity>
                ) : (
                  // Message quand la journée est pleine
                  day.activities.filter((a) => !a.isFixed).length > 0 && (
                    <View style={styles.dayFullMessage}>
                      <Text style={styles.dayFullText}>
                        Journée complète ({MAX_ACTIVITIES_PER_DAY} activités max
                        + festival)
                      </Text>
                    </View>
                  )
                )}
              </>
            ) : (
              // Jour sans festival : activités et boutons intercalés intelligemment
              <>{renderNonFestivalContent(day)}</>
            )}
          </View>
        ))}

        {/* Trajet Retour */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trajet Retour</Text>
          {params.transportValidated === "true" &&
          params.transportDirection === "return" ? (
            // Transport retour validé - Afficher la carte validée
            <View style={styles.validatedTransportCard}>
              <View style={styles.validatedTransportHeader}>
                <View style={styles.validatedTransportIcon}>
                  <Text style={styles.transportEmoji}>
                    {params.transportType === "flight"
                      ? "✈️"
                      : params.transportType === "train"
                      ? "🚆"
                      : "🚌"}
                  </Text>
                </View>
                <View style={styles.validatedTransportInfo}>
                  <Text style={styles.validatedTransportTitle}>
                    {params.transportType === "flight"
                      ? "Vol"
                      : params.transportType === "train"
                      ? "Train"
                      : "Bus"}{" "}
                    {params.transportCompany}
                  </Text>
                  <Text style={styles.validatedTransportSubtitle}>
                    {params.transportOrigin} → {params.transportDestination}
                  </Text>
                </View>
                <View style={styles.validatedTransportBadge}>
                  <Text style={styles.validatedBadgeText}>✓ Validé</Text>
                </View>
              </View>
              <View style={styles.validatedTransportDetails}>
                <Text style={styles.transportDetailText}>
                  {params.transportDepartureTime} -{" "}
                  {params.transportArrivalTime} • {params.transportDuration} •{" "}
                  {params.transportPrice}
                </Text>
              </View>
            </View>
          ) : (
            // Pas de transport retour validé - Afficher le bouton d'ajout
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddTravel("return")}
            >
              <Plus size={24} color={FestiFunColors.accent} />
              <Text style={styles.addButtonText}>Ajouter un trajet</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bouton de réservation fixe */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.favoriteButton}>
          <Heart size={24} color={FestiFunColors.background} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!isBookingComplete() || isCreatingQuote) &&
              styles.bookButtonDisabled,
          ]}
          onPress={handleBookTrip}
          disabled={!isBookingComplete() || isCreatingQuote}
        >
          <Text style={styles.bookButtonText}>
            {isCreatingQuote
              ? "Envoi en cours..."
              : isBookingComplete()
              ? "Demander un devis"
              : "Réservation incomplète"}
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
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  festivalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
  },
  subtitle: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: "center",
  },
  subtitleText: {
    fontSize: 16,
    color: FestiFunColors.textOnDark,
    textAlign: "center",
    lineHeight: 22,
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: FestiFunColors.background,
    marginBottom: 15,
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
  },
  daySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
  },
  accommodationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: FestiFunColors.accent + "50",
  },
  accommodationButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: FestiFunColors.background,
    fontFamily: FestiFunFonts.variants.poppinsMedium,
  },
  accommodationValidatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#22c55e",
  },
  accommodationValidatedText: {
    fontSize: 12,
    color: "#22c55e",
    fontFamily: FestiFunFonts.variants.poppinsMedium,
    fontWeight: "600",
  },
  activityValidatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#22c55e",
  },
  activityValidatedText: {
    fontSize: 12,
    color: "#22c55e",
    fontFamily: FestiFunFonts.variants.poppinsMedium,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: FestiFunColors.accent + "30",
    marginBottom: 10,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
  },
  activityCard: {
    marginBottom: 10,
  },
  festivalCard: {
    height: 90,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: FestiFunColors.primary,
  },
  festivalCardImage: {
    borderRadius: 24,
  },
  festivalCardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "rgba(119, 66, 254, 0.9)",
  },
  festivalInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  festivalName: {
    fontSize: 18,
    fontWeight: "700",
    color: FestiFunColors.background,
    fontFamily: FestiFunFonts.variants.poppinsBold,
  },
  festivalTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  festivalTimeText: {
    fontSize: 12,
    color: FestiFunColors.background,
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
  festivalOptionsButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  customActivityCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  customActivityInfo: {
    flex: 1,
  },
  customActivityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
    marginBottom: 4,
  },
  customActivityTime: {
    fontSize: 12,
    color: FestiFunColors.textOnDark + "80",
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
  dayFullMessage: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  dayFullText: {
    fontSize: 14,
    color: FestiFunColors.textOnDark + "60",
    fontFamily: FestiFunFonts.variants.poppinsRegular,
    textAlign: "center",
  },
  bottomSpacing: {
    height: 20,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: FestiFunColors.primaryDark,
    gap: 12,
  },
  favoriteButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bookButton: {
    flex: 1,
    backgroundColor: FestiFunColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  bookButtonDisabled: {
    backgroundColor: FestiFunColors.textOnDark + "40",
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: FestiFunColors.background,
    fontFamily: FestiFunFonts.variants.poppinsBold,
  },
  errorText: {
    fontSize: 16,
    color: FestiFunColors.error,
    textAlign: "center",
    margin: 20,
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
  // Styles pour la carte de transport validé
  validatedTransportCard: {
    backgroundColor: "rgba(74, 144, 226, 0.15)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.3)",
    overflow: "hidden",
  },
  validatedTransportHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  validatedTransportIcon: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(74, 144, 226, 0.2)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  transportEmoji: {
    fontSize: 18,
  },
  validatedTransportInfo: {
    flex: 1,
  },
  validatedTransportTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
    marginBottom: 2,
  },
  validatedTransportSubtitle: {
    fontSize: 14,
    color: FestiFunColors.textOnDark + "80",
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
  validatedTransportBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  validatedBadgeText: {
    fontSize: 12,
    color: FestiFunColors.white,
    fontWeight: "600",
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
  },
  validatedTransportDetails: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  transportDetailText: {
    fontSize: 12,
    color: FestiFunColors.textOnDark + "70",
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
  // Styles pour la carte de logement validé
  validatedAccommodationCard: {
    backgroundColor: "rgba(46, 213, 115, 0.15)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(46, 213, 115, 0.3)",
    overflow: "hidden",
  },
  validatedAccommodationHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  validatedAccommodationIcon: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(46, 213, 115, 0.2)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  accommodationEmoji: {
    fontSize: 20,
  },
  validatedAccommodationInfo: {
    flex: 1,
    gap: 4,
  },
  validatedAccommodationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
  },
  accommodationRatingContainer: {
    flexDirection: "row",
    gap: 2,
  },
  starEmoji: {
    fontSize: 12,
  },
  validatedAccommodationSubtitle: {
    fontSize: 14,
    color: FestiFunColors.textOnDark + "80",
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
  validatedAccommodationBadge: {
    backgroundColor: "rgba(46, 213, 115, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  validatedAccommodationDetails: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 4,
  },
  accommodationDetailText: {
    fontSize: 12,
    color: FestiFunColors.textOnDark + "70",
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
  // Styles pour les activités Pedro
  pedroActivityCard: {
    backgroundColor: "rgba(138, 43, 226, 0.15)",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: FestiFunColors.accent + "40",
  },
  pedroActivityContent: {
    gap: 12,
  },
  pedroActivityInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  pedroActivityTextContainer: {
    flex: 1,
    gap: 4,
  },
  pedroActivityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
  },
  pedroActivitySubtitle: {
    fontSize: 14,
    color: FestiFunColors.textOnDark + "80",
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
  pedroActivityTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(138, 43, 226, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  pedroActivityTimeText: {
    fontSize: 14,
    fontWeight: "500",
    color: FestiFunColors.white,
    fontFamily: FestiFunFonts.variants.poppinsMedium,
  },
  pedroActivityDescription: {
    fontSize: 12,
    color: FestiFunColors.textOnDark + "70",
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
});
