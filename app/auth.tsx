import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [message, setMessage] = useState(
    "Finalisation de l'authentification..."
  );

  useEffect(() => {
    console.log("🔄 Callback OAuth reçu avec params:", params);

    const handleCallback = async () => {
      try {
        // Vérifier si on a bien reçu un code
        if (params.code) {
          console.log("✅ Code d'autorisation reçu dans le callback");
          setMessage("Code d'autorisation reçu !");

          // Attendre un peu pour que le hook traite le code
          await new Promise((resolve) => setTimeout(resolve, 3000));

          // Vérifier si on a maintenant un token
          const token = await SecureStore.getItemAsync("spotify_access_token");
          const userInfo = await SecureStore.getItemAsync("spotify_user_info");

          if (token) {
            console.log("✅ Token Spotify confirmé dans le callback");
            setMessage("Authentification réussie !");

            if (userInfo) {
              const userData = JSON.parse(userInfo);
              console.log(
                "✅ Infos utilisateur confirmées:",
                userData.display_name
              );
              setMessage(`Bienvenue ${userData.display_name} !`);
            }
          } else {
            console.log("⚠️ Token pas encore disponible dans le callback");
            setMessage("Traitement en cours...");
          }
        } else {
          console.log("❌ Pas de code reçu dans le callback");
          setMessage("Erreur: Pas de code d'autorisation");
        }
      } catch (error) {
        console.error("❌ Erreur dans le callback:", error);
        setMessage("Erreur lors du traitement");
      }

      // Rediriger vers la page de connexion après traitement
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    };

    handleCallback();
  }, [params, router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
      }}
    >
      <ActivityIndicator size="large" color="#1DB954" />
      <Text
        style={{
          marginTop: 20,
          fontSize: 16,
          color: "#fff",
          textAlign: "center",
        }}
      >
        {message}
      </Text>
    </View>
  );
}
