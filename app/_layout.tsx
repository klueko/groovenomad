import { Stack } from "expo-router";

export default function RootLayout() {
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
        name="music-profile"
        options={{ headerShown: false, title: "Profil Musical" }}
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
    </Stack>
  );
}
