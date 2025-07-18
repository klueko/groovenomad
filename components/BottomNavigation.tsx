import React from "react";
import { View, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { Home, Map, Search, Ticket } from "lucide-react-native";
import { FestiFunColors } from "../lib/design-system";

type NavigationTab = "home" | "map" | "search" | "tickets" | "profile";

interface BottomNavigationProps {
  activeTab?: NavigationTab;
  onTabPress?: (tab: NavigationTab) => void;
}

export default function BottomNavigation({
  activeTab = "home",
  onTabPress,
}: BottomNavigationProps) {
  const router = useRouter();

  const handleTabPress = (tab: NavigationTab) => {
    if (onTabPress) {
      onTabPress(tab);
    } else {
      // Navigation par défaut
      switch (tab) {
        case "home":
          router.push("/home");
          break;
        case "tickets":
          router.push("/mes-billets");
          break;
        case "profile":
          router.push("/music-profile");
          break;
        // Ajouter d'autres routes au fur et à mesure
      }
    }
  };

  const renderNavItem = (
    tab: NavigationTab,
    icon: React.ReactNode,
    activeIcon: React.ReactNode
  ) => (
    <TouchableOpacity
      key={tab}
      style={styles.navItem}
      onPress={() => handleTabPress(tab)}
    >
      <View style={styles.navIconContainer}>
        {activeTab === tab ? activeIcon : icon}
        {activeTab === tab && <View style={styles.activeIndicator} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      {/* Blur background plus intense */}
      <View style={styles.blurBackground} />

      {/* Navigation container */}
      <View style={styles.bottomNav}>
        {renderNavItem(
          "home",
          <Home size={24} color="#ad9cbb" />,
          <Home size={24} color={FestiFunColors.background} />
        )}
        {renderNavItem(
          "map",
          <Map size={24} color="#ad9cbb" />,
          <Map size={24} color={FestiFunColors.background} />
        )}

        {renderNavItem(
          "tickets",
          <Ticket size={24} color="#ad9cbb" />,
          <Ticket size={24} color={FestiFunColors.background} />
        )}

        {/* Profile Avatar */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress("profile")}
        >
          <View style={styles.navIconContainer}>
            <View
              style={[
                styles.profileContainer,
                activeTab === "profile" && styles.profileContainerActive,
              ]}
            >
              <Image
                source={require("../app/assets/pedropedropedro.png")}
                style={styles.profileImage}
                resizeMode="cover"
              />
            </View>
            {activeTab === "profile" && <View style={styles.activeIndicator} />}
          </View>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // Fond blur plus intense en dessous de la navbar
  blurBackground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 105,
    backgroundColor: "rgba(0, 0, 0, 0.3)", // Plus d'opacité pour plus de blur
  },

  bottomNav: {
    position: "absolute",
    bottom: 30,
    left: 17,
    right: 17,
    height: 60,
    backgroundColor: "rgba(54, 37, 67, 0.85)", // Plus d'opacité pour la navbar
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: "rgba(245, 239, 253, 0.4)", // Bordure plus visible
    borderStyle: "solid",
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 32, // Plus de hauteur pour inclure le point
  },

  navIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 32,
  },

  navIconActive: {
    // Supprimé - plus de fond coloré
  },

  // Point blanc sous l'icône active
  activeIndicator: {
    width: 4,
    height: 4,
    backgroundColor: FestiFunColors.background,
    borderRadius: 2,
    marginTop: 4, // Espace entre l'icône et le point
  },

  // Styles pour l'avatar de profil
  profileContainer: {
    width: 20,
    height: 20,
    borderRadius: 1000,
    borderColor: "#ad9cbb",
    borderWidth: 0.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  profileContainerActive: {
    borderColor: FestiFunColors.background, // Bordure blanche quand actif
    borderWidth: 1,
  },

  profileImage: {
    width: 20,
    height: 20,
    borderRadius: 1000,
  },

  profileActiveIndicator: {
    // Supprimé - on utilise maintenant le point standard
  },
});
