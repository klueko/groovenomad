import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

// URL de base pour les API routes Expo
const baseURL = "http://10.134.199.192:8081/api/auth"; // Using your device's IP

console.log("🔧 Configuration Better Auth Client:");
console.log("  - baseURL:", baseURL);
console.log(
  "  - EXPO_PUBLIC_BETTER_AUTH_URL:",
  process.env.EXPO_PUBLIC_BETTER_AUTH_URL
);
console.log("  - All env vars:", Object.keys(process.env).filter(key => key.includes('BETTER_AUTH')));

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
