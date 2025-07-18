import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Heart } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FestiFunColors, FestiFunTypography } from "../lib/design-system";
import { FestivalMatch } from "../lib/festival-matcher";
import { geoSearchService } from "../lib/geo-search-service";
import { useTranslation } from "../lib/useTranslation";

const { width } = Dimensions.get("window");

interface UserLocation {
  city: string;
  country: string;
  countryCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface FestivalCardProps {
  festival: FestivalMatch;
  userLocation?: UserLocation | null;
  isFullWidth?: boolean;
  onPress?: () => void;
  onLikePress?: () => void;
  showArtists?: boolean;
}

export default function FestivalCard({
  festival,
  userLocation,
  isFullWidth = false,
  onPress,
  onLikePress,
  showArtists = true,
}: FestivalCardProps) {
  // Fonction pour capitaliser la première lettre
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Fonction pour calculer la distance
  const calculateDistance = (): string => {
    if (!userLocation?.coordinates || !festival.location.coordinates) {
      return "";
    }

    const distance = geoSearchService.calculateDistance(
      userLocation.coordinates.latitude,
      userLocation.coordinates.longitude,
      festival.location.coordinates.latitude,
      festival.location.coordinates.longitude
    );

    if (distance < 1) {
      return "< 1 km";
    } else if (distance < 100) {
      return `${Math.round(distance)} km`;
    } else {
      return `${Math.round(distance / 10) * 10} km`;
    }
  };

  const distance = calculateDistance();

  return (
    <TouchableOpacity
      style={[styles.festivalCard, isFullWidth && styles.festivalCardFullWidth]}
      onPress={onPress}
    >
      <Image
        source={{
          uri: festival.image || "https://via.placeholder.com/345x191",
        }}
        style={styles.festivalImage}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.festivalOverlay}
      >
        <View style={styles.festivalContent}>
          <View style={styles.festivalHeader}>
            <View style={styles.genreTag}>
              <Text style={styles.genreTagText}>
                {capitalizeFirst(festival.matchingGenres[0] || "Festival")}
              </Text>
            </View>
            <TouchableOpacity onPress={onLikePress}>
              <Heart size={20} color={FestiFunColors.background} />
            </TouchableOpacity>
          </View>
          <View style={styles.festivalInfo}>
            <Text style={styles.festivalTitle}>{festival.name}</Text>
            <View style={styles.festivalMeta}>
              <Text style={styles.festivalDate}>
                {new Date(festival.dates.start).toLocaleDateString("fr-FR")}
              </Text>
              <View style={styles.dot} />
              <Text style={styles.festivalLocation}>
                {festival.location.city}, {festival.location.country}
              </Text>
              {distance && (
                <>
                  <View style={styles.dot} />
                  <Text style={styles.festivalDistance}>{distance}</Text>
                </>
              )}
            </View>
            {/* Affichage de la liste complète des artistes */}
            {showArtists && festival.artists.length > 0 && (
              <Text style={styles.festivalArtists} numberOfLines={2}>
                {festival.artists.join(", ")}
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  festivalCard: {
    width: 345,
    height: 191,
    borderRadius: 24,
    overflow: "hidden",
  },

  festivalCardFullWidth: {
    width: width - 36, // Pleine largeur moins padding
    marginBottom: 12,
  },

  festivalImage: {
    width: "100%",
    height: "100%",
  },

  festivalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  festivalContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },

  festivalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  genreTag: {
    backgroundColor: "rgba(245, 239, 253, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.4,
    borderColor: FestiFunColors.background,
  },

  genreTagText: {
    fontSize: 8,
    fontWeight: "700",
    color: FestiFunColors.background,
  },

  festivalInfo: {
    gap: 6,
  },

  festivalTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.title.fontFamily,
  },

  festivalMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  festivalDate: {
    fontSize: 12,
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.body.fontFamily,
    opacity: 0.8,
  },

  festivalLocation: {
    fontSize: 12,
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.body.fontFamily,
    opacity: 0.8,
  },

  // Distance en blanc pour la lisibilité
  festivalDistance: {
    fontSize: 12,
    color: FestiFunColors.background, // Changé en blanc
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
    opacity: 0.9,
  },

  festivalArtists: {
    fontSize: 11,
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.body.fontFamily,
    opacity: 0.7,
    lineHeight: 14,
  },

  dot: {
    width: 3,
    height: 3,
    backgroundColor: FestiFunColors.background,
    borderRadius: 1.5,
    opacity: 0.6,
  },
});
