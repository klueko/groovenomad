import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Connexion" }} />
      <Stack.Screen name="register" options={{ title: "Inscription" }} />
      <Stack.Screen name="home" options={{ title: "Accueil" }} />
      <Stack.Screen name="flights" options={{ title: "Recherche de vols", headerShown: false }} />
      <Stack.Screen name="hotels" options={{ title: "Recherche d'hôtels", headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="spotify-login" options={{ headerShown: false }} />
      <Stack.Screen name="debug" options={{ headerShown: false }} />
    </Stack>
  );
}
