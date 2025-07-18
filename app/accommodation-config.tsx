import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
  Image,
  ImageBackground,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Send, Hotel, Plus, Mic } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useChat } from "react-native-vercel-ai";
import { FestiFunColors, FestiFunFonts } from "../lib/design-system";
import Markdown from "react-native-markdown-display";
import { useTranslation } from "../lib/useTranslation";

export default function AccommodationConfig() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);

  // Construire le contexte de logement à partir des paramètres
  const accommodationContext = {
    festivalName: params.festivalName,
    festivalLocation: params.festivalLocation,
    cityCode: params.cityCode,
    checkInDate: params.checkInDate,
    checkOutDate: params.checkOutDate,
    guests: params.guests,
    rooms: params.rooms,
  };

  // État pour stocker les tool calls séparément
  const [messageToolCalls, setMessageToolCalls] = useState<
    Record<string, any[]>
  >({});

  // Fonction pour gérer la validation d'une option de logement
  const handleValidateOption = (validationCall: any) => {
    console.log("🎯 [Validation] Option sélectionnée:", validationCall);

    // Adapter la structure des données pour correspondre à l'API actuelle
    const args = validationCall.args;
    const hotelInfo = {
      hotelId: args.hotelId,
      hotelName: args.hotelName,
      rating: args.rating,
      amenities: args.amenities,
    };
    const offerDetails = {
      offerId: args.offerId,
      roomType: args.roomType,
      roomDescription: args.roomDescription,
      price: args.price,
      pricePerNight: args.pricePerNight,
      checkInDate: args.checkInDate,
      checkOutDate: args.checkOutDate,
      nights: args.nights,
      guests: args.guests,
      cancellationPolicy: args.cancellationPolicy,
    };

    Alert.alert(
      "🏨 Super choix !",
      `Ton logement ${hotelInfo.hotelName} est sélectionné !\n\n💰 Prix: ${offerDetails.price}\n🛏️ ${offerDetails.roomDescription}\n📅 ${offerDetails.checkInDate} → ${offerDetails.checkOutDate}\n\nPassons maintenant à l'organisation de ton voyage !`,
      [
        {
          text: "Continuer",
          style: "default",
          onPress: () => {
            console.log(
              "🚀 [Navigation] Redirection vers l'organisation du voyage"
            );

            // Utiliser le context original au lieu du contextInfo incomplet de l'IA
            const originalContext = accommodationContext;

            // ===== PRÉSERVER LES PARAMÈTRES EXISTANTS =====
            // Récupérer tous les paramètres actuels pour ne pas écraser les validations précédentes
            const existingParams = { ...params };
            console.log(
              "🔍 [Navigation] Paramètres existants à préserver:",
              existingParams
            );

            // Préparer les paramètres à envoyer
            const navParams = {
              // ===== PRÉSERVER TOUS LES PARAMÈTRES EXISTANTS =====
              ...existingParams,

              // ===== ASSURER LA COMPATIBILITÉ AVEC TRIP-PLANNING =====
              // Si pas de festivalVenue mais festivalLocation, l'ajouter pour la compatibilité
              festivalVenue:
                existingParams.festivalVenue || existingParams.festivalLocation,
              festivalCity:
                existingParams.festivalCity || existingParams.festivalLocation,
              festivalCountry: existingParams.festivalCountry || "Belgique",

              // ===== MAPPING DES DATES POUR LA COMPATIBILITÉ =====
              // S'assurer que arrivalDate et departureDate sont présents
              arrivalDate:
                existingParams.arrivalDate || existingParams.checkInDate,
              departureDate:
                existingParams.departureDate || existingParams.checkOutDate,

              // Dates du festival pour trip-planning
              festivalStartDate:
                existingParams.festivalStartDate ||
                existingParams.arrivalDate ||
                existingParams.checkInDate,
              festivalEndDate:
                existingParams.festivalEndDate ||
                existingParams.departureDate ||
                existingParams.checkOutDate,

              // Paramètres requis pour trip-planning si manquants
              personCount:
                existingParams.personCount || existingParams.guests || "1",
              selectedTime: existingParams.selectedTime || "flexible",
              departurePoint: existingParams.departurePoint || "Ma position",

              // ===== AJOUTER UNIQUEMENT LES NOUVELLES INFORMATIONS DE LOGEMENT =====
              accommodationValidated: "true",
              accommodationHotelId: hotelInfo.hotelId,
              accommodationHotelName: hotelInfo.hotelName,
              accommodationRating: hotelInfo.rating?.toString() || "0",
              accommodationOfferId: offerDetails.offerId,
              accommodationRoomType: offerDetails.roomType,
              accommodationRoomDescription: offerDetails.roomDescription,
              accommodationPrice: offerDetails.price,
              accommodationPricePerNight: offerDetails.pricePerNight,
              accommodationCheckIn: offerDetails.checkInDate,
              accommodationCheckOut: offerDetails.checkOutDate,
              accommodationNights: offerDetails.nights.toString(),
              accommodationGuests: offerDetails.guests.toString(),
              accommodationAmenities: hotelInfo.amenities?.join(",") || "",
              accommodationCancellation: offerDetails.cancellationPolicy,
            };

            console.log(
              "📤 [Navigation] Paramètres envoyés:",
              JSON.stringify(navParams, null, 2)
            );

            // Navigation vers l'écran d'organisation principal avec les détails validés
            router.push({
              pathname: "/trip-planning",
              params: navParams,
            });
          },
        },
      ]
    );
  };

  // Chat avec Vercel AI SDK (CORRIGÉ : même format que travel-config)
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    setInput,
  } = useChat({
    api: "/api/accommodation-chat",
    headers: {
      "X-Client-Platform": "react-native",
      "X-Accommodation-Context": JSON.stringify(accommodationContext),
    },
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content: `🏨 Parfait ! Recherchons le logement idéal pour ton séjour au ${accommodationContext.festivalName} ! 🎉

📍 **Destination :** ${accommodationContext.festivalLocation}
📅 **Dates :** ${accommodationContext.checkInDate} → ${accommodationContext.checkOutDate}
👥 **Invités :** ${accommodationContext.guests} personne(s)
🛏️ **Chambres :** ${accommodationContext.rooms}

Dis-moi quel type de logement tu recherches !`,
      },
    ],
    onFinish: (message) => {
      console.log(
        "🎯 [useChat] Message terminé:",
        JSON.stringify(message, null, 2)
      );

      // Extraire les tool calls du marqueur spécial dans le contenu
      const content = message.content;
      console.log("🔍 [Tool Calls] Contenu complet du message:", content);

      // Améliorer la regex pour capturer les marqueurs même s'ils sont mal formatés ou positionnés
      const toolCallsMatch = content.match(
        /<!-- TOOL_CALLS:\s*(\[.*?\])\s*-->/s
      );

      if (toolCallsMatch) {
        try {
          const toolCallsJson = toolCallsMatch[1];
          console.log("🔧 [Raw Tool Calls JSON]:", toolCallsJson);

          let toolCalls;

          // D'abord essayer de parser le JSON tel quel
          try {
            toolCalls = JSON.parse(toolCallsJson);
            console.log("✅ [JSON] Parsing direct réussi");
          } catch (firstError) {
            console.log(
              "⚠️ [JSON] Parsing direct échoué, tentative de nettoyage..."
            );

            // Si ça échoue, nettoyage minimal
            const cleanedJson = toolCallsJson
              .replace(/,\s*}/g, "}") // Supprimer les virgules en trop
              .replace(/,\s*]/g, "]"); // Supprimer les virgules en trop avant ]

            console.log("🧹 [Cleaned Tool Calls JSON]:", cleanedJson);
            toolCalls = JSON.parse(cleanedJson);
            console.log("✅ [JSON] Parsing après nettoyage réussi");
          }

          console.log("🔧 [Tool Calls] Extraits du marqueur:", toolCalls);
          console.log(
            "🔧 [Tool Calls] Nombre de tool calls:",
            toolCalls.length
          );

          // Vérifier et logger les validations spécifiquement
          console.log("🔍 [Validation] Recherche de validations...");
          const toolCallTypes = toolCalls.map((tc: any) => tc.toolName);
          console.log("🔍 [Validation] Tool calls trouvés:", toolCallTypes);

          const validationCalls = toolCalls.filter(
            (tc: any) => tc.toolName === "createAccommodationValidation"
          );
          console.log("🔍 [Validation] Calls de validation:", validationCalls);

          if (validationCalls.length > 0) {
            console.log(
              "✅ [Validation] Tool calls de validation trouvés:",
              validationCalls.length
            );
            validationCalls.forEach((validation: any, index: number) => {
              console.log(
                `✅ [Validation ${index}] Détails validation:`,
                validation
              );
            });
          } else {
            console.log("❌ [Validation] Aucun tool call de validation trouvé");
          }

          // Logger chaque tool call individuellement pour debug
          toolCalls.forEach((toolCall: any, index: number) => {
            console.log(
              `🔍 [Tool Call ${index}] Type: ${toolCall.toolName}, Args:`,
              toolCall.args
            );
          });

          setMessageToolCalls((prev) => ({
            ...prev,
            [message.id]: toolCalls,
          }));

          // Nettoyer le contenu du message en supprimant le marqueur
          const cleanContent = content.replace(/<!-- TOOL_CALLS:.*? -->/s, "");
          console.log(
            "🧹 [Content] Contenu nettoyé:",
            cleanContent.substring(0, 100) + "..."
          );

          console.log("💾 [State] Mise à jour messageToolCalls:", {
            ...messageToolCalls,
            [message.id]: toolCalls,
          });
        } catch (error) {
          console.error("❌ [Tool Calls] Erreur parsing:", error);
          console.error(
            "❌ [Tool Calls] JSON problématique:",
            toolCallsMatch[1]
          );
          // En cas d'erreur, on ignore simplement les tool calls
        }
      } else {
        console.log("❌ [Tool Calls] Aucun marqueur trouvé dans le message");
      }
    },
    body: {
      context: {
        festivalName: params.festivalName,
        festivalLocation: params.festivalLocation,
        cityCode: params.cityCode,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        guests: params.guests,
        rooms: params.rooms,
      },
    },
  });

  // Options de logement rapides
  const accommodationTypes = [
    {
      type: "economique",
      label: "💰 Économique",
      description: "Auberges et hôtels budget",
    },
    { type: "confort", label: "🌟 Confort", description: "Hôtels 3-4 étoiles" },
    {
      type: "luxe",
      label: "✨ Luxe",
      description: "Hôtels 5 étoiles et suites",
    },
  ];

  // Fonction pour sélectionner un type de logement
  const selectAccommodationType = (type: string, label: string) => {
    append({
      role: "user",
      content: `Je cherche un logement ${label.toLowerCase()}`,
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
            <Text style={styles.headerTitle}>Trouver un logement</Text>
            <View style={styles.headerSpacer} />
          </View>
          <Text style={styles.headerSubtitle}>
            Converser pour sélectionner l'hébergement qui vous convient
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
                                    case "searchHotels":
                                      return "🏨";
                                    case "createAccommodationValidation":
                                      return "✅";
                                    default:
                                      return "🔍";
                                  }
                                };

                                const getToolLabel = () => {
                                  switch (toolCall.toolName) {
                                    case "searchHotels":
                                      return `Recherche d'hôtels : ${
                                        toolCall.args?.cityCode || "..."
                                      }`;
                                    case "createAccommodationValidation":
                                      return `Logement sélectionné : ${
                                        toolCall.args?.hotelName || "..."
                                      }`;
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
                      {(() => {
                        // Vérifier d'abord si on a des tool calls pour ce message
                        const toolCallsForMessage =
                          messageToolCalls[message.id];
                        console.log(
                          `🎯 [Validation Button Check] Message ${message.id}:`
                        );
                        console.log(
                          `🎯 [Validation Button Check] Tool calls disponibles:`,
                          toolCallsForMessage
                        );

                        if (
                          !toolCallsForMessage ||
                          !Array.isArray(toolCallsForMessage)
                        ) {
                          console.log(
                            `🎯 [Validation Button Check] Pas de tool calls pour le message ${message.id}`
                          );
                          return false;
                        }

                        // Chercher les validations
                        const validations = toolCallsForMessage.filter(
                          (toolCall: any) =>
                            toolCall.toolName ===
                            "createAccommodationValidation"
                        );

                        // Logger chaque tool call pour debug
                        toolCallsForMessage.forEach(
                          (toolCall: any, index: number) => {
                            console.log(
                              `🔍 [Tool Call Check] Type: ${toolCall.toolName}, ID: ${toolCall.id}`
                            );
                          }
                        );

                        const hasValidation = validations.length > 0;
                        console.log(
                          `🎯 [Validation Button Check] Message ${message.id} - hasValidation: ${hasValidation}`
                        );
                        console.log(
                          `🎯 [Validation Button Check] Nombre de validations trouvées: ${validations.length}`
                        );

                        if (hasValidation) {
                          console.log(
                            `✅ [Validation Button Check] Validations trouvées:`,
                            validations
                          );
                          validations.forEach(
                            (validation: any, index: number) => {
                              console.log(
                                `🎯 [Validation] Logement sélectionné:`,
                                validation
                              );
                            }
                          );
                        } else {
                          console.log(
                            `❌ [Validation Button Check] Aucune validation trouvée pour le message ${message.id}`
                          );
                          console.log(
                            `❌ [Validation Button Check] Types de tool calls disponibles:`,
                            toolCallsForMessage.map((tc: any) => tc.toolName)
                          );
                        }

                        return hasValidation;
                      })() && (
                        <View style={validationStyles.validationContainer}>
                          {messageToolCalls[message.id]
                            .filter(
                              (toolCall: any) =>
                                toolCall.toolName ===
                                "createAccommodationValidation"
                            )
                            .map((validationCall: any, index: number) => {
                              console.log(
                                `🎯 [Validation] Option sélectionnée:`,
                                validationCall
                              );
                              return (
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
                                    🏨 Valider ce logement
                                  </Text>
                                  <Text
                                    style={
                                      validationStyles.validationButtonSubtext
                                    }
                                  >
                                    {validationCall.args?.hotelName} •{" "}
                                    {validationCall.args?.price}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
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

          {/* Options de logement (seulement après le premier message) */}
          {messages.length === 1 && (
            <View style={styles.transportOptions}>
              {accommodationTypes.map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={styles.transportCard}
                  onPress={() =>
                    selectAccommodationType(option.type, option.label)
                  }
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
});

// Styles pour le markdown (IDENTIQUE À TRAVEL-CONFIG)
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
