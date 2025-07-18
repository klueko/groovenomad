import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "../lib/auth-client";
import { LinearGradient } from "expo-linear-gradient";
import { FestiFunColors } from "../lib/design-system";
import { useTranslation } from "../lib/useTranslation";

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
  {
    id: 4,
    title: "PAS ENVIE DE RATER\nTON FESTIVAL FAV ?",
    description:
      "Pour ne rater aucun festival et toujours rester à l'affût des nouveaux événements.",
    icon: "notification",
    color: ["#18002B", "#7742FE"],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  // Auto-redirection si l'utilisateur vient de se connecter avec Spotify
  useEffect(() => {
    if (session?.user && currentStep < 3) {
      // Seulement si on n'est pas encore arrivé à l'étape notifications
      console.log(
        "🎵 Utilisateur connecté détecté dans l'onboarding, passage à l'étape notifications..."
      );
      // Passer directement à l'étape notifications
      const timer = setTimeout(() => {
        setCurrentStep(3); // Index 3 = étape notifications
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [session, router, currentStep]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Dernière étape, rediriger selon l'état de connexion
      if (session?.user) {
        // Si l'utilisateur est connecté, on l'emmène directement configurer ses préférences
        router.push("/music-preferences-selection");
      } else {
        router.push("/login");
      }
    }
  };

  const handleSkip = () => {
    if (session?.user) {
      // Si l'utilisateur est connecté, on l'emmène directement configurer ses préférences
      router.push("/music-preferences-selection");
    } else {
      router.push("/login");
    }
  };

  const renderStep = (step: OnboardingStep) => {
    // Cas spécial pour l'étape notifications
    if (step.icon === "notification") {
      return (
        <View style={styles.notificationStepContainer}>
          {/* Pedro avec la cloche */}
          <View style={styles.pedroContainer}>
            <Image
              source={require("./assets/notif_pedro.png")}
              style={styles.pedroImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.notificationTitle}>{step.title}</Text>
          <Text style={styles.notificationDescription}>{step.description}</Text>
        </View>
      );
    }

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

  const isNotificationStep =
    onboardingSteps[currentStep]?.icon === "notification";

  return (
    <View
      style={[
        styles.container,
        isNotificationStep && styles.notificationContainer,
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={FestiFunColors.primaryDark}
      />
      {/* Header avec skip */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text
            style={[
              styles.skipText,
              isNotificationStep && styles.skipTextNotification,
            ]}
          >
            {t("onboarding.skip")}
          </Text>
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
          <Text style={styles.appTitle}>{t("home.title")}</Text>
          <Text style={styles.appSubtitle}>{t("onboarding.subtitle")}</Text>
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
              {isNotificationStep
                ? t("onboarding.activateNotifications")
                : currentStep === onboardingSteps.length - 1
                ? session?.user
                  ? t("onboarding.viewProfile")
                  : t("auth.login")
                : t("common.next")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Text style={styles.backButtonText}>{t("common.previous")}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FestiFunColors.primaryDark,
  },
  notificationContainer: {
    backgroundColor: FestiFunColors.primaryDark,
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
    color: "#ad9cbb",
    fontWeight: "500",
  },
  skipTextNotification: {
    color: "#FFFFFF",
    opacity: 0.7,
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
    color: FestiFunColors.background,
    marginBottom: 10,
  },
  appSubtitle: {
    fontSize: 16,
    color: "#ad9cbb",
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
    color: FestiFunColors.background,
    marginBottom: 15,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 16,
    color: "#ad9cbb",
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
    backgroundColor: "#ad9cbb",
    marginHorizontal: 5,
  },
  paginationDotActive: {
    backgroundColor: FestiFunColors.primary,
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
    color: "#ad9cbb",
    fontSize: 16,
    fontWeight: "500",
  },

  // Styles pour l'étape notifications
  notificationStepContainer: {
    alignItems: "center",
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  pedroContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  pedroImage: {
    width: 200,
    height: 200,
  },
  notificationTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 34,
    fontFamily: "System",
  },
  notificationDescription: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.9,
    paddingHorizontal: 10,
  },
});
