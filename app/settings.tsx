import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Switch,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSession, signOut } from "../lib/auth-client";
import {
  ArrowLeft,
  LogOut,
  Bell,
  Volume2,
  User,
  Shield,
} from "lucide-react-native";
import { FestiFunColors, FestiFunTypography } from "../lib/design-system";

export default function SettingsScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      {
        text: "Annuler",
        style: "cancel",
      },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/login");
          } catch (error) {
            Alert.alert("Erreur", "Impossible de se déconnecter");
          }
        },
      },
    ]);
  };

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={FestiFunColors.background} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Réglages</Text>
        </View>

        {/* Section Préférences */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Préférences</Text>

            {/* Notifications */}
            <View style={styles.menuItem}>
              <Bell size={24} color={FestiFunColors.primary} />
              <Text style={styles.menuItemText}>Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: "#ad9cbb",
                  true: FestiFunColors.primary,
                }}
                thumbColor={FestiFunColors.background}
              />
            </View>

            {/* Son */}
            <View style={styles.menuItem}>
              <Volume2 size={24} color={FestiFunColors.primary} />
              <Text style={styles.menuItemText}>Son</Text>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{
                  false: "#ad9cbb",
                  true: FestiFunColors.primary,
                }}
                thumbColor={FestiFunColors.background}
              />
            </View>
          </View>
        </View>

        {/* Section Compte */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Compte</Text>

            {/* Modifier profil */}
            <TouchableOpacity style={styles.menuItem}>
              <User size={24} color={FestiFunColors.primary} />
              <Text style={styles.menuItemText}>Modifier profil</Text>
              <ArrowLeft
                size={20}
                color="#ad9cbb"
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>

            {/* Confidentialité */}
            <TouchableOpacity style={styles.menuItem}>
              <Shield size={24} color={FestiFunColors.primary} />
              <Text style={styles.menuItemText}>Confidentialité</Text>
              <ArrowLeft
                size={20}
                color="#ad9cbb"
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Déconnexion */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <LogOut size={24} color={FestiFunColors.background} />
              <Text style={styles.logoutButtonText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Espace pour la navbar */}
        <View style={styles.bottomSpace} />
      </ScrollView>
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
    paddingTop: 64,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: FestiFunTypography.title.fontFamily,
    color: FestiFunColors.background,
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
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FestiFunTypography.title.fontFamily,
    color: FestiFunColors.background,
    marginBottom: 24,
    textAlign: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: FestiFunColors.primaryDark,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 239, 253, 0.1)",
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
    color: FestiFunColors.background,
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 100,
    gap: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
    color: FestiFunColors.background,
  },
  bottomSpace: {
    height: 105,
  },
});
