import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "../lib/auth-client";
import { LinearGradient } from "expo-linear-gradient";
import {
  Settings,
  Users,
  Music,
  Headphones,
  Activity,
} from "lucide-react-native";
import {
  FestiFunColors,
  FestiFunTypography,
  FestiFunFonts,
} from "../lib/design-system";
import { userPreferencesService } from "../lib/user-preferences-service";
import BottomNavigation from "../components/BottomNavigation";
import Avatar from "../components/Avatar";
import FriendsList from "../components/FriendsList";
import { useTranslation } from "../lib/useTranslation";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [userArtists, setUserArtists] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasPreferences, setHasPreferences] = useState(false);

  // Données d'amis mockées (à remplacer par de vraies données)
  const [friends] = useState([
    { id: "1", name: "Sophie Martin", avatar: null, isOnline: true },
    { id: "2", name: "Lucas Dubois", avatar: null, isOnline: false },
    { id: "3", name: "Emma Bernard", avatar: null, isOnline: true },
    { id: "4", name: "Thomas Roux", avatar: null, isOnline: false },
    { id: "5", name: "Camille Moreau", avatar: null, isOnline: true },
    { id: "6", name: "Hugo Leroy", avatar: null, isOnline: false },
    { id: "7", name: "Léa Petit", avatar: null, isOnline: true },
  ]);

  useEffect(() => {
    if (session?.user) {
      loadUserData();
    }
  }, [session]);

  const loadUserData = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);

      // Vérifier si l'utilisateur a des préférences
      const hasConfiguredPrefs =
        await userPreferencesService.hasUserMusicPreferences(session.user.id);
      setHasPreferences(hasConfiguredPrefs);

      if (hasConfiguredPrefs) {
        // Récupérer les préférences utilisateur
        const preferences =
          await userPreferencesService.getUserMusicPreferences(session.user.id);

        if (preferences) {
          setUserArtists(preferences.selectedArtists || []);
          setUserProfile(preferences.spotifyProfileData);
        }
      }
    } catch (error) {
      console.error("❌ Erreur chargement données profil:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportArtists = () => {
    router.push("/music-preferences-selection");
  };

  const StreamingPlatform = ({
    icon,
    name,
  }: {
    icon: React.ReactNode;
    name: string;
  }) => <View style={styles.streamingIcon}>{icon}</View>;

  const FriendAvatar = ({
    image,
    isActive,
  }: {
    image: any;
    isActive?: boolean;
  }) => (
    <View style={[styles.friendAvatar, isActive && styles.friendAvatarActive]}>
      <Image source={image} style={styles.friendImage} />
      {isActive && <View style={styles.activeIndicatorFriend} />}
    </View>
  );

  const ArtistAvatar = ({ artist }: { artist: any }) => (
    <View style={styles.artistContainer}>
      <Image
        source={{
          uri: artist.images?.[0]?.url || "https://via.placeholder.com/47x47",
        }}
        style={styles.artistImage}
      />
      <Text style={styles.artistName} numberOfLines={1}>
        {artist.name}
      </Text>
    </View>
  );

  // Obtenir le nom d'affichage de l'utilisateur
  const getDisplayName = () => {
    if (userProfile?.display_name) {
      return userProfile.display_name;
    }
    if (session?.user?.email) {
      return session.user.email.split("@")[0];
    }
    return t("profile.defaultUser");
  };

  // Obtenir le username
  const getUsername = () => {
    if (userProfile?.id) {
      return `@${userProfile.id}`;
    }
    if (session?.user?.email) {
      return `@${session.user.email.split("@")[0]}`;
    }
    return t("profile.defaultUsername");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={FestiFunColors.primaryDark}
        />
        <ActivityIndicator size="large" color={FestiFunColors.primary} />
        <Text style={styles.loadingText}>{t("profile.loading")}</Text>
      </View>
    );
  }

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
        {/* Header avec dégradé */}
        <LinearGradient
          colors={["#8B5CF6", "#A855F7", "#C084FC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Bouton Settings */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push("/settings")}
          >
            <Settings size={24} color={FestiFunColors.background} />
          </TouchableOpacity>

          {/* Photo de profil */}
          <View style={styles.profileImageContainer}>
            <Avatar
              imageUri={userProfile?.images?.[0]?.url || session?.user?.image}
              name={getDisplayName()}
              size={112}
              style={styles.profileAvatar}
            />
          </View>

          {/* Infos profil */}
          <Text style={styles.profileName}>{getDisplayName()}</Text>
          <Text style={styles.profileUsername}>{getUsername()}</Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>
                {t("profile.stats.followers")}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>
                {t("profile.stats.following")}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>{t("profile.stats.trips")}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Section Artistes */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              {hasPreferences && userArtists.length > 0
                ? t("profile.artistsSection.title", {
                    count: userArtists.length,
                  })
                : t("profile.artistsSection.emptyTitle")}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {hasPreferences && userArtists.length > 0
                ? t("profile.artistsSection.subtitle")
                : t("profile.artistsSection.emptySubtitle")}
            </Text>

            {/* Affichage conditionnel : artistes ou plateformes */}
            {hasPreferences && userArtists.length > 0 ? (
              // Afficher les vrais artistes
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.artistsScrollContent}
              >
                {userArtists.slice(0, 10).map((artist, index) => (
                  <ArtistAvatar key={artist.id || index} artist={artist} />
                ))}
              </ScrollView>
            ) : (
              // Afficher les icônes des plateformes
              <View style={styles.streamingPlatforms}>
                <StreamingPlatform
                  icon={<Activity size={20} color="#E91E63" />}
                  name="SoundCloud"
                />
                <StreamingPlatform
                  icon={<Music size={20} color="#FF5722" />}
                  name="SoundCloud"
                />
                <StreamingPlatform
                  icon={<Headphones size={20} color="#4CAF50" />}
                  name="Spotify"
                />
                <StreamingPlatform
                  icon={<Music size={20} color="#F44336" />}
                  name="Apple Music"
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleImportArtists}
            >
              <Text style={styles.primaryButtonText}>
                {hasPreferences && userArtists.length > 0
                  ? t("profile.artistsSection.editButton")
                  : t("profile.artistsSection.importButton")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Amis */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              {t("profile.teamSection.title")}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {t("profile.teamSection.subtitle")}
            </Text>

            {/* Liste des amis avec nouveau composant */}
            <FriendsList
              friends={friends}
              onAddFriend={() => {
                console.log("Ajouter un ami");
                // TODO: Implémenter la logique d'ajout d'ami
              }}
              maxVisible={4}
            />

            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                {t("profile.addFriends")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Espace pour la navbar */}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab="profile"
        onTabPress={(tab) => {
          if (tab === "home") {
            router.push("/home");
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
    gap: 16,
  },

  loadingText: {
    fontSize: 16,
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.body.fontFamily,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 0,
  },

  header: {
    paddingTop: 64, // Moins de marge en haut
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: "relative",
  },

  settingsButton: {
    position: "absolute",
    top: 60,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: FestiFunColors.primaryDark,
    padding: 4,
    marginBottom: 16,
  },

  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 56,
  },

  profileName: {
    fontSize: 28,
    fontWeight: "700",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.title.fontFamily,
    marginBottom: 4,
  },

  profileUsername: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: FestiFunTypography.body.fontFamily,
    marginBottom: 24,
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },

  statItem: {
    alignItems: "center",
  },

  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.title.fontFamily,
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: FestiFunTypography.body.fontFamily,
  },

  section: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  sectionCard: {
    backgroundColor: FestiFunColors.secondaryDark,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(245, 239, 253, 0.1)",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.title.fontFamily,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 24,
  },

  sectionSubtitle: {
    fontSize: 14,
    color: "#ad9cbb",
    fontFamily: FestiFunTypography.body.fontFamily,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18,
  },

  streamingPlatforms: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 24,
  },

  streamingIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: FestiFunColors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 239, 253, 0.1)",
  },

  // Styles pour les artistes
  artistsScrollContent: {
    paddingHorizontal: 12,
    gap: 12,
    marginBottom: 24,
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

  profileAvatar: {
    borderWidth: 3,
  },

  artistName: {
    fontSize: 12,
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.body.fontFamily,
    textAlign: "center",
    width: 47,
  },

  friendsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: -8, // Chevauchement des avatars
    marginBottom: 24,
  },

  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: FestiFunColors.white,
    position: "relative",
  },

  friendAvatarActive: {
    borderColor: FestiFunColors.white,
  },

  friendImage: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
  },

  activeIndicatorFriend: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: FestiFunColors.white,
  },

  primaryButton: {
    backgroundColor: FestiFunColors.primary,
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 200,
    alignItems: "center",
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
  },

  bottomSpace: {
    height: 105,
  },
});
