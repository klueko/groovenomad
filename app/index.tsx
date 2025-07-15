import { useEffect } from "react";
import { router } from "expo-router";
import { View, Text, StyleSheet, Image } from "react-native";
import { useSession } from "../lib/auth-client";
import { FestiFunColors, FestiFunFonts } from "../lib/design-system";

export default function FestiFunSplashScreen() {
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending) {
      // Délai simple pour voir l'écran
      const timer = setTimeout(() => {
        if (session) {
          router.replace("/home");
        } else {
          router.replace("/login");
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [session, isPending]);

  return (
    <View style={styles.chargement}>
      {/* Image Pedro simple */}
      <Image
        style={styles.pedroImage}
        resizeMode="contain"
        source={require("./assets/pedropedropedro.png")}
      />

      {/* Titre FESTIFUN en Faster One */}
      <Text style={styles.festifun}>FESTIFUN</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chargement: {
    width: "100%",
    backgroundColor: FestiFunColors.primaryDark, // Fond sombre comme demandé
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 40,
  },

  // Image Pedro simple
  pedroImage: {
    width: 200,
    height: 200,
  },

  // Titre FESTIFUN avec style logo
  festifun: {
    fontSize: 48,
    fontFamily: FestiFunFonts.logo, // Police Faster One pour le logo
    color: FestiFunColors.background, // Couleur claire sur fond sombre
    textAlign: "center",
    letterSpacing: 3, // Espacement pour le style logo
    textTransform: "uppercase", // Majuscules pour l'effet
  },
});
