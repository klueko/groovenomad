const express = require("express");
const cors = require("cors");

// Load environment variables
require('dotenv').config();

// Chargement dynamique du module ES
let auth;
async function loadAuth() {
  const authModule = await import("./lib/auth.js");
  auth = authModule.auth;
}

const app = express();
const PORT = 8081;

// Configuration CORS pour permettre les requêtes depuis Expo
app.use(
  cors({
    origin: [
      "http://127.0.0.1:8081",
      "http://localhost:8081",
      "exp://127.0.0.1:8081",
      "exp://localhost:8081",
    ],
    credentials: true,
  })
);

// Middleware pour parser JSON
app.use(express.json());

// Route de test
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Better Auth server is running" });
});

// Fonction pour démarrer le serveur
async function startServer() {
  await loadAuth();

  // Routes Better Auth (after auth is loaded)
  app.use("/api/auth", auth.handler);

  // Additional route for Spotify callback (simpler path)
  app.use("/auth", auth.handler);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Better Auth server running on http://10.134.199.192:${PORT}`);
    console.log(`📋 API endpoints:`);
    console.log(`   - Health: http://10.134.199.192:${PORT}/health`);
    console.log(`   - Auth: http://10.134.199.192:${PORT}/api/auth`);
    console.log(`   - Auth (Spotify): http://10.134.199.192:${PORT}/auth/callback/spotify`);
    console.log(`   - Session: http://10.134.199.192:${PORT}/api/auth/session`);
  });
}

// Démarrage du serveur
startServer().catch(console.error);
