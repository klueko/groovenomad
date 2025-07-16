import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { db } from "./database.js";
import * as schema from "./schema.js";

console.log("🔧 Configuration Better Auth Spotify:");
console.log(
  "  - Client ID:",
  process.env.SPOTIFY_CLIENT_ID?.substring(0, 10) + "..."
);
console.log(
  "  - Redirect URI:",
  "http://10.134.199.192:8081/auth/callback/spotify"
);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    spotify: {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectURI: "http://10.134.199.192:8081/auth/callback/spotify",
    },
  },
  plugins: [
    expo({
      overrideOrigin: true,
    }),
  ],
  trustedOrigins: [
    "groovenomad://",
    "groovenomad://*",
    "exp://10.134.199.192:8081",
    "exp://localhost:8081",
    "http://10.134.199.192:8081",
    "http://localhost:8081",
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
}); 