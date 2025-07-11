import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { authClient } from "../lib/auth-client";

export default function SpotifyLogin() {
  const [loading, setLoading] = useState(false);

  const handleSpotifyLogin = async () => {
    setLoading(true);
    console.log("🎵 Tentative de connexion Spotify...");

    try {
      const result = await authClient.signIn.social({
        provider: "spotify",
        callbackURL: "/home", // Redirection après connexion
      });

      console.log("✅ Réponse connexion Spotify:", result);

      if (result.error) {
        console.error("❌ Erreur connexion Spotify:", result.error);
        Alert.alert(
          "Erreur",
          result.error.message || "Erreur de connexion Spotify"
        );
      } else {
        console.log("🎉 Connexion Spotify réussie, redirection vers /home");
        router.replace("/home");
      }
    } catch (error) {
      console.error("💥 Erreur lors de la connexion Spotify:", error);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors de la connexion Spotify"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion Spotify</Text>

      <TouchableOpacity
        style={[styles.spotifyButton, loading && styles.buttonDisabled]}
        onPress={handleSpotifyLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Connexion..." : "🎵 Se connecter avec Spotify"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.linkText}>Retour à la connexion classique</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#191414", // Couleur Spotify
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#1DB954", // Vert Spotify
  },
  spotifyButton: {
    backgroundColor: "#1DB954", // Vert Spotify
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#666",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkButton: {
    alignItems: "center",
    marginTop: 20,
  },
  linkText: {
    color: "#1DB954",
    fontSize: 16,
  },
});
