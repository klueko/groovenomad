import React, { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
  Modal,
} from "react-native";
import { WebView } from "react-native-webview";
import { useRouter } from "expo-router";
import { ArrowLeft, Home, Map, Ticket, User } from "lucide-react-native";
import { FestiFunColors, FestiFunFonts } from "../lib/design-system";
import { useSession } from "../lib/auth-client";
import Constants from "expo-constants";
import BottomNavigation from "../components/BottomNavigation";

// Types pour les réservations
interface Booking {
  id: string;
  commandeId: string;
  festivalName: string;
  destination: string;
  country: string;
  status: string;
  dateCommande: string;
  dateEnvoiDevis?: string;
  referenceDevis: number;
  nbFestivaliers: number;
  typeTransport: string;
  villeDepart: string;
  dateDepartTransport: string;
  typeHebergement: string;
  adresseHebergement: string;
  activitesSupplementaires?: string;
  dateFestivalStart: string;
  dateFestivalEnd: string;
  atmosphere?: string;
  ticketType?: string;
  currency: string;
  prixTicketHT?: number;
  prixTransportHT?: number;
  prixHebergementTTC?: number;
  montantTotalTTC?: number;
  devisHtml?: string;
  createdTime: string;
}

const MesBillets = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuoteHtml, setSelectedQuoteHtml] = useState<string | null>(
    null
  );
  const [isQuoteModalVisible, setQuoteModalVisible] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  // States liés à la signature retirés

  // Fonction pour récupérer les réservations
  const fetchBookings = async (isRefresh = false) => {
    if (!session?.user?.id) {
      console.log("❌ [Mes Billets] Pas de session utilisateur");
      if (!isRefresh) setLoading(false);
      return;
    }

    try {
      console.log("🔍 [Mes Billets] Récupération des réservations...");

      const baseURL =
        Constants.expoConfig?.extra?.betterAuthUrl || "http://localhost:8081";
      const response = await fetch(
        `${baseURL}/api/get-user-bookings?userId=${session.user.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la récupération des réservations"
        );
      }

      const data = await response.json();
      console.log(
        "✅ [Mes Billets] Réservations récupérées:",
        data.bookings.length
      );

      // Log détaillé des réservations pour voir le contenu HTML du devis
      data.bookings.forEach((booking: Booking, index: number) => {
        console.log(
          `📋 [Réservation ${index + 1}] Status: ${booking.status}`,
          booking
        );
      });

      setBookings(data.bookings);
      setError(null);
    } catch (error) {
      console.error("❌ [Mes Billets] Erreur:", error);
      if (!isRefresh) {
        setError(error instanceof Error ? error.message : "Erreur inconnue");
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Refresh manuel
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings(true);
  };

  // Effet initial et auto-refresh
  useEffect(() => {
    // Chargement initial
    fetchBookings();

    // Auto-refresh toutes les 10 secondes
    refreshIntervalRef.current = setInterval(() => {
      if (session?.user?.id) {
        console.log(
          "🔄 [Auto-refresh] Mise à jour automatique des réservations"
        );
        fetchBookings(true);
      }
    }, 10000); // 10 secondes

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [session?.user?.id]);

  // Filtrer les réservations selon l'onglet actif
  const filteredBookings = bookings.filter((booking) => {
    const festivalEndDate = new Date(booking.dateFestivalEnd);
    const now = new Date();

    if (activeTab === "upcoming") {
      return festivalEndDate >= now;
    } else {
      return festivalEndDate < now;
    }
  });

  // Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return date.toLocaleDateString("fr-FR", options);
  };

  // Fonction pour formater la période du festival
  const formatFestivalPeriod = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startFormatted = formatDate(startDate);
    const endFormatted = formatDate(endDate);

    // Si même jour
    if (start.toDateString() === end.toDateString()) {
      return startFormatted;
    }

    return `${startFormatted} - ${endFormatted}`;
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "attente":
        return "#FFA500"; // Orange
      case "envoyé":
        return "#FFD700"; // Jaune
      case "acceptée":
        return "#32CD32"; // Vert
      case "refusée":
        return "#FF4444"; // Rouge
      case "abandonnée":
        return "#888888"; // Gris
      default:
        return "#FFA500"; // Orange par défaut
    }
  };

  // Fonction pour obtenir l'image du festival (placeholder pour l'instant)
  const getFestivalImage = (festivalName: string) => {
    // Pour l'instant, on utilise une image placeholder
    // Plus tard, on pourra mapper les noms de festivals avec leurs vraies images
    return (
      "https://via.placeholder.com/106x74/6B46C1/FFFFFF?text=" +
      encodeURIComponent(festivalName.substring(0, 3))
    );
  };

  const renderBookingItem = (booking: Booking) => {
    const isQuoteReady = booking.status.toLowerCase() === "envoyé";

    return (
      <View key={booking.id} style={styles.bookingContainer}>
        <Pressable
          style={styles.bookingItem}
          onPress={() => {
            // Navigation vers les détails de la réservation
            console.log("📱 Navigation vers détails réservation:", booking.id);
          }}
        >
          <Image
            style={styles.festivalImage}
            source={{ uri: getFestivalImage(booking.festivalName) }}
          />
          <View style={styles.bookingInfo}>
            <View style={styles.bookingHeader}>
              <Text style={styles.festivalName}>{booking.festivalName}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(booking.status) },
                ]}
              >
                <Text style={styles.statusText}>{booking.status}</Text>
              </View>
            </View>
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>Date</Text>
              <Text style={styles.dateValue}>
                {formatFestivalPeriod(
                  booking.dateFestivalStart,
                  booking.dateFestivalEnd
                )}
              </Text>
            </View>
            <Text style={styles.destination}>{booking.destination}</Text>
          </View>
        </Pressable>

        {/* Interface spéciale pour les devis envoyés */}
        {isQuoteReady && (
          <View style={styles.quoteReadyContainer}>
            <View style={styles.quoteReadyHeader}>
              <Text style={styles.quoteReadyTitle}>
                🎉 Votre devis est prêt !
              </Text>
              <Text style={styles.quoteReadySubtitle}>
                Consultez votre devis personnalisé pour ce voyage
              </Text>
            </View>
            <Pressable
              style={styles.viewQuoteButton}
              onPress={() => {
                console.log("📄 Ouverture du devis pour:", booking.id);
                if (booking.devisHtml) {
                  setSelectedQuoteHtml(booking.devisHtml);
                  setQuoteModalVisible(true);
                } else {
                  Alert.alert(
                    "Devis indisponible",
                    "Le devis n'est pas encore prêt pour cette réservation."
                  );
                }
              }}
            >
              <Text style={styles.viewQuoteButtonText}>Voir mon devis</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={FestiFunColors.primary} />
          <Text style={styles.loadingText}>
            Chargement de vos réservations...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erreur: {error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              // Relancer le useEffect
            }}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const updateQuoteStatus = async (
    bookingId: string,
    status: "acceptée" | "refusée"
  ) => {
    if (!session?.user?.id) {
      Alert.alert("Utilisateur non authentifié");
      return;
    }

    try {
      setIsSigning(true);

      const baseURL =
        Constants.expoConfig?.extra?.betterAuthUrl || "http://localhost:8081";

      const res = await fetch(`${baseURL}/api/sign-quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          userId: session.user.id,
          status,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de la signature du devis");
      }

      const successMessage =
        status === "acceptée"
          ? "Merci d'avoir confirmé votre devis !"
          : "Vous avez refusé ce devis.";
      Alert.alert("Succès", successMessage);
      setQuoteModalVisible(false);

      // Rafraîchir la liste
      fetchBookings(true);
    } catch (error) {
      Alert.alert(
        "Erreur",
        error instanceof Error ? error.message : "Erreur inconnue"
      );
    } finally {
      setIsSigning(false);
    }
  };

  // Fonctions de signature retirées : acceptation directe

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#995fff"
            colors={["#995fff"]}
          />
        }
      >
        {/* Titre */}
        <Text style={styles.title}>Mes billets</Text>

        {/* Onglets */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[
              styles.tab,
              activeTab === "upcoming" ? styles.activeTab : styles.inactiveTab,
            ]}
            onPress={() => setActiveTab("upcoming")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "upcoming"
                  ? styles.activeTabText
                  : styles.inactiveTabText,
              ]}
            >
              À venir
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === "past" ? styles.activeTab : styles.inactiveTab,
            ]}
            onPress={() => setActiveTab("past")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "past"
                  ? styles.activeTabText
                  : styles.inactiveTabText,
              ]}
            >
              Passés
            </Text>
          </Pressable>
        </View>

        {/* Liste des réservations */}
        <View style={styles.bookingsList}>
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {activeTab === "upcoming"
                  ? "Aucune réservation à venir"
                  : "Aucune réservation passée"}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Vos réservations apparaîtront ici
              </Text>
            </View>
          ) : (
            filteredBookings.map((booking, index) => (
              <View key={`booking-wrapper-${booking.id}`}>
                {renderBookingItem(booking)}
                {index < filteredBookings.length - 1 && (
                  <View style={styles.separator} />
                )}
              </View>
            ))
          )}
        </View>

        {/* Espace pour la bottom nav */}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Bottom Navigation officielle */}
      <BottomNavigation
        activeTab="tickets"
        onTabPress={(tab) => {
          if (tab === "home") {
            router.push("/home");
          } else if (tab === "profile") {
            router.push("/music-profile");
          }
          // Les autres navigations sont gérées automatiquement par le composant
        }}
      />

      {/* Modal d'affichage du devis */}
      <Modal
        visible={isQuoteModalVisible}
        animationType="slide"
        onRequestClose={() => setQuoteModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#19002c" }}>
          <Pressable
            onPress={() => setQuoteModalVisible(false)}
            style={{
              padding: 16,
              backgroundColor: FestiFunColors.primary,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#fafafa",
                fontFamily: FestiFunFonts.variants.poppinsMedium,
              }}
            >
              Fermer
            </Text>
          </Pressable>
          {selectedQuoteHtml ? (
            <WebView
              originWhitelist={["*"]}
              source={{ html: selectedQuoteHtml }}
              style={{ flex: 1, marginBottom: 70 }}
            />
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#fafafa",
                  fontFamily: FestiFunFonts.variants.poppinsRegular,
                }}
              >
                Devis introuvable
              </Text>
            </View>
          )}

          {/* Boutons Action */}
          <View style={styles.quoteActions}>
            {/* Refuser */}
            <Pressable
              onPress={() => {
                if (isSigning) return;
                const currentBooking = bookings.find(
                  (b) => b.devisHtml === selectedQuoteHtml
                );
                if (currentBooking) {
                  updateQuoteStatus(currentBooking.id, "refusée");
                }
              }}
              style={{
                flex: 1,
                backgroundColor: "#666",
                paddingVertical: 20,
                alignItems: "center",
              }}
            >
              {isSigning ? (
                <ActivityIndicator color="#fafafa" />
              ) : (
                <Text
                  style={{
                    color: "#fafafa",
                    fontFamily: FestiFunFonts.variants.poppinsMedium,
                    fontSize: 16,
                  }}
                >
                  Refuser
                </Text>
              )}
            </Pressable>

            {/* Signer */}
            <Pressable
              onPress={() => {
                if (isSigning) return;
                const currentBooking = bookings.find(
                  (b) => b.devisHtml === selectedQuoteHtml
                );
                if (currentBooking) {
                  updateQuoteStatus(currentBooking.id, "acceptée");
                }
              }}
              style={{
                flex: 1,
                backgroundColor: FestiFunColors.primary,
                paddingVertical: 20,
                alignItems: "center",
              }}
            >
              {isSigning ? (
                <ActivityIndicator color="#fafafa" />
              ) : (
                <Text
                  style={{
                    color: "#fafafa",
                    fontFamily: FestiFunFonts.variants.poppinsMedium,
                    fontSize: 16,
                  }}
                >
                  Signer le devis
                </Text>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#19002c",
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 64,
    gap: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#fafafa",
    fontSize: 16,
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 16,
    fontFamily: FestiFunFonts.variants.poppinsRegular,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: FestiFunColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#fafafa",
    fontSize: 14,
    fontFamily: FestiFunFonts.variants.poppinsMedium,
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeText: {
    color: "#fafafa",
    fontSize: 16,
    fontFamily: FestiFunFonts.variants.poppinsMedium,
  },
  statusIcons: {
    flexDirection: "row",
    gap: 10,
  },
  signalIcon: {
    width: 20,
    height: 14,
    backgroundColor: "#fafafa",
    borderRadius: 2,
  },
  wifiIcon: {
    width: 16,
    height: 14,
    backgroundColor: "#fafafa",
    borderRadius: 2,
  },
  batteryIcon: {
    width: 25,
    height: 14,
    backgroundColor: "#fafafa",
    borderRadius: 2,
  },
  title: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "600",
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
    color: "#fafafa",
    textAlign: "left",
  },
  tabContainer: {
    flexDirection: "row",
    gap: 32,
    justifyContent: "center",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    height: 37,
    borderWidth: 0.4,
    borderRadius: 20,
    borderStyle: "solid",
    justifyContent: "center",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "rgba(153, 95, 255, 0.3)",
    borderColor: "#995fff",
  },
  inactiveTab: {
    backgroundColor: "rgba(245, 239, 253, 0.14)",
    borderColor: "#ad9cbb",
  },
  tabText: {
    textAlign: "center",
    fontFamily: FestiFunFonts.variants.poppinsMedium,
    fontWeight: "500",
    lineHeight: 12,
    fontSize: 12,
  },
  activeTabText: {
    color: "#995fff",
  },
  inactiveTabText: {
    color: "#ad9cbb",
  },
  bookingsList: {
    gap: 12,
  },
  bookingItem: {
    flexDirection: "row",
    gap: 18,
    alignItems: "center",
    paddingVertical: 8,
  },
  festivalImage: {
    width: 106,
    height: 74,
    borderRadius: 24,
  },
  bookingInfo: {
    flex: 1,
    gap: 8,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  festivalName: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: FestiFunFonts.variants.poppinsRegular,
    color: "#fafafa",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: FestiFunFonts.variants.poppinsMedium,
    color: "#000000",
  },
  dateInfo: {
    gap: 2,
  },
  dateLabel: {
    color: "#ad9cbb",
    lineHeight: 13,
    fontFamily: FestiFunFonts.variants.poppinsRegular,
    fontSize: 12,
  },
  dateValue: {
    color: "#fafafa",
    lineHeight: 13,
    fontFamily: FestiFunFonts.variants.poppinsRegular,
    fontSize: 12,
  },
  destination: {
    color: "#ad9cbb",
    fontSize: 12,
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(245, 239, 253, 0.1)",
    marginVertical: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 8,
  },
  emptyStateText: {
    color: "#fafafa",
    fontSize: 16,
    fontFamily: FestiFunFonts.variants.poppinsMedium,
    textAlign: "center",
  },
  emptyStateSubtext: {
    color: "#ad9cbb",
    fontSize: 14,
    fontFamily: FestiFunFonts.variants.poppinsRegular,
    textAlign: "center",
  },
  bottomSpace: {
    height: 105,
  },
  bookingContainer: {
    marginBottom: 12,
  },
  quoteReadyContainer: {
    backgroundColor: "rgba(153, 95, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(153, 95, 255, 0.3)",
  },
  quoteReadyHeader: {
    marginBottom: 16,
  },
  quoteReadyTitle: {
    fontSize: 16,
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
    color: FestiFunColors.white,
    marginBottom: 4,
  },
  quoteReadySubtitle: {
    fontSize: 14,
    fontFamily: FestiFunFonts.variants.poppinsRegular,
    color: "#ad9cbb",
    lineHeight: 18,
  },
  viewQuoteButton: {
    backgroundColor: "#995fff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
  },
  viewQuoteButtonText: {
    fontSize: 14,
    fontFamily: FestiFunFonts.variants.poppinsMedium,
    color: "#fafafa",
  },
  quoteActions: {
    flexDirection: "row",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
    height: 70,
  },
});

export default MesBillets;
