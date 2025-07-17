import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ImageBackground,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Plus,
  Plane,
  Train,
  Bus,
  Send,
  Mic,
} from "lucide-react-native";
import { FestiFunColors, FestiFunFonts } from "../lib/design-system";
import { LinearGradient } from "expo-linear-gradient";
import Markdown from "react-native-markdown-display";
import { useChat } from "react-native-vercel-ai";

// Types pour le chat
type TravelOption = {
  type: "flight" | "train" | "bus";
  icon: React.ReactNode;
  label: string;
  image: any;
};

export default function TravelConfig() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);

  // Construire le contexte de voyage à partir des paramètres
  const travelContext = {
    festivalName: params.festivalName,
    festivalLocation: params.festivalLocation,
    departurePoint: params.departurePoint,
    arrivalDate: params.arrivalDate,
    departureDate: params.departureDate,
    direction: params.direction,
  };

  // État pour stocker les tool calls séparément
  const [messageToolCalls, setMessageToolCalls] = useState<
    Record<string, any[]>
  >({});

  // Fonction pour gérer la validation d'une option de transport
  const handleValidateOption = (validationCall: any) => {
    console.log("🎯 [Validation] Option sélectionnée:", validationCall);

    // Extraire les détails du transport et du contexte
    const { transportType, optionDetails, contextInfo } = validationCall.args;

    // Afficher un message de confirmation positif
    Alert.alert(
      "🎉 Super choix !",
      `Ton ${
        transportType === "flight"
          ? "vol"
          : transportType === "train"
          ? "train"
          : "bus"
      } avec ${optionDetails.company} est sélectionné !\n\n✈️ Prix: ${
        optionDetails.price
      }\n🗓️ Départ: ${optionDetails.departureTime}\n📍 ${
        optionDetails.origin
      } → ${
        optionDetails.destination
      }\n\nPassons maintenant à l'organisation de ton voyage !`,
      [
        {
          text: "Continuer",
          style: "default",
          onPress: () => {
            console.log(
              "🚀 [Navigation] Redirection vers l'organisation du voyage"
            );

            // Navigation vers l'écran d'organisation principal avec les détails validés
            router.push({
              pathname: "/trip-planning",
              params: {
                // Paramètres du festival (format attendu par trip-planning.tsx)
                festivalName: contextInfo.festivalName,
                festivalVenue: contextInfo.festivalLocation,
                festivalCity: contextInfo.festivalLocation,
                festivalCountry: "Belgique",
                festivalStartDate: contextInfo.departureDate,
                festivalEndDate: contextInfo.returnDate,

                // Paramètres requis par trip-planning
                arrivalDate: contextInfo.departureDate,
                departureDate: contextInfo.returnDate,
                personCount: "1",
                selectedTime: "flexible",
                departurePoint: optionDetails.origin,

                // Informations du transport validé pour l'affichage
                transportValidated: "true",
                transportType: transportType,
                transportCompany: optionDetails.company,
                transportPrice: optionDetails.price,
                transportDepartureTime: optionDetails.departureTime,
                transportArrivalTime: optionDetails.arrivalTime,
                transportDuration: optionDetails.duration,
                transportOrigin: optionDetails.origin,
                transportDestination: optionDetails.destination,
              },
            });
          },
        },
      ]
    );
  };

  // Chat avec Vercel AI SDK
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    setInput,
  } = useChat({
    api: "/api/travel-chat",
    headers: {
      "X-Client-Platform": "react-native",
      "X-Travel-Context": JSON.stringify(travelContext),
    },
    onFinish: (message) => {
      console.log(
        "🎯 [useChat] Message terminé:",
        JSON.stringify(message, null, 2)
      );

      // Extraire les tool calls du marqueur spécial dans le contenu
      const content = message.content;
      const toolCallsMatch = content.match(/<!-- TOOL_CALLS:(.*?) -->/);

      if (toolCallsMatch) {
        try {
          const toolCalls = JSON.parse(toolCallsMatch[1]);
          console.log("🔧 [Tool Calls] Extraits du marqueur:", toolCalls);
          setMessageToolCalls((prev) => ({
            ...prev,
            [message.id]: toolCalls,
          }));

          // Nettoyer le contenu du message en supprimant le marqueur
          const cleanContent = content.replace(
            /<!-- TOOL_CALLS:.*? -->\n\n/,
            ""
          );
          // Note: Pas possible de modifier le message directement avec useChat
        } catch (error) {
          console.error("❌ [Tool Calls] Erreur parsing:", error);
        }
      } else {
        console.log("❌ [Tool Calls] Aucun marqueur trouvé dans le message");
      }
    },
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content: `🎉 Super choix !

Tu as sélectionné ${
          params.festivalName || "ce festival"
        } comme festival, et franchement… je valide à 100% ! 🔥

Dit moi avec quel moyen de locomotion tu veux voyager.`,
      },
    ],
    body: {
      context: {
        festivalName: params.festivalName,
        festivalLocation: params.festivalLocation,
        departurePoint: params.departurePoint,
        arrivalDate: params.arrivalDate,
        departureDate: params.departureDate,
        direction: params.direction,
      },
    },
  });

  // Options de transport
  const travelOptions: TravelOption[] = [
    {
      type: "flight",
      icon: <Plane size={24} color={FestiFunColors.background} />,
      label: "Avion",
      image: require("../app/assets/pedro.mp3"), // Placeholder
    },
    {
      type: "train",
      icon: <Train size={24} color={FestiFunColors.background} />,
      label: "Train",
      image: require("../app/assets/pedro.mp3"), // Placeholder
    },
    {
      type: "bus",
      icon: <Bus size={24} color={FestiFunColors.background} />,
      label: "Bus",
      image: require("../app/assets/pedro.mp3"), // Placeholder
    },
  ];

  // Fonction pour sélectionner un moyen de transport
  const selectTransport = (type: string, label: string) => {
    append({
      role: "user",
      content: `Je veux voyager en ${label.toLowerCase()}`,
    });
  };

  // Adapter handleInputChange pour React Native
  const handleTextChange = (text: string) => {
    handleInputChange({ target: { value: text } } as any);
  };

  // Adapter handleSubmit pour React Native
  const handleFormSubmit = () => {
    if (input.trim()) {
      handleSubmit({ preventDefault: () => {} } as any);
    }
  };

  // Scroll automatique vers le bas
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <LinearGradient
          colors={["rgba(25, 0, 44, 0)", "#19002c"]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={FestiFunColors.background} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Configurer un trajet</Text>
            <View style={styles.headerSpacer} />
          </View>
          <Text style={styles.headerSubtitle}>
            Converser pour sélectionner l'étape qui vous convient
          </Text>
        </LinearGradient>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => {
            // Debug: Afficher la structure du message dans la console
            console.log(
              "📋 [Debug] Message structure:",
              JSON.stringify(message, null, 2)
            );

            return (
              <View key={message.id} style={styles.messageWrapper}>
                {message.role === "assistant" && (
                  <View style={styles.assistantMessageContainer}>
                    {/* Avatar Pedro */}
                    <View style={styles.avatarContainer}>
                      <Image
                        source={require("../app/assets/pedropedropedro.png")}
                        style={styles.avatar}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.messageCard}>
                      <Markdown style={markdownStyles}>
                        {message.content.replace(
                          /<!-- TOOL_CALLS:.*? -->\n\n/,
                          ""
                        )}
                      </Markdown>

                      {/* Affichage des tool calls avec notre système personnalisé */}
                      {messageToolCalls[message.id] &&
                        messageToolCalls[message.id].length > 0 && (
                          <View style={styles.toolCallsContainer}>
                            {messageToolCalls[message.id].map(
                              (toolCall: any, index: number) => {
                                const getToolIcon = () => {
                                  switch (toolCall.toolName) {
                                    case "searchAirports":
                                      return "🏢";
                                    case "searchFlights":
                                      return "✈️";
                                    case "searchTrains":
                                      return "🚆";
                                    case "searchBuses":
                                      return "🚌";
                                    case "createBookingValidation":
                                      return "✅";
                                    default:
                                      return "🔍";
                                  }
                                };

                                const getToolLabel = () => {
                                  switch (toolCall.toolName) {
                                    case "searchAirports":
                                      return `Recherche d'aéroports : ${
                                        toolCall.args?.keyword || "..."
                                      }`;
                                    case "searchFlights":
                                      return `Recherche de vols : ${
                                        toolCall.args?.origin || "..."
                                      } → ${
                                        toolCall.args?.destination || "..."
                                      }`;
                                    case "searchTrains":
                                      return `Recherche de trains : ${
                                        toolCall.args?.origin || "..."
                                      } → ${
                                        toolCall.args?.destination || "..."
                                      }`;
                                    case "searchBuses":
                                      return `Recherche de bus : ${
                                        toolCall.args?.origin || "..."
                                      } → ${
                                        toolCall.args?.destination || "..."
                                      }`;
                                    case "createBookingValidation":
                                      return `Option de ${
                                        toolCall.args?.transportType ||
                                        "transport"
                                      } sélectionnée`;
                                    default:
                                      return "Recherche en cours...";
                                  }
                                };

                                return (
                                  <View
                                    key={`${toolCall.id}-${index}`}
                                    style={styles.toolCallCard}
                                  >
                                    <View style={styles.toolCallHeader}>
                                      <Text style={styles.toolCallIcon}>
                                        {getToolIcon()}
                                      </Text>
                                      <Text style={styles.toolCallLabel}>
                                        {getToolLabel()}
                                      </Text>
                                      {toolCall.state === "call" && (
                                        <View style={styles.loadingDot}>
                                          <Text style={styles.loadingText}>
                                            ⏳
                                          </Text>
                                        </View>
                                      )}
                                      {toolCall.state === "result" && (
                                        <View style={styles.loadingDot}>
                                          <Text style={styles.loadingText}>
                                            ✅
                                          </Text>
                                        </View>
                                      )}
                                    </View>
                                  </View>
                                );
                              }
                            )}
                          </View>
                        )}

                      {/* Bouton de validation si présent dans les tool calls */}
                      {messageToolCalls[message.id] &&
                        messageToolCalls[message.id].some(
                          (toolCall: any) =>
                            toolCall.toolName === "createBookingValidation"
                        ) && (
                          <View style={validationStyles.validationContainer}>
                            {messageToolCalls[message.id]
                              .filter(
                                (toolCall: any) =>
                                  toolCall.toolName ===
                                  "createBookingValidation"
                              )
                              .map((validationCall: any, index: number) => (
                                <TouchableOpacity
                                  key={`validation-${index}`}
                                  style={validationStyles.validationButton}
                                  onPress={() =>
                                    handleValidateOption(validationCall)
                                  }
                                >
                                  <Text
                                    style={
                                      validationStyles.validationButtonText
                                    }
                                  >
                                    ✅ Valider cette option
                                  </Text>
                                  <Text
                                    style={
                                      validationStyles.validationButtonSubtext
                                    }
                                  >
                                    {
                                      validationCall.args?.optionDetails
                                        ?.company
                                    }{" "}
                                    •{" "}
                                    {validationCall.args?.optionDetails?.price}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                          </View>
                        )}
                    </View>
                  </View>
                )}

                {message.role === "user" && (
                  <View style={styles.userMessageContainer}>
                    <View style={styles.userMessageCard}>
                      <Text style={styles.userMessage}>{message.content}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}

          {/* Options de transport (seulement après le premier message) */}
          {messages.length === 1 && (
            <View style={styles.transportOptions}>
              {travelOptions.map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={styles.transportCard}
                  onPress={() => selectTransport(option.type, option.label)}
                >
                  <ImageBackground
                    style={styles.transportCardBackground}
                    imageStyle={styles.transportCardImage}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(119, 66, 254, 0.8)",
                        "rgba(119, 66, 254, 0.9)",
                      ]}
                      style={styles.transportCardOverlay}
                    >
                      <View style={styles.transportCardContent}>
                        {option.icon}
                        <Text style={styles.transportLabel}>
                          {option.label}
                        </Text>
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Indicateur de chargement */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Barre de saisie */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.addButton}>
              <Plus size={24} color={FestiFunColors.background} />
            </TouchableOpacity>
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                value={input}
                onChangeText={setInput}
                placeholder="Message..."
                placeholderTextColor={FestiFunColors.textOnDark + "60"}
                multiline
                maxLength={500}
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSubmit}
              >
                {input.trim() ? (
                  <Send size={24} color={FestiFunColors.primary} />
                ) : (
                  <Mic size={24} color={FestiFunColors.textOnDark + "60"} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#19002c",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fafafa",
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
  },
  headerSpacer: {
    width: 40,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#ad9cbb",
    textAlign: "center",
    lineHeight: 18,
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  assistantMessageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 11,
  },
  avatarContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 19,
    height: 19,
    borderRadius: 10,
  },
  messageCard: {
    backgroundColor: "#574366",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    maxWidth: "80%",
  },
  assistantMessage: {
    fontSize: 16,
    lineHeight: 22,
    color: "#fff",
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
  userMessageContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  userMessageCard: {
    backgroundColor: FestiFunColors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: "80%",
  },
  userMessage: {
    fontSize: 16,
    lineHeight: 22,
    color: FestiFunColors.background,
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
  transportOptions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 20,
    paddingHorizontal: 10,
  },
  transportCard: {
    width: 106,
    height: 113,
    borderRadius: 24,
    overflow: "hidden",
  },
  transportCardBackground: {
    flex: 1,
  },
  transportCardImage: {
    borderRadius: 24,
  },
  transportCardOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 10,
  },
  transportCardContent: {
    alignItems: "center",
    gap: 5,
  },
  transportLabel: {
    fontSize: 16,
    color: FestiFunColors.background,
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingDots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ad9cbb",
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(217, 217, 217, 0.01)",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  addButton: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  textInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#574366",
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: FestiFunColors.background,
    fontFamily: FestiFunFonts.variants.poppinsRegular,
    maxHeight: 80,
    paddingVertical: 4,
  },
  sendButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  // Styles pour les tool calls
  toolCallsContainer: {
    marginTop: 12,
    gap: 8,
  },
  toolCallCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(119, 66, 254, 0.3)",
  },
  toolCallHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toolCallIcon: {
    fontSize: 18,
  },
  toolCallLabel: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
    fontFamily: FestiFunFonts.variants.poppinsMedium,
  },
  loadingDot: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 14,
    color: FestiFunColors.accent,
  },
});

