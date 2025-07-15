import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "../lib/auth-client";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: [string, string];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Connectez votre Spotify",
    description:
      "Nous analysons vos goûts musicaux pour vous proposer les festivals parfaits",
    icon: "🎵",
    color: ["#1DB954", "#1ed760"],
  },
  {
    id: 2,
    title: "Découvrez votre profil",
    description:
      "Visualisez vos artistes et genres préférés analysés intelligemment",
    icon: "🎤",
    color: ["#FF6B6B", "#FF8E53"],
  },
  {
    id: 3,
    title: "Trouvez vos festivals",
    description:
      "Nos algorithmes vous recommandent des événements basés sur vos goûts",
    icon: "🎪",
    color: ["#4ECDC4", "#44A08D"],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Dernière étape, rediriger selon l'état de connexion
      if (session?.user) {
        router.push("/music-profile");
      } else {
        router.push("/login");
      }
    }
  };

  const handleSkip = () => {
    if (session?.user) {
      router.push("/home");
    } else {
      router.push("/login");
    }
  };

  const renderStep = (step: OnboardingStep) => {
    return (
      <View style={styles.stepContainer}>
        <LinearGradient colors={step.color} style={styles.iconContainer}>
          <Text style={styles.stepIcon}>{step.icon}</Text>
        </LinearGradient>

        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepDescription}>{step.description}</Text>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {onboardingSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentStep && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header avec skip */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      {/* Contenu principal */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo/Titre de l'app */}
        <View style={styles.logoSection}>
          <LinearGradient
            colors={["#1DB954", "#1ed760"]}
            style={styles.logoContainer}
          >
            <Text style={styles.logoText}>🎪</Text>
          </LinearGradient>
          <Text style={styles.appTitle}>GrooveNomad</Text>
          <Text style={styles.appSubtitle}>
            Votre compagnon pour découvrir les festivals parfaits
          </Text>
        </View>

        {/* Étape actuelle */}
        {renderStep(onboardingSteps[currentStep])}

        {/* Pagination */}
        {renderPagination()}
      </ScrollView>

      {/* Boutons de navigation */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <LinearGradient
            colors={onboardingSteps[currentStep].color}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === onboardingSteps.length - 1
                ? session?.user
                  ? "Voir mon profil"
                  : "Se connecter"
                : "Suivant"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Text style={styles.backButtonText}>Précédent</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  skipText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 60,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logoText: {
    fontSize: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  appSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  stepContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  stepIcon: {
    fontSize: 60,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
    marginHorizontal: 5,
  },
  paginationDotActive: {
    backgroundColor: "#1DB954",
    width: 20,
  },
  buttonContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  nextButton: {
    marginBottom: 15,
    borderRadius: 25,
    overflow: "hidden",
  },
  nextButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: "center",
  },
  nextButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    alignItems: "center",
    paddingVertical: 15,
  },
  backButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
});
