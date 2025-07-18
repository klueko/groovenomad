import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { signUp, authClient } from "../lib/auth-client";
import { useTranslation } from "../lib/useTranslation";

export default function Register() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert(t("common.error"), t("auth.fillFields"));
      return;
    }

    setLoading(true);
    console.log("📝 Tentative d'inscription avec:", {
      name,
      email,
      password: "***",
    });

    try {
      const result = await signUp.email({
        name,
        email,
        password,
      });

      console.log("✅ Réponse d'inscription:", result);

      if (result.error) {
        console.error("❌ Erreur d'inscription:", result.error);
        Alert.alert(
          t("common.error"),
          result.error.message || t("auth.registerError")
        );
      } else {
        console.log("🎉 Inscription réussie, redirection vers /home");
        router.replace("/home");
      }
    } catch (error) {
      console.error("💥 Erreur lors de l'inscription:", error);
      Alert.alert(t("common.error"), t("auth.registerError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSpotifyRegister = async () => {
    setLoading(true);
    console.log("🎵 Tentative d'inscription Spotify...");

    try {
      const result = await authClient.signIn.social({
        provider: "spotify",
        callbackURL: "festifun://home",
      });

      if (result.error) {
        console.error("❌ Erreur inscription Spotify:", result.error);
        Alert.alert(
          t("common.error"),
          result.error.message || t("errors.spotify")
        );
      } else {
        console.log("🎉 Inscription Spotify réussie");
        router.replace("/home");
      }
    } catch (error) {
      console.error("💥 Erreur inscription Spotify:", error);
      Alert.alert(t("common.error"), t("errors.spotify"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("auth.createAccount")}</Text>

      <TextInput
        style={styles.input}
        placeholder={t("auth.name")}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder={t("auth.email")}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder={t("auth.password")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? t("auth.registering") : t("auth.register")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.linkText}>
          {t("auth.alreadyHaveAccount")} {t("auth.login")}
        </Text>
      </TouchableOpacity>

      <View style={styles.separator}>
        <Text style={styles.separatorText}>{t("auth.or")}</Text>
      </View>

      <TouchableOpacity
        style={[styles.spotifyButton, loading && styles.buttonDisabled]}
        onPress={handleSpotifyRegister}
        disabled={loading}
      >
        <Text style={styles.spotifyButtonText}>
          🎵 {t("auth.spotifyRegister")}
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
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
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
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 15,
  },
  spotifyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
