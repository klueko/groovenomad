import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

// Empêcher l'écran de chargement de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
    "FasterOne-Regular": require("../assets/fonts/FasterOne-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }

    // ✅ LOGS DE DEBUG pour les polices
    if (fontsLoaded) {
      console.log("✅ POLICES CHARGÉES AVEC SUCCÈS !");
      console.log("📝 Polices disponibles :");
      console.log("- Poppins-Regular");
      console.log("- Poppins-Medium");
      console.log("- Poppins-SemiBold");
      console.log("- Poppins-Bold");
      console.log("- Poppins-Black");
      console.log("- FasterOne-Regular");
    }

    if (fontError) {
      console.error("❌ ERREUR DE CHARGEMENT DES POLICES :");
      console.error(fontError);
    }
  }, [fontsLoaded, fontError]);

  if (fontError) {
    console.error("❌ Erreur polices:", fontError);
  }

  if (!fontsLoaded && !fontError) {
    return null;
  }
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="login"
        options={{ headerShown: false, title: "Connexion FestiFun" }}
      />
      <Stack.Screen
        name="register"
        options={{ headerShown: false, title: "Inscription FestiFun" }}
      />
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false, title: "Bienvenue sur FestiFun" }}
      />
      <Stack.Screen
        name="music-preferences"
        options={{ headerShown: false, title: "Préférences Musicales" }}
      />
      <Stack.Screen
        name="music-preferences-selection"
        options={{ headerShown: false, title: "Sélection des Préférences" }}
      />
      <Stack.Screen
        name="music-profile"
        options={{ headerShown: false, title: "Profil Musical" }}
      />
      <Stack.Screen
        name="settings"
        options={{ headerShown: false, title: "Réglages" }}
      />
      <Stack.Screen
        name="home"
        options={{ headerShown: false, title: "Accueil FestiFun" }}
      />
      <Stack.Screen
        name="festival-recommendations"
        options={{ headerShown: false, title: "Recommandations FestiFun" }}
      />
      <Stack.Screen
        name="spotify-login"
        options={{ headerShown: false, title: "Connexion Spotify" }}
      />
      <Stack.Screen
        name="spotify-test"
        options={{ headerShown: false, title: "Test Spotify" }}
      />
      <Stack.Screen
        name="debug"
        options={{ headerShown: false, title: "Debug" }}
      />
      <Stack.Screen
        name="festival-detail"
        options={{ headerShown: false, title: "Détail Festival" }}
      />
      <Stack.Screen
        name="trip-planning"
        options={{
          headerShown: false,
          title: "Planification de Voyage",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="event-booking"
        options={{
          headerShown: false,
          title: "Réservation de Festival",
          presentation: "modal",
        }}
      />

      <Stack.Screen
        name="travel-config"
        options={{
          headerShown: false,
          title: "Configuration Voyage",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="accommodation-config"
        options={{
          headerShown: false,
          title: "Configuration Logement",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="activity-config"
        options={{
          headerShown: false,
          title: "Configuration Activité",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="mes-billets"
        options={{
          headerShown: false,
          title: "Mes Billets",
        }}
      />
    </Stack>
  );
}
