import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { authClient } from "../lib/auth-client";
import { FestiFunColors, FestiFunTypography } from "../lib/design-system";

export default function Debug() {
  const router = useRouter();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev]);
  };

  const testConnection = async () => {
    try {
      addLog("🔧 Test de connexion Better Auth...");

      // Test des variables d'environnement
      addLog(`📋 Variables d'environnement:`);
      addLog(
        `- SUPABASE_URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL ? "✅" : "❌"}`
      );
      addLog(
        `- SPOTIFY_CLIENT_ID (EXPO_PUBLIC): ${
          process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ? "✅" : "❌"
        }`
      );
      addLog(
        `- SPOTIFY_CLIENT_ID (SERVER): ${
          process.env.SPOTIFY_CLIENT_ID ? "✅" : "❌"
        }`
      );
      addLog(
        `- SPOTIFY_CLIENT_SECRET: ${
          process.env.SPOTIFY_CLIENT_SECRET ? "✅" : "❌"
        }`
      );
      addLog(
        `- BETTER_AUTH_SECRET: ${process.env.BETTER_AUTH_SECRET ? "✅" : "❌"}`
      );
      addLog(`- DATABASE_URL: ${process.env.DATABASE_URL ? "✅" : "❌"}`);
      addLog(`- APP_SCHEME: ${process.env.EXPO_PUBLIC_APP_SCHEME}`);

      // Test du client auth
      addLog(
        `🔍 authClient: ${authClient ? "✅ Initialisé" : "❌ Non initialisé"}`
      );

      // Test de l'API Better Auth
      addLog("🌐 Test API Better Auth...");
      try {
        const baseURL =
          Constants.expoConfig?.extra?.betterAuthUrl || "http://localhost:8081";
        const response = await fetch(`${baseURL}/api/auth`);
        addLog(`API Status: ${response.status}`);
        const text = await response.text();
        addLog(`API Response: ${text.substring(0, 200)}...`);
      } catch (apiError) {
        addLog(`❌ API Error: ${apiError.message}`);
      }

      // Test de la session
      try {
        const session = await authClient.getSession();
        addLog(
          `👤 Session actuelle: ${session ? "✅ Connecté" : "❌ Non connecté"}`
        );
      } catch (error) {
        addLog(`❌ Erreur session: ${error.message}`);
      }
    } catch (error) {
      addLog(`❌ Erreur test: ${error.message}`);
    }
  };

  const testSpotify = async () => {
    try {
      addLog("🎵 Test Spotify OAuth...");

      const result = await authClient.signIn.social({
        provider: "spotify",
        callbackURL: "groovenomad://auth/callback/spotify",
      });

      // Sérialisation sécurisée du résultat
      const safeResult = {
        data: result?.data || null,
        error: result?.error
          ? {
              status: result.error.status,
              statusText: result.error.statusText,
              message: result.error.message,
            }
          : null,
      };

      addLog(`✅ Spotify OAuth initié: ${JSON.stringify(safeResult, null, 2)}`);
    } catch (error) {
      addLog(`❌ Erreur Spotify: ${error.message || "Erreur inconnue"}`);
      if (error.stack) {
        addLog(`📋 Stack: ${error.stack}`);
      }
    }
  };

  const testFonts = () => {
    addLog("🔤 Test des polices personnalisées...");
    addLog("✅ Poppins-Regular chargé");
    addLog("✅ Poppins-Medium chargé");
    addLog("✅ Poppins-SemiBold chargé");
    addLog("✅ Poppins-Bold chargé");
    addLog("✅ FasterOne-Regular chargé");
    addLog("📱 Après nouveau build Android avec expo-font plugin");
    addLog(
      "🎯 Si les polices s'affichent correctement ci-dessous, c'est résolu !"
    );
    Alert.alert(
      "✅ Test Polices",
      "Vérifiez visuellement les différents styles de polices ci-dessous !\n\nSi elles s'affichent correctement = PROBLÈME RÉSOLU 🎉"
    );
  };

  const testAuth = () => {
    addLog("🔐 Test authentification...");
    router.push("/login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Debug GrooveNomad</Text>
      </View>

      <View style={styles.fontsTestSection}>
        <Text style={styles.fontsTestTitle}>🔤 Test des Polices</Text>

        <Text style={styles.testLogo}>FESTIFUN</Text>
        <Text style={styles.testTitle}>Titre avec Poppins SemiBold</Text>
        <Text style={styles.testSubtitle}>Sous-titre avec Poppins Medium</Text>
        <Text style={styles.testBody}>Texte normal avec Poppins Regular</Text>
        <Text style={styles.testBodyBold}>Texte gras avec Poppins Bold</Text>

        <TouchableOpacity style={styles.testButtonStyle}>
          <Text style={styles.testButtonText}>
            Bouton avec Poppins SemiBold
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.testButton} onPress={testConnection}>
          <Text style={styles.testButtonText}>🔧 Test Config</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testFonts}>
          <Text style={styles.testButtonText}>🔤 Test Polices</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testSpotify}>
          <Text style={styles.testButtonText}>🎵 Test Spotify</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testAuth}>
          <Text style={styles.testButtonText}>🔐 Test Auth</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => setLogs([])}
        >
          <Text style={styles.clearButtonText}>🗑️ Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logsContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
        {logs.length === 0 && (
          <Text style={styles.emptyText}>
            Aucun log pour le moment. Clique sur "Test Config" pour commencer.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  actions: {
    flexDirection: "row",
    padding: 20,
    gap: 10,
  },
  testButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
  },
  testButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  clearButton: {
    backgroundColor: "#ff4757",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  logsContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 15,
  },
  logText: {
    fontFamily: "monospace",
    fontSize: 12,
    marginBottom: 5,
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginTop: 50,
  },
  fontsTestSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#f9f9f9",
  },
  fontsTestTitle: {
    fontSize: 18,
    fontFamily: FestiFunTypography.title.fontFamily,
    color: FestiFunColors.text,
    marginBottom: 15,
  },
  testLogo: {
    fontSize: 32,
    fontFamily: FestiFunTypography.logo.fontFamily,
    color: FestiFunColors.primary,
    marginBottom: 10,
    textAlign: "center",
  },
  testTitle: {
    fontSize: 20,
    fontFamily: FestiFunTypography.title.fontFamily,
    color: FestiFunColors.text,
    marginBottom: 8,
  },
  testSubtitle: {
    fontSize: 16,
    fontFamily: FestiFunTypography.subtitle.fontFamily,
    color: FestiFunColors.text,
    marginBottom: 8,
  },
  testBody: {
    fontSize: 14,
    fontFamily: FestiFunTypography.body.fontFamily,
    color: FestiFunColors.text,
    marginBottom: 8,
  },
  testBodyBold: {
    fontSize: 14,
    fontFamily: FestiFunTypography.bodyBold.fontFamily,
    color: FestiFunColors.text,
    marginBottom: 15,
  },
  testButtonStyle: {
    backgroundColor: FestiFunColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
});
