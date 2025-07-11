const express = require("express");
const cors = require("cors");

// Chargement dynamique du module ES
let auth;
async function loadAuth() {
  const authModule = await import("./lib/auth.js");
  auth = authModule.auth;
}

const app = express();
const PORT = 3000;

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

// Routes Better Auth
app.use("/api/auth", auth.handler);

// Route de test
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Better Auth server is running" });
});

// Fonction pour démarrer le serveur
async function startServer() {
  await loadAuth();

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`🚀 Better Auth server running on http://127.0.0.1:${PORT}`);
    console.log(`📋 API endpoints:`);
    console.log(`   - Health: http://127.0.0.1:${PORT}/health`);
    console.log(`   - Auth: http://127.0.0.1:${PORT}/api/auth`);
    console.log(`   - Session: http://127.0.0.1:${PORT}/api/auth/session`);
  });
}

// Démarrage du serveur
startServer().catch(console.error);
