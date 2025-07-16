import { useState, useEffect } from "react";
import * as React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { signIn, useSession, signOut } from "../lib/auth-client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [spotifyLoading, setSpotifyLoading] = useState(false);

  // Hook pour vérifier l'état de connexion
  const { data: session, isPending: sessionLoading } = useSession();

  useEffect(() => {
    console.log("🔍 Vérification session utilisateur...");
    console.log("📊 Session loading:", sessionLoading);
    console.log("👤 Session data:", session);

    if (session?.user) {
      console.log("✅ Utilisateur connecté !");
      console.log("📝 Nom:", session.user.name);
      console.log("📧 Email:", session.user.email);
      console.log("🎵 Image:", session.user.image);
      console.log("🆔 ID utilisateur:", session.user.id);
      console.log("📅 Créé le:", session.user.createdAt);
      console.log("📋 Session complète:", JSON.stringify(session, null, 2));
    } else {
      console.log("❌ Pas de session active");
    }
  }, [session, sessionLoading]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    console.log("🔐 Tentative de connexion avec:", { email, password: "***" });

    try {
      const result = await signIn.email({
        email,
        password,
      });

      console.log("✅ Réponse de connexion:", result);

      if (result.error) {
        console.error("❌ Erreur de connexion:", result.error);
        Alert.alert("Erreur", result.error.message || "Erreur de connexion");
      } else {
        console.log("🎉 Connexion réussie, redirection vers /home");
        router.replace("/home");
      }
    } catch (error) {
      console.error("💥 Erreur lors de la connexion:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleSpotifyLogin = async () => {
    console.log("🎵 Démarrage connexion Spotify avec Better Auth...");
    setSpotifyLoading(true);

    try {
      console.log(
        "🔧 Configuration Better Auth URL:",
        process.env.EXPO_PUBLIC_BETTER_AUTH_URL
      );

      console.log("📱 Tentative de connexion sociale Spotify...");
      const result = await signIn.social({
        provider: "spotify",
        callbackURL: "/home", // Redirection après auth réussie
      });

      console.log("✅ Réponse connexion Spotify:", result);
      console.log("✅ Type de réponse:", typeof result);
      console.log("✅ Clés disponibles:", Object.keys(result || {}));

      if (result.error) {
        console.error("❌ Erreur connexion Spotify:", result.error);
        Alert.alert(
          "Erreur",
          result.error.message || "Erreur de connexion Spotify"
        );
      } else {
        console.log(
          "🎉 Connexion Spotify démarrée - Better Auth gère la redirection"
        );
        // Better Auth + callbackURL gère automatiquement la redirection
      }
    } catch (error) {
      console.error("💥 Erreur lors de la connexion Spotify:", error);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors de la connexion Spotify"
      );
    } finally {
      setSpotifyLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log("🚪 Déconnexion...");
    try {
      await signOut();
      console.log("✅ Déconnexion réussie");
    } catch (error) {
      console.error("❌ Erreur lors de la déconnexion:", error);
    }
  };

  // Si l'utilisateur est connecté, afficher ses infos
  if (session?.user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Connecté !</Text>

        <View style={styles.userCard}>
          <Text style={styles.userTitle}>👤 Profil utilisateur</Text>
          <Text style={styles.userInfo}>
            Nom: {session.user.name || "Non renseigné"}
          </Text>
          <Text style={styles.userInfo}>Email: {session.user.email}</Text>
          <Text style={styles.userInfo}>ID: {session.user.id}</Text>
          {session.user.image && (
            <Text style={styles.userInfo}>Image de profil: Disponible</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/home")}
        >
          <Text style={styles.buttonText}>🏠 Aller à l'accueil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Sinon, afficher le formulaire de connexion
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Connexion..." : "Se connecter"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.push("/register")}
      >
        <Text style={styles.linkText}>Pas de compte ? S'inscrire</Text>
      </TouchableOpacity>

      <View style={styles.separator}>
        <Text style={styles.separatorText}>ou</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.spotifyButton,
          (loading || spotifyLoading) && styles.buttonDisabled,
        ]}
        onPress={handleSpotifyLogin}
        disabled={loading || spotifyLoading}
      >
        <Text style={styles.spotifyButtonText}>
          {spotifyLoading ? "🎵 Connexion..." : "🎵 Se connecter avec Spotify"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    marginBottom: 15,
    borderRadius: 24,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkButton: {
    alignItems: "center",
  },
  linkText: {
    color: "#007AFF",
    fontSize: 16,
  },
  separator: {
    alignItems: "center",
    marginVertical: 20,
  },
  separatorText: {
    color: "#666",
    fontSize: 16,
  },
  spotifyButton: {
    backgroundColor: "#1DB954",
    padding: 15,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 15,
  },
  spotifyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  userCard: {
    backgroundColor: "#f0f0f0",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  userTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  userInfo: {
    fontSize: 14,
    marginBottom: 5,
    color: "#333",
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    padding: 15,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 10,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
