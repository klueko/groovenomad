import { useState, useEffect, useRef } from "react";
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
  Animated,
} from "react-native";
import { router } from "expo-router";
import { signIn, useSession, signOut } from "../lib/auth-client";
import { FestiFunColors, FestiFunTypography } from "../lib/design-system";
import { useAudioPlayer, AudioSource } from "expo-audio";
import Svg, { Path } from "react-native-svg";

const { width, height } = Dimensions.get("window");

// Composant logo Spotify basé sur le SVG des assets
const SpotifyLogo = ({
  size = 20,
  color = "#1ed760",
}: {
  size?: number;
  color?: string;
}) => (
  <Svg width={size} height={size} viewBox="0 0 496 512">
    <Path
      fill={color}
      d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8Z"
    />
    <Path
      fill="#000"
      d="M406.6 231.1c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3zm-31 76.2c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm-26.9 65.6c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4z"
    />
  </Svg>
);

export default function FestiFunLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [spotifyLoading, setSpotifyLoading] = useState(false);

  // Animations pour Pedro
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Audio player pour Pedro
  const player = useAudioPlayer(require("./assets/pedro.mp3") as AudioSource);

  // Hook pour vérifier l'état de connexion
  const { data: session, isPending: sessionLoading } = useSession();

  useEffect(() => {
    if (session?.user) {
      console.log("✅ Utilisateur connecté !", session.user);
    }
  }, [session, sessionLoading]);

  // Animation de rotation continue pour Pedro
  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 8000, // 8 secondes pour un tour complet
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();

    return () => rotateAnimation.stop();
  }, [rotationAnim]);

  // Animation de réaction musicale (légère pulsation)
  useEffect(() => {
    const musicReaction = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    musicReaction.start();

    return () => musicReaction.stop();
  }, [scaleAnim]);

  // Lecture de l'audio Pedro avec la nouvelle API
  useEffect(() => {
    // Configuration et démarrage automatique
    player.volume = 0.3; // Volume modéré
    player.loop = true; // Lecture en boucle
    player.play(); // Démarrage automatique
    console.log("🎵 Audio Pedro en lecture avec expo-audio");

    // Nettoyage lors du démontage
    return () => {
      player.pause();
    };
  }, [player]);

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
        callbackURL: "/onboarding", // Redirection vers l'onboarding après connexion Spotify
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

  // Redirection automatique si l'utilisateur est déjà connecté
  useEffect(() => {
    if (session?.user && !sessionLoading) {
      console.log("🔄 Utilisateur déjà connecté, redirection vers /home");
      router.replace("/home");
    }
  }, [session?.user, sessionLoading, router]);

  // Interpolation pour la rotation
  const rotateInterpolate = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Ne pas afficher le formulaire si l'utilisateur est connecté ou en cours de chargement
  if (session?.user || sessionLoading) {
    return (
      <View style={styles.loadingScreen}>
        <Image
          style={styles.loadingPedroImage}
          resizeMode="contain"
          source={require("./assets/pedropedropedro.png")}
        />
        <Text style={styles.loadingTitle}>FESTIFUN</Text>
        {sessionLoading && (
          <Text style={styles.loadingSubtitle}>
            Vérification de la session...
          </Text>
        )}
      </View>
    );
  }

  // Écran de connexion principal selon le design Figma
  return (
    <ScrollView
      style={styles.connexion}
      contentContainerStyle={styles.connexionContainerContent}
    >
      {/* Image Pedro depuis les assets - exactement comme le Figma avec animations */}
      <View style={styles.perdoText1Wrapper}>
        <Animated.Image
          style={[
            styles.perdoText1Icon,
            {
              transform: [{ rotate: rotateInterpolate }, { scale: scaleAnim }],
            },
          ]}
          resizeMode="cover"
          source={require("./assets/pedropedropedro.png")}
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
              <SpotifyLogo size={24} color={FestiFunColors.white} />
              <Text style={styles.spotifyText}>Continuer avec Spotify</Text>
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
    paddingVertical: 24, // Plus généreux pour éviter la coupure
    justifyContent: "center" as const,
    alignItems: "center" as const,
    flexDirection: "row" as const,
  },

  commencer: {
    lineHeight: 22, // Encore plus d'espace pour les descendantes
    fontFamily: FestiFunTypography.bodyBold.fontFamily, // Poppins Bold
    color: FestiFunColors.background, // #f5effd
    fontSize: 14,
    textAlign: "center", // Centré dans le bouton
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
    paddingHorizontal: 24,
    borderColor: FestiFunColors.white,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 250,
    gap: 8,
    minWidth: 200,
  },

  spotifyIcon: {
    fontSize: 20,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily, // Poppins SemiBold for the button text
    color: FestiFunColors.white,
  },

  spotifyText: {
    fontSize: 16,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily, // Poppins SemiBold for the button text
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

  // Styles pour l'écran de chargement
  loadingScreen: {
    flex: 1,
    backgroundColor: FestiFunColors.primaryDark,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },

  loadingPedroImage: {
    width: 150,
    height: 150,
  },

  loadingTitle: {
    fontSize: 32,
    fontFamily: FestiFunTypography.logo.fontFamily,
    color: FestiFunColors.background,
    textAlign: "center",
    letterSpacing: 2,
  },

  loadingSubtitle: {
    fontSize: 16,
    fontFamily: FestiFunTypography.body.fontFamily,
    color: "#ad9cbb",
    textAlign: "center",
  },
});
