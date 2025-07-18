import React, { useState, useRef, useEffect, useMemo } from "react";
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
import { ArrowLeft, Send, MapPin, Plus, Mic } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useChat } from "react-native-vercel-ai";
import { FestiFunColors, FestiFunFonts } from "../lib/design-system";
import Markdown from "react-native-markdown-display";

export default function ActivityConfig() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);

  // Construire le contexte d'activité enrichi à partir des paramètres avec gestion d'erreur
  const activityContext = useMemo(() => {
    // Fonction helper pour parser JSON de manière sécurisée
    const safeJsonParse = (jsonString: string, fallback: any = []) => {
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        console.error("❌ [ActivityContext] Erreur parsing JSON:", error);
        console.error("📄 [ActivityContext] JSON problématique:", jsonString);
        return fallback;
      }
    };

    return {
      // Contexte festival de base
      festivalName: params.festivalName || "Festival",
      festivalLocation: params.festivalLocation || "Location",
      latitude: parseFloat((params.latitude as string) || "51.14103"),
      longitude: parseFloat((params.longitude as string) || "2.7463"),
      festivalStartDate: params.festivalStartDate,
      festivalEndDate: params.festivalEndDate,
      availableDates: params.availableDates
        ? (params.availableDates as string).split(",")
        : [],

      // Planning détaillé du jour
      selectedDate: params.selectedDate,
      dayType: params.dayType || "free", // "festival" ou "free"
      dayName: params.dayName,

      // Créneaux occupés et disponibles avec parsing sécurisé
      occupiedSlots: params.occupiedSlots
        ? safeJsonParse(params.occupiedSlots as string, [])
        : [],
      availableSlots: params.availableSlots
        ? safeJsonParse(params.availableSlots as string, [])
        : [],

      // Contraintes temporelles
      maxActivitiesPerDay: parseInt(
        (params.maxActivitiesPerDay as string) || "4"
      ),
      currentActivitiesCount: parseInt(
        (params.currentActivitiesCount as string) || "0"
      ),
    };
  }, [params]);

  // État pour stocker les tool calls séparément
  const [messageToolCalls, setMessageToolCalls] = useState<
    Record<string, any[]>
  >({});

  // Fonction pour gérer la validation d'une option d'activité
  const handleValidateOption = (validationCall: any) => {
    console.log("🎯 [Validation] Activité sélectionnée:", validationCall);

    // Adapter la structure des données pour correspondre à l'API actuelle
    const args = validationCall.args;
    const activityInfo = {
      activityId: args.activityId,
      activityName: args.activityName,
      activityDescription: args.activityDescription,
      category: args.category,
      rating: args.rating,
      distance: args.distance,
      estimatedDuration: args.estimatedDuration,
      price: args.price,
      coordinates: args.coordinates,
    };
    const scheduleInfo = {
      scheduledDate: args.scheduledDate,
      scheduledTime: args.scheduledTime,
    };

    Alert.alert(
      "🎭 Super choix !",
      `Ton activité ${activityInfo.activityName} est programmée !\n\n📅 ${
        scheduleInfo.scheduledDate
      }\n⏰ ${scheduleInfo.scheduledTime}\n💰 ${
        activityInfo.price
      }\n📍 ${Math.round(
        activityInfo.distance / 1000
      )}km du festival\n\nPassons maintenant à l'organisation de ton voyage !`,
      [
        {
          text: "Continuer",
          style: "default",
          onPress: () => {
            console.log(
              "🚀 [Navigation] Redirection vers l'organisation du voyage"
            );

            // PRÉSERVER TOUTES les données existantes du voyage en cours
            const existingParams = { ...params };

            // Retirer les paramètres de contexte internes pour éviter la duplication
            delete existingParams.originalContext;
            delete existingParams.latitude;
            delete existingParams.longitude;
            delete existingParams.availableDates;

            // Préparer les paramètres à envoyer en PRÉSERVANT tout le contexte existant
            const navParams = {
              ...existingParams, // Conserver TOUS les paramètres existants (transport, logement, etc.)

              // Ajouter/mettre à jour uniquement les données d'activité
              activityValidated: "true",
              activityId: activityInfo.activityId,
              activityName: activityInfo.activityName,
              activityDescription: activityInfo.activityDescription,
              activityCategory: activityInfo.category,
              activityRating: activityInfo.rating?.toString() || "0",
              activityDistance: activityInfo.distance?.toString() || "0",
              activityDuration: activityInfo.estimatedDuration,
              activityPrice: activityInfo.price,
              activityDate: scheduleInfo.scheduledDate,
              activityTime: scheduleInfo.scheduledTime || "14:00",
              activityLatitude:
                activityInfo.coordinates?.lat?.toString() || "0",
              activityLongitude:
                activityInfo.coordinates?.lon?.toString() || "0",
            };

            console.log(
              "📤 [Navigation] Paramètres envoyés (contexte préservé):",
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

  // Chat avec Vercel AI SDK (même format que les autres configs)
  // Sérialiser le contexte de manière sécurisée
  const activityContextJson = useMemo(() => {
    try {
      const jsonString = JSON.stringify(activityContext);
      console.log(
        "✅ [ActivityContext] Sérialisation réussie, taille:",
        jsonString.length
      );
      return jsonString;
    } catch (error) {
      console.error("❌ [ActivityContext] Erreur sérialisation:", error);
      // Contexte minimal en fallback
      return JSON.stringify({
        festivalName: activityContext.festivalName || "Festival",
        festivalLocation: activityContext.festivalLocation || "Location",
        latitude: activityContext.latitude || 51.14103,
        longitude: activityContext.longitude || 2.7463,
        selectedDate:
          activityContext.selectedDate ||
          new Date().toISOString().split("T")[0],
        dayType: activityContext.dayType || "free",
        maxActivitiesPerDay: activityContext.maxActivitiesPerDay || 4,
        currentActivitiesCount: activityContext.currentActivitiesCount || 0,
      });
    }
  }, [activityContext]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    setInput,
  } = useChat({
    api: "/api/activity-chat",
    headers: {
      "X-Client-Platform": "react-native",
      "X-Activity-Context": activityContextJson,
    },
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content: (() => {
          const selectedDateFormatted = activityContext.selectedDate
            ? new Date(
                typeof activityContext.selectedDate === "string"
                  ? activityContext.selectedDate
                  : activityContext.selectedDate[0]
              ).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
            : "cette journée";

          const dayTypeEmoji =
            activityContext.dayType === "festival" ? "🎵" : "🗓️";
          const dayTypeLabel =
            activityContext.dayType === "festival"
              ? "Jour de festival"
              : "Journée libre";

          // Affichage des créneaux occupés
          const occupiedSlotsText =
            activityContext.occupiedSlots.length > 0
              ? `\n📋 **Déjà programmé :**\n${activityContext.occupiedSlots
                  .map((slot) => `• ${slot.name} (${slot.time})`)
                  .join("\n")}`
              : "";

          // Affichage des créneaux libres
          const availableSlotsText =
            activityContext.availableSlots.length > 0
              ? `\n⏰ **Créneaux libres disponibles :**\n${activityContext.availableSlots
                  .map((slot) => `• **${slot.time}** - ${slot.description}`)
                  .join("\n")}`
              : "";

          // Recommandations contextuelles
          const recommendations =
            activityContext.dayType === "festival"
              ? "\n💡 **Recommandations :** Privilégie les activités courtes et proches du festival pour ce jour !"
              : "\n💡 **Recommandations :** Tu as toute liberté pour des activités longues et immersives !";

          // Contraintes
          const remainingSlots =
            activityContext.maxActivitiesPerDay -
            activityContext.currentActivitiesCount;
          const constraintsText =
            remainingSlots > 0
              ? `\n🎯 **Places restantes :** ${remainingSlots}/${activityContext.maxActivitiesPerDay} activités possibles`
              : "\n⚠️ **Attention :** Plus de place pour d'autres activités ce jour-là !";

          return `🎭 **Planifions ton ${selectedDateFormatted} !** ✨

${dayTypeEmoji} **${dayTypeLabel}** près du ${activityContext.festivalName}
📍 **Destination :** ${activityContext.festivalLocation}${occupiedSlotsText}${availableSlotsText}${recommendations}${constraintsText}

**Quel type d'activité t'intéresse pour ce créneau ?**`;
        })(),
      },
    ],
    onFinish: (message) => {
      console.log(
        "🎯 [useChat] Message terminé:",
        JSON.stringify(message, null, 2)
      );

      // Extraire les tool calls du marqueur spécial dans le contenu (FORMAT IDENTIQUE AUX AUTRES)
      const content = message.content;
      const toolCallsMatch = content.match(/<!-- TOOL_CALLS:(.*?) -->/);

      if (toolCallsMatch) {
        try {
          const toolCallsJson = toolCallsMatch[1];
          console.log("🔧 [Raw Tool Calls JSON]:", toolCallsJson);

          // Nettoyer le JSON si l'IA a généré des erreurs de format
          const cleanedJson = toolCallsJson
            .replace(/state="result"/g, '"state":"result"')
            .replace(/state:'result'/g, '"state":"result"')
            .replace(/state:"result"/g, '"state":"result"')
            .replace(/state='result'/g, '"state":"result"')
            .replace(/}\s*state/g, ',"state"');

          console.log("🧹 [Cleaned Tool Calls JSON]:", cleanedJson);

          const toolCalls = JSON.parse(cleanedJson);
          console.log("🔧 [Tool Calls] Extraits du marqueur:", toolCalls);
          console.log(
            "🔧 [Tool Calls] Nombre de tool calls:",
            toolCalls.length
          );

          // Logging spécifique pour createActivityValidation (gérer toolName et toolname)
          const validationCalls = toolCalls.filter(
            (tc: any) =>
              tc.toolName === "createActivityValidation" ||
              tc.toolname === "createActivityValidation"
          );
          console.log(
            "✅ [Validation] Tool calls de validation trouvés:",
            validationCalls.length
          );
          if (validationCalls.length > 0) {
            console.log(
              "✅ [Validation] Détails validation:",
              validationCalls[0]
            );
            // Normaliser le toolName si c'est toolname
            validationCalls.forEach((call: any) => {
              if (call.toolname && !call.toolName) {
                call.toolName = call.toolname;
              }
            });
          }

          // Normaliser tous les tool calls pour avoir toolName
          const normalizedToolCalls = toolCalls.map((tc: any) => ({
            ...tc,
            toolName: tc.toolName || tc.toolname, // Assurer que toolName existe
          }));

          setMessageToolCalls((prev) => ({
            ...prev,
            [message.id]: normalizedToolCalls,
          }));

          // Nettoyer le contenu du message en supprimant le marqueur
          const cleanContent = content.replace(
            /<!-- TOOL_CALLS:.*? -->\n\n/,
            ""
          );
          // Note: Pas possible de modifier le message directement avec useChat
        } catch (error) {
          console.error("❌ [Tool Calls] Erreur parsing:", error);
          console.error(
            "❌ [Tool Calls] JSON problématique:",
            toolCallsMatch[1]
          );

          // En cas d'erreur de parsing, essayons de détecter si c'est une validation et créer un tool call mock
          if (toolCallsMatch[1].includes("createActivityValidation")) {
            console.log(
              "🔄 [Tool Calls] Détection validation, création d'un tool call mock"
            );
            try {
              // Extraire le nom de l'activité du contenu du message si possible
              const activityNameMatch = content.match(
                /(?:Le Vent Souffle|Musée|Centre|Théâtre|Marché|Parc)[^,\n]*/i
              );
              const activityName = activityNameMatch
                ? activityNameMatch[0]
                : "Activité sélectionnée";

              const mockValidationCall = [
                {
                  id: "mock-validation",
                  toolName: "createActivityValidation",
                  args: {
                    activityId: "mock-activity",
                    activityName: activityName,
                    activityDescription:
                      "Activité sélectionnée par l'utilisateur",
                    category: "cultural",
                    rating: 3,
                    distance: 1000,
                    estimatedDuration: "2h",
                    price: "Gratuit",
                    scheduledDate: "2025-07-19",
                    scheduledTime: "14:00",
                    coordinates: { lat: 51.14103, lon: 2.7463 },
                  },
                  state: "result",
                },
              ];

              setMessageToolCalls((prev) => ({
                ...prev,
                [message.id]: mockValidationCall,
              }));

              console.log(
                "✅ [Tool Calls] Tool call mock créé:",
                mockValidationCall
              );
            } catch (mockError) {
              console.error(
                "❌ [Tool Calls] Impossible de créer le mock:",
                mockError
              );
            }
          }
        }
      } else {
        console.log("❌ [Tool Calls] Aucun marqueur trouvé dans le message");
      }
    },
    body: {
      context: {
        festivalName: params.festivalName,
        festivalLocation: params.festivalLocation,
        latitude: parseFloat((params.latitude as string) || "0"),
        longitude: parseFloat((params.longitude as string) || "0"),
        festivalStartDate: params.festivalStartDate,
        festivalEndDate: params.festivalEndDate,
        availableDates: params.availableDates,
      },
    },
  });

  // Options d'activités rapides
  const activityTypes = [
    {
      type: "culture",
      label: "🎭 Culture",
      description: "Musées, théâtres, monuments",
    },
    {
      type: "nature",
      label: "🌳 Nature",
      description: "Parcs, jardins, randonnées",
    },
    {
      type: "gastronomie",
      label: "🍽️ Gastronomie",
      description: "Restaurants, marchés locaux",
    },
  ];

  // Fonction pour sélectionner un type d'activité
  const selectActivityType = (type: string, label: string) => {
    append({
      role: "user",
      content: `Je cherche des activités ${label.toLowerCase()}`,
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
            <Text style={styles.headerTitle}>Découvrir des activités</Text>
            <View style={styles.headerSpacer} />
          </View>
          <Text style={styles.headerSubtitle}>
            Converser pour sélectionner les activités qui vous intéressent
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
                                // Normaliser le nom du tool (gérer toolName et toolname)
                                const toolName =
                                  toolCall.toolName || toolCall.toolname;

                                const getToolIcon = () => {
                                  switch (toolName) {
                                    case "searchActivities":
                                      return "🎭";
                                    case "createActivityValidation":
                                      return "✅";
                                    default:
                                      return "🔍";
                                  }
                                };

                                const getToolLabel = () => {
                                  switch (toolName) {
                                    case "searchActivities":
                                      return `Recherche d'activités près du festival`;
                                    case "createActivityValidation":
                                      return `Activité programmée : ${
                                        toolCall.args?.activityName || "..."
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
                        const hasValidation =
                          messageToolCalls[message.id] &&
                          messageToolCalls[message.id].some(
                            (toolCall: any) =>
                              toolCall.toolName ===
                                "createActivityValidation" ||
                              toolCall.toolname === "createActivityValidation"
                          );
                        console.log(
                          `🎯 [Validation Button] Message ${message.id} - hasValidation:`,
                          hasValidation
                        );
                        console.log(
                          `🎯 [Validation Button] messageToolCalls[${message.id}]:`,
                          messageToolCalls[message.id]
                        );
                        return hasValidation;
                      })() && (
                        <View style={validationStyles.validationContainer}>
                          {messageToolCalls[message.id]
                            .filter(
                              (toolCall: any) =>
                                toolCall.toolName ===
                                  "createActivityValidation" ||
                                toolCall.toolname === "createActivityValidation"
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
                                  style={validationStyles.validationButtonText}
                                >
                                  🎭 Programmer cette activité
                                </Text>
                                <Text
                                  style={
                                    validationStyles.validationButtonSubtext
                                  }
                                >
                                  {validationCall.args?.activityName} •{" "}
                                  {validationCall.args?.price}
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

          {/* Options d'activités (seulement après le premier message) */}
          {messages.length === 1 && (
            <View style={styles.transportOptions}>
              {activityTypes.map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={styles.transportCard}
                  onPress={() => selectActivityType(option.type, option.label)}
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

// Styles pour le markdown (IDENTIQUE AUX AUTRES CONFIGS)
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
