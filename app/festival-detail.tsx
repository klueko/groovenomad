import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  ImageBackground,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Linking,
} from "react-native";
import { WebView } from "react-native-webview";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Settings,
  MapPin,
  Calendar,
  Star,
  Sun,
  Users,
  Share,
  Share2,
  Heart,
} from "lucide-react-native";
import { FestiFunColors, FestiFunTypography } from "../lib/design-system";
import { FestivalMatch } from "../lib/festival-matcher";

const { width } = Dimensions.get("window");

export default function FestivalDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Récupérer les vraies données du festival depuis les paramètres
  let festivalData: FestivalMatch | null = null;

  try {
    if (params.data && typeof params.data === "string") {
      festivalData = JSON.parse(decodeURIComponent(params.data));
    }
  } catch (error) {
    console.error("Erreur lors du parsing des données du festival:", error);
  }

  // Données par défaut si les paramètres ne sont pas disponibles
  if (!festivalData) {
    festivalData = {
      id: "default",
      name: "Festival non trouvé",
      description: "Informations non disponibles",
      image: "https://via.placeholder.com/400x300",
      location: {
        venue: "Lieu non spécifié",
        city: "Ville non spécifiée",
        country: "Pays non spécifié",
      },
      dates: {
        start: new Date().toISOString().split("T")[0],
        timezone: "Europe/Paris",
      },
      genres: [],
      artists: [],
      matchScore: 0,
      matchingGenres: [],
      reasons: [],
      ticketUrl: "",
      estimatedPopularity: 0,
    };
  }

  // Fonctions utilitaires pour formater les données
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateRange = () => {
    const startDate = formatDate(festivalData!.dates.start);
    if (festivalData!.dates.end) {
      const endDate = formatDate(festivalData!.dates.end);
      return `${startDate} - ${endDate}`;
    }
    return startDate;
  };

  const getShortName = () => {
    // Extraire un nom court du nom complet
    const name = festivalData!.name;
    const words = name.split(" ");
    if (words.length > 3) {
      return words.slice(0, 3).join(" ") + "...";
    }
    return name;
  };

  // Fonction pour générer des photos d'artistes réalistes
  const getArtistImage = (artistName: string, index: number) => {
    // Utilise des images Unsplash aléatoires avec des visages comme pour les amis
    const randomIds = [
      "photo-1507003211169-0a1dd7228f2d", // homme
      "photo-1494790108755-2616b612b786", // femme
      "photo-1438761681033-6461ffad8d80", // femme
      "photo-1472099645785-5658abf4ff4e", // homme
      "photo-1544725176-7c40e5a71c5e", // femme
      "photo-1500648767791-00dcc994a43e", // homme
      "photo-1534528741775-53994a69daeb", // femme
      "photo-1506794778202-cad84cf45f1d", // homme
      "photo-1517841905240-472988babdf9", // femme
      "photo-1519085360753-af0119f7cbe7", // homme
    ];

    // Utilise l'index pour sélectionner une image différente pour chaque artiste
    const photoId = randomIds[index % randomIds.length];
    return `https://images.unsplash.com/${photoId}?w=47&h=47&fit=crop&crop=face&auto=format`;
  };

  // Fonction pour générer l'URL de la carte intégrée avec Mapbox
  const getEmbeddedMapUrl = () => {
    const location = festivalData!.location;

    // Améliorer la requête de géolocalisation avec plus de contexte
    const venue = location.venue || "";
    const city = location.city || "";
    const country = location.country || "";

    // Construire une requête plus précise pour Mapbox
    const query = encodeURIComponent(`${venue} ${city} ${country}`);

    // Utilisation de Mapbox avec un style moderne
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js'></script>
      <link href='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css' rel='stylesheet' />
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        #map { 
          height: 100vh; 
          width: 100%; 
          border-radius: 16px;
        }
        .mapboxgl-popup {
          max-width: 300px;
        }
        .mapboxgl-popup-content {
          text-align: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .popup-title {
          font-weight: 600;
          font-size: 16px;
          color: #19002c;
          margin-bottom: 8px;
        }
        .popup-address {
          color: #666;
          font-size: 14px;
          line-height: 1.4;
        }
        .festival-marker {
          background-color: #6366f1;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 4px solid #ffffff;
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .festival-marker:hover {
          transform: scale(1.1);
        }
        .festival-marker::after {
          content: '🎵';
          font-size: 18px;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        mapboxgl.accessToken = '${
          process.env.EXPO_PUBLIC_MAPBOX_API_KEY || "pk.YOUR_MAPBOX_TOKEN"
        }';
        
        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [2.3522, 48.8566], // Paris par défaut
          zoom: 12,
          pitch: 0, // Vue normale sans perspective 3D
          bearing: 0,
          antialias: true
        });

        // Ajouter des contrôles de navigation stylés
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Stratégie de géolocalisation améliorée
        const venue = "${venue}";
        const city = "${city}";
        const country = "${country}";
        
        console.log('Recherche pour:', venue, city, country);
        
        // Essayer plusieurs stratégies de recherche
        async function findLocation() {
          // Stratégie 1: Recherche complète avec venue (PRIORITAIRE)
          if (venue && venue.trim() !== "") {
            let searchQuery = venue + " " + city + " " + country;
            console.log('Stratégie 1 - Recherche complète:', searchQuery);
            let response = await fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(searchQuery) + '.json?access_token=' + mapboxgl.accessToken + '&country=' + encodeURIComponent(country.toLowerCase()) + '&limit=3');
            let data = await response.json();
            
            if (data.features && data.features.length > 0) {
              console.log('✅ Stratégie 1 réussie:', data.features[0].place_name);
              return data.features[0];
            }
            
            // Stratégie 1b: Venue + ville seulement  
            searchQuery = venue + " " + city;
            console.log('Stratégie 1b - Venue + ville:', searchQuery);
            response = await fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(searchQuery) + '.json?access_token=' + mapboxgl.accessToken + '&types=poi,address&limit=3');
            data = await response.json();
            
            if (data.features && data.features.length > 0) {
              console.log('✅ Stratégie 1b réussie:', data.features[0].place_name);
              return data.features[0];
            }
          }
          
          // Stratégie 2: Recherche ville + pays (fallback seulement)
          let searchQuery = city + " " + country;
          console.log('Stratégie 2 - Fallback ville:', searchQuery);
          let response = await fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(searchQuery) + '.json?access_token=' + mapboxgl.accessToken + '&types=place&country=' + encodeURIComponent(country.toLowerCase()) + '&limit=1');
          let data = await response.json();
          
          if (data.features && data.features.length > 0) {
            console.log('⚠️ Stratégie 2 fallback utilisée:', data.features[0].place_name);
            return data.features[0];
          }
          
          console.error('❌ Aucune stratégie n\\'a fonctionné');
          return null;
        }

        // Recherche de géolocalisation
        findLocation()
          .then(feature => {
            if (feature) {
              const coords = feature.center;
              const lat = coords[1];
              const lon = coords[0];
              
              console.log('🎯 Localisation finale:', feature.place_name, 'Coords:', lat, lon);
              
              // Centrer la carte sur la localisation avec zoom approprié
              map.flyTo({
                center: [lon, lat],
                zoom: 16, // Zoom plus proche pour mieux voir le point
                duration: 1500,
                essential: true
              });
              
              // Créer un marqueur bien visible
              const markerEl = document.createElement('div');
              markerEl.className = 'festival-marker';
              
              // Ajouter le marqueur avec popup qui s'ouvre automatiquement
              const marker = new mapboxgl.Marker(markerEl)
                .setLngLat([lon, lat])
                .setPopup(
                  new mapboxgl.Popup({ 
                    offset: 30,
                    closeButton: false,
                    className: 'festival-popup'
                  })
                  .setHTML(\`
                    <div class="popup-title">${venue || city}</div>
                    <div class="popup-address">${city}, ${country}</div>
                  \`)
                )
                .addTo(map);
                
              // Ouvrir automatiquement le popup pour montrer clairement l'emplacement
              setTimeout(() => {
                marker.togglePopup();
              }, 500);
                
            } else {
              console.warn('⚠️ Aucune localisation trouvée, affichage par défaut');
              // Ajouter un marqueur générique sur Paris
              const defaultMarker = document.createElement('div');
              defaultMarker.className = 'festival-marker';
              new mapboxgl.Marker(defaultMarker)
                .setLngLat([2.3522, 48.8566])
                .setPopup(
                  new mapboxgl.Popup({ offset: 30, closeButton: false })
                  .setHTML('<div class="popup-title">Localisation approximative</div>')
                )
                .addTo(map);
            }
          })
          .catch(error => {
            console.error('❌ Erreur géolocalisation:', error);
          });
      </script>
    </body>
    </html>
    `;
  };

  // Mock data pour les amis avec de vraies photos
  const mockFriends = [
    {
      id: "1",
      name: "Sophie Martin",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=35&h=35&fit=crop&crop=face&auto=format",
    },
    {
      id: "2",
      name: "Lucas Dubois",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=35&h=35&fit=crop&crop=face&auto=format",
    },
    {
      id: "3",
      name: "Emma Bernard",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=35&h=35&fit=crop&crop=face&auto=format",
    },
  ];

  // Mock data pour les avis (sera remplacé par les vrais avis)
  const mockReviews = [
    {
      author: "Caroline M",
      text: "Un super festival qu'on a fait entre amis un samedi après midi. Je recommande !",
      rating: 5,
    },
    {
      author: "Thomas B",
      text: "Franchement pas mal, l'ambiance était au top. Mais je recommande ce festival.",
      rating: 4,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={FestiFunColors.primaryDark}
        translucent={false}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec image */}
        <View style={styles.headerImageContainer}>
          <ImageBackground
            style={styles.headerImage}
            resizeMode="cover"
            source={{ uri: festivalData.image }}
          >
            {/* Status bar et navigation */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <ArrowLeft size={20} color={FestiFunColors.background} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingsButton}>
                <Share2 size={20} color={FestiFunColors.background} />
              </TouchableOpacity>
            </View>

            {/* Overlay gradient pour améliorer la lisibilité */}
            <LinearGradient
              colors={[
                "rgba(25, 0, 44, 0.1)",
                "rgba(25, 0, 44, 0.6)",
                "#19002c",
              ]}
              locations={[0, 0.7, 1]}
              style={styles.headerOverlay}
            />
          </ImageBackground>
        </View>

        {/* Contenu principal */}
        <View style={styles.mainContent}>
          {/* Titre et infos de base */}
          <View style={styles.titleSection}>
            <Text style={styles.festivalTitle}>{festivalData.name}</Text>

            <View style={styles.festivalMeta}>
              <View style={styles.metaItem}>
                <Calendar size={13} color={FestiFunColors.background} />
                <Text style={styles.metaText}>{formatDateRange()}</Text>
              </View>
              <View style={styles.metaItem}>
                <MapPin size={10} color={FestiFunColors.background} />
                <Text style={styles.metaText}>
                  {festivalData.location.venue &&
                  festivalData.location.venue.trim() !== ""
                    ? `${festivalData.location.venue}, ${festivalData.location.city}, ${festivalData.location.country}`
                    : `${festivalData.location.city}, ${festivalData.location.country}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Section amis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Retrouve tes Kopins</Text>
            <View style={styles.friendsContainer}>
              <View style={styles.friendsAvatars}>
                {mockFriends.map((friend, index) => (
                  <View
                    key={friend.id}
                    style={[styles.friendAvatar, { left: index * 15 }]}
                  >
                    <Image
                      style={{ width: 35, height: 35, borderRadius: 75 }}
                      source={{ uri: friend.image }}
                    />
                  </View>
                ))}
              </View>
              <View style={styles.friendsInfo}>
                <Text style={styles.friendsCount}>+ 3 personnes</Text>
                <Text style={styles.friendsTotal}> et 10 905 persones</Text>
              </View>
            </View>
          </View>

          {/* Section à propos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>À propos</Text>
            <Text style={styles.description}>{festivalData.description}</Text>
          </View>

          {/* Line up */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Line up</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.lineupScroll}
            >
              {festivalData.artists.map((artistName, index) => (
                <View key={index} style={styles.artistContainer}>
                  <Image
                    style={styles.artistImage}
                    source={{ uri: getArtistImage(artistName, index) }}
                  />
                  <Text style={styles.artistName}>{artistName}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Genres */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Genre</Text>
            <View style={styles.genresContainer}>
              {festivalData.genres.map((genre, index) => (
                <View key={index} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Météo et localisation */}
          <View style={styles.infoSection}>
            {/* Localisation */}
            <View style={styles.locationCard}>
              <Text style={styles.locationText}>
                {festivalData.location.venue &&
                festivalData.location.venue.trim() !== ""
                  ? `${festivalData.location.venue}, ${festivalData.location.city}, ${festivalData.location.country}`
                  : `${festivalData.location.city}, ${festivalData.location.country}`}
              </Text>

              {/* Carte Mapbox toujours affichée */}
              <View style={styles.mapWrapper}>
                <WebView
                  style={styles.webMap}
                  source={{ html: getEmbeddedMapUrl() }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                />
              </View>
            </View>

            {/* Note et avis */}
            <View style={styles.ratingCard}>
              <View style={styles.ratingMain}>
                <Text style={styles.ratingScore}>
                  {Math.round((festivalData.matchScore / 20) * 5) || 4}
                </Text>
                <View style={styles.ratingDetails}>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const rating =
                        Math.round((festivalData.matchScore / 20) * 5) || 4;
                      return (
                        <View key={star}>
                          <Star
                            size={14}
                            color={star <= rating ? "#FFD700" : "#666"}
                            fill={star <= rating ? "#FFD700" : "transparent"}
                          />
                        </View>
                      );
                    })}
                  </View>
                  <Text style={styles.reviewCount}>
                    ({mockReviews.length} Avis)
                  </Text>
                </View>
              </View>
            </View>

            {/* Avis */}
            <View style={styles.reviewsContainer}>
              {mockReviews.map((review, index) => (
                <View key={index} style={styles.reviewCard}>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <View key={star}>
                        <Star
                          size={12}
                          color={star <= review.rating ? "#FFD700" : "#666"}
                          fill={
                            star <= review.rating ? "#FFD700" : "transparent"
                          }
                        />
                      </View>
                    ))}
                  </View>
                  <Text style={styles.reviewText}>{review.text}</Text>
                  <Text style={styles.reviewAuthor}>{review.author}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bouton de réservation fixe */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <TouchableOpacity style={styles.shareButton}>
            <Heart size={19} color={FestiFunColors.background} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.reserveButton}>
            <Text style={styles.reserveButtonText}>Réserver mon séjour</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  headerImageContainer: {
    height: 306,
  },
  headerImage: {
    flex: 1,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    paddingVertical: 64,
    paddingHorizontal: 14,
    justifyContent: "space-between",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    zIndex: 10,
    position: "relative",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.title.fontFamily,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  mainContent: {
    paddingHorizontal: 24,
    marginTop: -42,
  },
  titleSection: {
    marginBottom: 32,
  },
  festivalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.title.fontFamily,
    lineHeight: 22,
    marginBottom: 16,
  },
  festivalMeta: {
    flexDirection: "column",
    gap: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 13,
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.body.fontFamily,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.title.fontFamily,
    lineHeight: 22,
    marginBottom: 16,
  },
  friendsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  friendsAvatars: {
    width: 79,
    height: 35,
    position: "relative",
  },
  friendAvatar: {
    width: 35,
    height: 35,
    borderRadius: 75,
    position: "absolute",
    top: 0,
  },
  friendsInfo: {
    paddingVertical: 2,
    gap: 2,
    justifyContent: "center",
  },
  friendsCount: {
    fontSize: 16,
    lineHeight: 18,
    textAlign: "center",
    color: FestiFunColors.background,
    fontWeight: "600",
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
  },
  friendsTotal: {
    fontSize: 12,
    lineHeight: 13,
    textAlign: "center",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.body.fontFamily,
  },
  description: {
    fontSize: 12,
    lineHeight: 13,
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.body.fontFamily,
  },
  lineupScroll: {
    paddingHorizontal: 12,
    gap: 12,
  },
  artistContainer: {
    alignItems: "center",
    gap: 6,
  },
  artistImage: {
    width: 47,
    height: 47,
    borderRadius: 100,
  },
  artistName: {
    fontSize: 12,
    lineHeight: 13,
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.body.fontFamily,
    textAlign: "center",
    width: 47,
  },
  genresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  genreTag: {
    borderWidth: 1,
    borderColor: FestiFunColors.background,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  genreText: {
    fontSize: 13,
    letterSpacing: -0.2,
    color: FestiFunColors.background,
    textAlign: "center",
    fontWeight: "700",
  },
  infoSection: {
    gap: 12,
  },
  locationCard: {
    borderWidth: 1,
    borderColor: "#362543",
    borderRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 31,
    alignItems: "center",
    gap: 15,
  },
  locationText: {
    fontSize: 16,
    lineHeight: 18,
    textAlign: "center",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.body.fontFamily,
  },
  mapWrapper: {
    width: 365,
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    backgroundColor: FestiFunColors.primary,
  },
  webMap: {
    flex: 1,
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: FestiFunColors.primary,
  },
  ratingCard: {
    borderWidth: 1,
    borderColor: "#362543",
    borderRadius: 20,
    paddingHorizontal: 31,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  ratingMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    justifyContent: "center",
    flex: 1,
  },
  ratingScore: {
    fontSize: 40,
    letterSpacing: -0.9,
    lineHeight: 40,
    color: FestiFunColors.background,
    fontWeight: "700",
  },
  ratingDetails: {
    gap: 2,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  reviewCount: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: -0.2,
    color: FestiFunColors.background,
    textAlign: "center",
  },
  reviewsContainer: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 20,
    flexDirection: "row",
    gap: 12,
  },
  reviewCard: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 14,
    paddingRight: 31,
    borderWidth: 1,
    borderColor: "#362543",
    borderRadius: 20,
    gap: 16,
  },
  reviewStars: {
    flexDirection: "row",
    gap: 2,
  },
  reviewText: {
    fontSize: 16,
    lineHeight: 18,
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.body.fontFamily,
  },
  reviewAuthor: {
    fontSize: 12,
    letterSpacing: -0.1,
    color: FestiFunColors.background,
    fontWeight: "700",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: "rgba(217, 217, 217, 0.01)",
  },
  bottomBarContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  shareButton: {
    width: 49,
    height: 49,
    borderRadius: 1000,
    backgroundColor: "rgba(87, 67, 102, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  reserveButton: {
    flex: 1,
    backgroundColor: FestiFunColors.primary,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  reserveButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.title.fontFamily,
    lineHeight: 14,
  },
});
