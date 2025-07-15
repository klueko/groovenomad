import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

// Utiliser la variable d'environnement au lieu d'une IP hardcodée
const baseURL =
  Constants.expoConfig?.extra?.betterAuthUrl || "http://localhost:8081";

console.log("🔧 Configuration Better Auth Client:");
console.log("  - baseURL:", baseURL);
console.log(
  "  - EXPO_PUBLIC_BETTER_AUTH_URL:",
  process.env.EXPO_PUBLIC_BETTER_AUTH_URL
);

export const authClient = createAuthClient({
  baseURL: baseURL,
  plugins: [
    expoClient({
      scheme: "groovenomad", // Utiliser le scheme personnalisé défini dans app.json
      storagePrefix: "groovenomad",
      storage: SecureStore,
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
