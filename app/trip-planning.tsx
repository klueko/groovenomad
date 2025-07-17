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

export default function TripPlanning() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Configuration
  const MAX_ACTIVITIES_PER_DAY = 4; // Nombre maximum d'activités personnalisées par jour

  // Récupérer les données de réservation
  const bookingData = useMemo<BookingData | null>(() => {
    try {
      // Si nous avons les nouveaux paramètres individuels du festival
      if (params.festivalName && params.festivalVenue) {
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
    if (!bookingData) return [];

    const arrival = new Date(bookingData.arrivalDate);
    const departure = new Date(bookingData.departureDate);
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

      // Ajouter les activités personnalisées
      if (tripActivities[dateStr]) {
        dayPlan.activities.push(...tripActivities[dateStr]);
      }

      days.push(dayPlan);
      currentDate.setDate(currentDate.getDate() + 1);
    }

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
    Alert.alert(
      "Ajouter un logement",
      `Configuration du logement pour le ${new Date(date).toLocaleDateString(
        "fr-FR"
      )}`,
      [{ text: "OK" }]
    );
  };

  const handleAddActivity = (date: string) => {
    Alert.alert(
      "Ajouter une activité",
      `Ajouter une activité pour le ${new Date(date).toLocaleDateString(
        "fr-FR"
      )}`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Test - Ajouter",
          onPress: () => {
            // Ajouter une activité de test pour voir la logique fonctionner
            const newActivity: TripActivity = {
              id: `activity-${Date.now()}`,
              type: "activity",
              title: `Activité ${(tripActivities[date]?.length || 0) + 1}`,
              time: "14h00",
              isFixed: false,
            };

            setTripActivities((prev) => ({
              ...prev,
              [date]: [...(prev[date] || []), newActivity],
            }));
          },
        },
      ]
    );
  };

  const handleBookTrip = () => {
    if (!bookingData) return;

    Alert.alert(
      "Réserver mon séjour",
      `Confirmation de votre séjour au ${bookingData.festivalData.name}\n\n` +
        `📍 Départ: ${bookingData.departurePoint}\n` +
        `👥 ${bookingData.personCount} personne${
          bookingData.personCount > 1 ? "s" : ""
        }\n` +
        `📅 Du ${new Date(bookingData.arrivalDate).toLocaleDateString(
          "fr-FR"
        )} au ${new Date(bookingData.departureDate).toLocaleDateString(
          "fr-FR"
        )}\n` +
        `⏰ Arrivée prévue: ${bookingData.selectedTime}`,
      [
        { text: "Modifier", style: "cancel" },
        {
          text: "Confirmer",
          onPress: () => {
            Alert.alert(
              "Réservation confirmée !",
              "Votre séjour a été réservé avec succès."
            );
            router.push("/home");
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
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddTravel("outbound")}
          >
            <Plus size={24} color={FestiFunColors.accent} />
            <Text style={styles.addButtonText}>Ajouter un trajet</Text>
          </TouchableOpacity>
        </View>

        {/* Jours du séjour */}
        {tripDays.map((day, index) => (
          <View key={`day-${day.date.toISOString()}`} style={styles.daySection}>
            {/* En-tête du jour */}
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>
                {day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1)}{" "}
                {day.dayNumber} {day.month}
              </Text>
              <TouchableOpacity
                style={styles.accommodationButton}
                onPress={() =>
                  handleAddAccommodation(day.date.toISOString().split("T")[0])
                }
              >
                <Plus size={18} color={FestiFunColors.accent} />
                <Text style={styles.accommodationButtonText}>Logement</Text>
              </TouchableOpacity>
            </View>

            {/* Logique d'affichage des activités et boutons selon le type de jour */}
            {day.isFestivalDay ? (
              // Jour avec festival : bouton avant + festival + bouton après (si place)
              <>
                {/* Bouton avant le festival (si place disponible) */}
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

                {/* Afficher toutes les activités (festival + personnalisées) */}
                {day.activities.map((activity) => (
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
                        <TouchableOpacity style={styles.festivalOptionsButton}>
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
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddTravel("return")}
          >
            <Plus size={24} color={FestiFunColors.accent} />
            <Text style={styles.addButtonText}>Ajouter un trajet</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bouton de réservation fixe */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.favoriteButton}>
          <Heart size={24} color={FestiFunColors.background} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookTrip}>
          <Text style={styles.bookButtonText}>Réserver mon séjour</Text>
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
});