// Styles pour le markdown
const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 18,
    color: "#fff",
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 22,
    color: "#fff",
    fontFamily: FestiFunFonts.variants.poppinsRegular,
    marginTop: 0,
    marginBottom: 8,
  },
  strong: {
    fontWeight: "700" as const,
    color: "#fff",
    fontFamily: FestiFunFonts.variants.poppinsBold,
  },
  em: {
    fontStyle: "italic" as const,
    color: "#fff",
  },
  list_item: {
    fontSize: 16,
    lineHeight: 22,
    color: "#fff",
    fontFamily: FestiFunFonts.variants.poppinsRegular,
    marginBottom: 4,
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  code_inline: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: FestiFunColors.accent,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: "monospace",
  },
  code_block: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: FestiFunColors.accent,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "monospace",
    marginVertical: 8,
  },
  blockquote: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderLeftWidth: 4,
    borderLeftColor: FestiFunColors.accent,
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
  // Styles pour les headings (titres)
  heading1: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700" as const,
    color: "#fff",
    fontFamily: FestiFunFonts.variants.poppinsBold,
    marginTop: 16,
    marginBottom: 12,
    flexWrap: "wrap" as const,
  },
  heading2: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
    color: "#fff",
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
    marginTop: 14,
    marginBottom: 10,
    flexWrap: "wrap" as const,
  },
  heading3: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600" as const,
    color: "#fff",
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
    marginTop: 12,
    marginBottom: 8,
    flexWrap: "wrap" as const,
  },
  heading4: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600" as const,
    color: "#fff",
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
    marginTop: 10,
    marginBottom: 6,
    flexWrap: "wrap" as const,
  },
  heading5: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600" as const,
    color: "#fff",
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
    marginTop: 8,
    marginBottom: 4,
    flexWrap: "wrap" as const,
  },
  heading6: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "600" as const,
    color: "#fff",
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
    marginTop: 6,
    marginBottom: 2,
    flexWrap: "wrap" as const,
  },
};

// Styles pour le bouton de validation
const validationStyles = StyleSheet.create({
  validationContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.3)",
  },
  validationButton: {
    backgroundColor: FestiFunColors.accent,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  validationButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
  },
  validationButtonSubtext: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginTop: 4,
    fontFamily: FestiFunFonts.variants.poppinsRegular,
  },
});
