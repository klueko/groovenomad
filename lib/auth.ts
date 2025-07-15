import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { db } from "./database";
import * as schema from "./schema";

console.log("🔧 Configuration Better Auth Spotify:");
console.log(
  "  - Client ID:",
  process.env.SPOTIFY_CLIENT_ID?.substring(0, 10) + "..."
);
console.log(
  "  - Redirect URI:",
  "http://10.224.162.166:8081/api/auth/callback/spotify (auto-générée)"
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
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      scope: [
        "user-read-email",
        "user-read-private",
        "user-top-read",
        "user-read-recently-played",
        "user-library-read",
        "playlist-read-private",
        "playlist-read-collaborative",
      ],
      // Better Auth gère automatiquement la redirectURI vers /api/auth/callback/spotify
    },
  },
  plugins: [
    expo({
      overrideOrigin: true,
    }),
  ],
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:8081",
    "http://10.186.166.166:8081",
    "http://10.224.162.166:8081",
    "groovenomad://",
    "groovenomad://*",
    "exp://localhost:8081",
    "exp://10.186.166.166:8081",
    "exp://10.224.162.166:8081",
    "exp://localhost:8081/--/*",
    "exp://10.186.166.166:8081/--/*",
    "exp://10.224.162.166:8081/--/*",
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://10.186.166.166:8081",
});
