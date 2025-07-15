import { useState, useEffect } from "react";
import * as React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { signIn, useSession, signOut } from "../lib/auth-client";
import { FestiFunColors, FestiFunTypography } from "../lib/design-system";

const { width, height } = Dimensions.get("window");

export default function FestiFunLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [spotifyLoading, setSpotifyLoading] = useState(false);

  // Hook pour vérifier l'état de connexion
  const { data: session, isPending: sessionLoading } = useSession();

  useEffect(() => {
    if (session?.user) {
      console.log("✅ Utilisateur connecté !", session.user);
    }
  }, [session, sessionLoading]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    console.log("🔐 Tentative de connexion avec:", { email, password: "***" });

    try {
      const result = await signIn.email({
        email,
        password,
      });

      console.log("✅ Réponse de connexion:", result);

      if (result.error) {
        console.error("❌ Erreur de connexion:", result.error);
        Alert.alert("Erreur", result.error.message || "Erreur de connexion");
      } else {
        console.log("🎉 Connexion réussie, redirection vers /home");
        router.replace("/home");
      }
    } catch (error) {
      console.error("💥 Erreur lors de la connexion:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleSpotifyLogin = async () => {
    console.log("🎵 Démarrage connexion Spotify avec Better Auth...");
    setSpotifyLoading(true);

    try {
      console.log("📱 Tentative de connexion sociale Spotify...");
      const result = await signIn.social({
        provider: "spotify",
        callbackURL: "/home",
      });

      console.log("✅ Réponse connexion Spotify:", result);

      if (result.error) {
        console.error("❌ Erreur connexion Spotify:", result.error);
        Alert.alert(
          "Erreur",
          result.error.message || "Erreur de connexion Spotify"
        );
      } else {
        console.log("🎉 Connexion Spotify démarrée");
      }
    } catch (error) {
      console.error("💥 Erreur lors de la connexion Spotify:", error);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors de la connexion Spotify"
      );
    } finally {
      setSpotifyLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log("🚪 Déconnexion...");
    try {
      await signOut();
      console.log("✅ Déconnexion réussie");
    } catch (error) {
      console.error("❌ Erreur lors de la déconnexion:", error);
    }
  };

  // Si l'utilisateur est connecté, rediriger vers home
  if (session?.user) {
    router.replace("/home");
    return null;
  }

  // Écran de connexion principal selon le design Figma
  return (
    <ScrollView
      style={styles.connexion}
      contentContainerStyle={styles.connexionContainerContent}
    >
      {/* Image Pedro depuis les assets - exactement comme le Figma */}
      <View style={styles.perdoText1Wrapper}>
        <Image
          style={styles.perdoText1Icon}
          resizeMode="cover"
          source={require("./assets/pedropedropedro.png")} // Utilise l'image Pedro depuis assets
        />
      </View>

      {/* Contenu principal */}
      <View style={styles.frameParent}>
        {/* Titre et description */}
        <View style={styles.bienvenueSurFestifunParent}>
          <Text style={styles.bienvenueSurFestifun}>
            BIENVENUE{"\n"}SUR FESTIFUN
          </Text>
          <Text style={styles.lagenceDeVoyage}>
            L'agence de voyage qui t'aides a organiser tes sortis en festival au
            meilleure prix.
          </Text>
        </View>

        {/* Boutons d'action */}
        <View style={styles.buttonParent}>
          {/* Bouton principal d'inscription */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.commencer}>S'inscrire gratuitement</Text>
          </TouchableOpacity>

          <Text style={styles.ou}>OU</Text>

          {/* Bouton de connexion Spotify */}
          <View style={styles.continuerAvecParent}>
            <TouchableOpacity
              style={[
                styles.spotifyButton,
                spotifyLoading && styles.buttonDisabled,
              ]}
              onPress={handleSpotifyLogin}
              disabled={spotifyLoading}
            >
              <Text style={styles.spotifyIcon}>♫</Text>
              <Text style={styles.spotifyText}>
                {spotifyLoading ? "Connexion..." : "Continuer avec Spotify"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lien vers connexion classique */}
          <TouchableOpacity
            style={styles.loginLinkContainer}
            onPress={() => {
              // Pour l'instant on montre un formulaire simple ici même
              Alert.prompt(
                "Connexion",
                "Email",
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Continuer",
                    onPress: (email) => {
                      if (email) {
                        Alert.prompt(
                          "Connexion",
                          "Mot de passe",
                          [
                            { text: "Annuler", style: "cancel" },
                            {
                              text: "Se connecter",
                              onPress: (password) => {
                                if (password) {
                                  setEmail(email);
                                  setPassword(password);
                                  setTimeout(handleLogin, 100);
                                }
                              },
                            },
                          ],
                          "secure-text"
                        );
                      }
                    },
                  },
                ],
                "plain-text"
              );
            }}
          >
            <Text style={styles.loginLinkText}>
              Déjà un compte ?{" "}
              <Text style={styles.loginLinkBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  connexionContainerContent: {
    flexDirection: "column",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 31,
    alignItems: "center",
    justifyContent: "space-between",
    gap: 0,
  },

  // Container Pedro - exactement comme le Figma
  perdoText1Wrapper: {
    width: width - 48, // Responsive mais garde les proportions
    height: 341,
    paddingHorizontal: 47,
    paddingVertical: 0,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: FestiFunColors.primaryDark, // #19002c
    borderRadius: 20,
    marginBottom: 32,
  },

  perdoText1Icon: {
    width: 285,
    height: 285,
  },

  // Contenu principal
  frameParent: {
    gap: 32,
    alignSelf: "stretch",
  },

  // Titre et description
  bienvenueSurFestifunParent: {
    gap: 16,
    alignSelf: "stretch",
  },

  bienvenueSurFestifun: {
    fontSize: 34,
    lineHeight: 37,
    fontFamily: FestiFunTypography.title.fontFamily, // Poppins SemiBold pour les titres
    color: FestiFunColors.background, // #f5effd
    alignSelf: "stretch",
    textAlign: "left",
  },

  lagenceDeVoyage: {
    letterSpacing: -0.2,
    fontFamily: FestiFunTypography.body.fontFamily, // Poppins Regular pour le texte
    fontSize: 14,
    textAlign: "left",
    color: "#ad9cbb",
    alignSelf: "stretch",
  },

  // Boutons
  buttonParent: {
    gap: 12,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    alignSelf: "stretch",
  },

  button: {
    width: width - 48, // Responsive
    borderRadius: 24,
    backgroundColor: FestiFunColors.primary, // #7742fe
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 17,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    flexDirection: "row" as const,
  },

  commencer: {
    lineHeight: 14,
    fontFamily: FestiFunTypography.bodyBold.fontFamily, // Poppins Bold
    color: FestiFunColors.background, // #f5effd
    fontSize: 14,
    textAlign: "left",
  },

  ou: {
    fontSize: 12,
    lineHeight: 13,
    fontFamily: FestiFunTypography.body.fontFamily, // Poppins Regular
    textAlign: "center",
    color: "#ad9cbb",
    alignSelf: "stretch",
  },

  // Boutons de services
  continuerAvecParent: {
    flexDirection: "row" as const,
    gap: 12,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },

  continuerAvec: {
    height: 42,
    width: 42,
    borderWidth: 1,
    borderColor: "#ad9cbb",
    borderStyle: "solid",
    borderRadius: 50,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },

  // Bouton Spotify
  spotifyButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#1DB954", // Couleur officielle Spotify
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    minWidth: 200,
  },

  spotifyIcon: {
    fontSize: 18,
    color: FestiFunColors.white,
    marginRight: 4,
  },

  spotifyText: {
    fontSize: 16,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily, // Poppins SemiBold pour les boutons
    color: FestiFunColors.white,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  // Lien de connexion
  loginLinkContainer: {
    marginTop: 16,
    alignItems: "center",
  },

  loginLinkText: {
    fontSize: 14,
    color: "#ad9cbb",
    textAlign: "center",
  },

  loginLinkBold: {
    fontWeight: "700",
    color: FestiFunColors.primary,
  },

  // Fond principal
  connexion: {
    width: "100%",
    flex: 1,
    maxWidth: "100%",
    backgroundColor: FestiFunColors.primaryDark, // #19002c
  },
});
