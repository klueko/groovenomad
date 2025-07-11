import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { useSession, signOut } from "../lib/auth-client";

export default function Home() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      Alert.alert("Erreur", "Impossible de se déconnecter");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue sur GrooveNomad!</Text>

      {session?.user && (
        <View style={styles.userInfo}>
          <Text style={styles.userText}>Bonjour, {session.user.name}!</Text>
          <Text style={styles.emailText}>{session.user.email}</Text>
        </View>
      )}

      <Text style={styles.description}>
        Votre application de voyage pour découvrir les meilleurs festivals du
        monde entier.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#333",
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 30,
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    width: "100%",
  },
  userText: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 5,
  },
  emailText: {
    fontSize: 16,
    color: "#666",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    color: "#666",
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#FF3B30",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
