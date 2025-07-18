import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText, tool } from "ai";
import { z } from "zod";

// Configuration Groq avec Kimi K2 Instruct
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY || "",
});

// Configuration OpenTripMap (à ajouter dans les variables d'environnement)
const OPENTRIPMAP_API_KEY = process.env.OPENTRIPMAP_API_KEY || "";
const OPENTRIPMAP_BASE_URL = "https://api.opentripmap.com/0.1/en/places";

// Types pour OpenTripMap
interface OpenTripMapPlace {
  xid: string;
  name: string;
  kinds: string;
  osm: string;
  rate: number;
  dist?: number;
  point: {
    lon: number;
    lat: number;
  };
}

interface OpenTripMapDetails {
  xid: string;
  name: string;
  address?: {
    city?: string;
    road?: string;
    house_number?: string;
    postcode?: string;
  };
  rate: number;
  kinds: string;
  sources: {
    geometry: string;
    attributes: string[];
  };
  bbox?: {
    lat_max: number;
    lat_min: number;
    lon_max: number;
    lon_min: number;
  };
  point: {
    lon: number;
    lat: number;
  };
  preview?: {
    source: string;
    height: number;
    width: number;
  };
  image?: string;
  wikipedia?: string;
  url?: string;
  otm?: string;
}

// Tool pour rechercher des activités touristiques
const searchActivities = tool({
  description:
    "Rechercher des activités et points d'intérêt touristiques près d'un lieu",
  parameters: z.object({
    latitude: z.number().describe("Latitude du lieu (festival)"),
    longitude: z.number().describe("Longitude du lieu (festival)"),
    radius: z
      .number()
      .default(5000)
      .describe("Rayon de recherche en mètres (défaut: 5km)"),
    kinds: z
      .string()
      .default(
        "cultural,historic_architecture,architecture,museums,interesting_places"
      )
      .describe("Types d'activités recherchées"),
    rate: z.number().default(2).describe("Note minimale (1-3, défaut: 2)"),
    limit: z.number().default(20).describe("Nombre maximum de résultats"),
  }),
  execute: async ({ latitude, longitude, radius, kinds, rate, limit }) => {
    try {
      console.log(
        `🎭 [searchActivities] Recherche activités près de: ${latitude}, ${longitude}`
      );
      console.log(
        `📍 [searchActivities] Rayon: ${radius}m, Types: ${kinds}, Note min: ${rate}`
      );

      if (!OPENTRIPMAP_API_KEY) {
        console.log(
          "⚠️ [searchActivities] Pas de clé API OpenTripMap, utilisation de données mock"
        );
        return getMockActivities(latitude, longitude);
      }

      const url = new URL(`${OPENTRIPMAP_BASE_URL}/radius`);
      url.searchParams.append("apikey", OPENTRIPMAP_API_KEY);
      url.searchParams.append("radius", radius.toString());
      url.searchParams.append("lon", longitude.toString());
      url.searchParams.append("lat", latitude.toString());
      url.searchParams.append("kinds", kinds);
      url.searchParams.append("rate", rate.toString());
      url.searchParams.append("limit", limit.toString());
      url.searchParams.append("format", "json");

      console.log("🌐 [searchActivities] URL:", url.toString());

      const response = await fetch(url.toString());
      console.log("📡 [searchActivities] Statut:", response.status);

      if (!response.ok) {
        console.log(
          "❌ [searchActivities] Erreur API, utilisation de données mock"
        );
        return getMockActivities(latitude, longitude);
      }

      const places: OpenTripMapPlace[] = await response.json();
      console.log("📊 [searchActivities] Activités trouvées:", places.length);

      // Enrichir avec des détails pour les meilleurs lieux
      const enrichedActivities = await Promise.all(
        places.slice(0, 6).map(async (place) => {
          try {
            const detailsUrl = `${OPENTRIPMAP_BASE_URL}/xid/${place.xid}?apikey=${OPENTRIPMAP_API_KEY}`;
            const detailsResponse = await fetch(detailsUrl);
            const details: OpenTripMapDetails = await detailsResponse.json();

            return {
              id: place.xid,
              name: place.name || "Lieu intéressant",
              description: formatActivityDescription(details),
              category: formatActivityCategory(place.kinds),
              rating: place.rate || 2,
              distance: place.dist
                ? Math.round(place.dist)
                : Math.round(
                    calculateDistance(
                      latitude,
                      longitude,
                      place.point.lat,
                      place.point.lon
                    ) * 1000
                  ),
              coordinates: {
                lat: place.point.lat,
                lon: place.point.lon,
              },
              image: details.preview?.source || details.image,
              url: details.url,
              address: formatAddress(details.address),
              estimatedDuration: estimateDuration(place.kinds),
              price: estimatePrice(place.kinds),
            };
          } catch (error) {
            console.error(`❌ [Details] Erreur pour ${place.xid}:`, error);
            return {
              id: place.xid,
              name: place.name || "Lieu intéressant",
              description: "Lieu touristique intéressant à découvrir",
              category: formatActivityCategory(place.kinds),
              rating: place.rate || 2,
              distance: place.dist || 1000,
              coordinates: { lat: place.point.lat, lon: place.point.lon },
              estimatedDuration: "1-2h",
              price: "Gratuit",
            };
          }
        })
      );

      return {
        success: true,
        activities: enrichedActivities,
        total: places.length,
        message: `${enrichedActivities.length} activités trouvées près du festival`,
      };
    } catch (error) {
      console.error("❌ [searchActivities] Erreur:", error);
      return getMockActivities(latitude, longitude);
    }
  },
});

// Tool pour créer une validation d'activité
const createActivityValidation = tool({
  description:
    "Créer un bouton de validation pour permettre à l'utilisateur de confirmer et programmer une activité spécifique",
  parameters: z.object({
    activityId: z.string().describe("ID de l'activité sélectionnée"),
    activityName: z.string().describe("Nom de l'activité"),
    activityDescription: z.string().describe("Description de l'activité"),
    category: z.string().describe("Catégorie de l'activité"),
    rating: z.number().describe("Note de l'activité (1-3)"),
    distance: z.number().describe("Distance depuis le festival en mètres"),
    estimatedDuration: z.string().describe("Durée estimée de l'activité"),
    price: z.string().describe("Prix estimé"),
    scheduledDate: z
      .string()
      .describe("Date prévue pour l'activité (YYYY-MM-DD)"),
    scheduledTime: z.string().optional().describe("Heure prévue (optionnel)"),
    coordinates: z
      .object({
        lat: z.number(),
        lon: z.number(),
      })
      .describe("Coordonnées de l'activité"),
    contextInfo: z
      .object({
        festivalName: z.string().describe("Nom du festival"),
        festivalLocation: z.string().describe("Lieu du festival"),
      })
      .describe("Informations contextuelles du voyage"),
  }),
  execute: async ({
    activityId,
    activityName,
    activityDescription,
    category,
    rating,
    distance,
    estimatedDuration,
    price,
    scheduledDate,
    scheduledTime,
    coordinates,
    contextInfo,
  }) => {
    console.log(
      `✅ [createActivityValidation] Validation créée pour l'activité:`,
      {
        activityName,
        category,
        scheduledDate,
        price,
      }
    );

    return {
      success: true,
      validationId: `activity-${Date.now()}`,
      buttonText: "Programmer cette activité",
      activityInfo: {
        activityId,
        activityName,
        activityDescription,
        category,
        rating,
        distance,
        estimatedDuration,
        price,
        coordinates,
      },
      scheduleInfo: {
        scheduledDate,
        scheduledTime: scheduledTime || "À définir",
      },
      tripContext: contextInfo,
      message: `Parfait ! Tu peux maintenant programmer ${activityName} pour ton voyage au ${contextInfo.festivalName} !`,
    };
  },
});

// Fonctions utilitaires
function getMockActivities(lat: number, lon: number) {
  const mockActivities = [
    {
      id: "mock-museum-1",
      name: "Musée d'Art Local",
      description:
        "Découvrez l'art et l'histoire locale dans ce musée incontournable de la région",
      category: "🏛️ Musée",
      rating: 3,
      distance: 1200,
      coordinates: { lat: lat + 0.01, lon: lon + 0.01 },
      estimatedDuration: "1-2h",
      price: "12€",
      address: "Centre-ville",
    },
    {
      id: "mock-historic-1",
      name: "Centre Historique",
      description:
        "Promenade dans les rues pavées du centre historique avec architecture authentique",
      category: "🏰 Historique",
      rating: 3,
      distance: 800,
      coordinates: { lat: lat + 0.005, lon: lon - 0.005 },
      estimatedDuration: "2-3h",
      price: "Gratuit",
      address: "Vieille ville",
    },
    {
      id: "mock-nature-1",
      name: "Parc Naturel Régional",
      description:
        "Espace vert parfait pour une pause nature avec sentiers de randonnée",
      category: "🌳 Nature",
      rating: 2,
      distance: 2500,
      coordinates: { lat: lat - 0.02, lon: lon + 0.015 },
      estimatedDuration: "2-4h",
      price: "Gratuit",
      address: "Périphérie",
    },
    {
      id: "mock-cultural-1",
      name: "Théâtre Municipal",
      description:
        "Salle de spectacle proposant concerts, pièces de théâtre et événements culturels",
      category: "🎭 Culture",
      rating: 3,
      distance: 1500,
      coordinates: { lat: lat + 0.008, lon: lon - 0.012 },
      estimatedDuration: "2-3h",
      price: "25-45€",
      address: "Place centrale",
    },
    {
      id: "mock-food-1",
      name: "Marché Local",
      description:
        "Marché traditionnel avec produits locaux, spécialités régionales et artisanat",
      category: "🍽️ Gastronomie",
      rating: 2,
      distance: 600,
      coordinates: { lat: lat - 0.003, lon: lon + 0.008 },
      estimatedDuration: "1-2h",
      price: "Variable",
      address: "Place du marché",
    },
  ];

  return {
    success: true,
    activities: mockActivities,
    total: mockActivities.length,
    message: `${mockActivities.length} activités trouvées près du festival (données de démonstration)`,
  };
}

function formatActivityDescription(details: OpenTripMapDetails): string {
  if (details.wikipedia) {
    return `Lieu d'intérêt touristique documenté avec informations détaillées disponibles`;
  }

  const kindsList = details.kinds.split(",");
  const mainKind = kindsList[0];

  const descriptions: Record<string, string> = {
    museums: "Musée proposant collections et expositions",
    cultural: "Site culturel d'intérêt touristique",
    historic: "Monument ou site historique à découvrir",
    architecture: "Bâtiment remarquable par son architecture",
    churches: "Édifice religieux d'intérêt architectural",
    theatres: "Salle de spectacle et événements culturels",
    interesting_places: "Lieu intéressant à visiter",
    natural: "Site naturel pour détente et découverte",
  };

  return descriptions[mainKind] || "Lieu touristique intéressant à découvrir";
}

function formatActivityCategory(kinds: string): string {
  const kindsList = kinds.split(",");
  const mainKind = kindsList[0];

  const categories: Record<string, string> = {
    museums: "🏛️ Musée",
    cultural: "🎭 Culture",
    historic: "🏰 Historique",
    architecture: "🏛️ Architecture",
    churches: "⛪ Religieux",
    theatres: "🎭 Spectacle",
    interesting_places: "📍 Point d'intérêt",
    natural: "🌳 Nature",
    foods: "🍽️ Gastronomie",
    sport: "⚽ Sport",
  };

  return categories[mainKind] || "📍 Point d'intérêt";
}

function formatAddress(address?: OpenTripMapDetails["address"]): string {
  if (!address) return "Adresse non disponible";

  const parts = [];
  if (address.road) parts.push(address.road);
  if (address.house_number) parts.push(address.house_number);
  if (address.city) parts.push(address.city);

  return parts.length > 0 ? parts.join(", ") : "Centre-ville";
}

function estimateDuration(kinds: string): string {
  const kindsList = kinds.split(",");
  const mainKind = kindsList[0];

  const durations: Record<string, string> = {
    museums: "1-2h",
    cultural: "2-3h",
    historic: "1-2h",
    architecture: "30min-1h",
    churches: "30min-1h",
    theatres: "2-3h",
    interesting_places: "1-2h",
    natural: "2-4h",
    foods: "1-2h",
  };

  return durations[mainKind] || "1-2h";
}

function estimatePrice(kinds: string): string {
  const kindsList = kinds.split(",");
  const mainKind = kindsList[0];

  const prices: Record<string, string> = {
    museums: "8-15€",
    cultural: "5-20€",
    historic: "Gratuit-10€",
    architecture: "Gratuit",
    churches: "Gratuit",
    theatres: "20-50€",
    interesting_places: "Gratuit",
    natural: "Gratuit",
    foods: "Variable",
  };

  return prices[mainKind] || "Gratuit";
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    console.log(
      "📥 [Activity Chat] Données reçues:",
      JSON.stringify(body, null, 2)
    );

    // Détecter si la requête vient de React Native
    const userAgent = request.headers.get("user-agent") || "";
    const clientPlatform = request.headers.get("x-client-platform") || "";

    const isReactNative =
      clientPlatform === "react-native" ||
      userAgent.includes("Expo") ||
      userAgent.includes("ReactNative") ||
      userAgent.includes("CFNetwork") ||
      userAgent.includes("okhttp") ||
      userAgent.includes("Darwin");

    console.log("📱 [Activity Chat] User-Agent:", userAgent);
    console.log("🔧 [Activity Chat] Client-Platform header:", clientPlatform);
    console.log("🤖 [Activity Chat] Est React Native:", isReactNative);

    const { messages } = body;

    // Récupérer le contexte depuis le header avec gestion d'erreur
    const contextHeader = request.headers.get("x-activity-context");
    let context = null;

    if (contextHeader) {
      try {
        context = JSON.parse(contextHeader);
        console.log("✅ [Activity Context] Parsing réussi:", context);
      } catch (error) {
        console.error("❌ [Activity Context] Erreur parsing JSON:", error);
        console.error(
          "📄 [Activity Context] Header problématique:",
          contextHeader
        );

        // Fallback: essayer de récupérer les infos de base depuis l'URL ou body
        context = {
          festivalName: "Festival",
          festivalLocation: "Location",
          latitude: 51.14103,
          longitude: 2.7463,
          selectedDate: new Date().toISOString().split("T")[0],
          dayType: "free",
          maxActivitiesPerDay: 4,
          currentActivitiesCount: 0,
          occupiedSlots: [],
          availableSlots: [],
        };
        console.log(
          "🔄 [Activity Context] Utilisation du contexte fallback:",
          context
        );
      }
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Contexte enrichi de l'activité depuis les paramètres
    const activityContext = context
      ? `
CONTEXTE COMPLET DU PLANNING :

🎪 Festival et destination :
- Festival : ${context.festivalName}
- Lieu : ${context.festivalLocation}
- Coordonnées : ${context.latitude}, ${context.longitude}
- Dates du festival : ${context.festivalStartDate} → ${context.festivalEndDate}

📅 Jour sélectionné pour l'activité :
- Date : ${context.selectedDate || "Non spécifiée"}
- Type : ${
          context.dayType === "festival"
            ? "🎵 Jour de festival (avec concerts)"
            : "🗓️ Journée libre (sans festival)"
        }
- Nom : ${context.dayName || "Non spécifié"}

⏰ CRÉNEAUX DÉJÀ OCCUPÉS ce jour :
${
  context.occupiedSlots && context.occupiedSlots.length > 0
    ? context.occupiedSlots
        .map((slot: any) => `- ${slot.name} (${slot.time})`)
        .join("\n")
    : "- Aucun créneau occupé"
}

🎯 CRÉNEAUX LIBRES DISPONIBLES :
${
  context.availableSlots && context.availableSlots.length > 0
    ? context.availableSlots
        .map((slot: any) => `- ${slot.time} : ${slot.description}`)
        .join("\n")
    : "- Aucun créneau défini"
}

📊 Contraintes de planning :
- Activités max par jour : ${context.maxActivitiesPerDay || 4}
- Activités déjà ajoutées : ${context.currentActivitiesCount || 0}
- Places restantes : ${
          (context.maxActivitiesPerDay || 4) -
          (context.currentActivitiesCount || 0)
        }

IMPORTANT : Suggère UNIQUEMENT des activités qui s'adaptent aux créneaux libres disponibles !
`
      : "";

    const conversationMessages = messages;

    console.log("🚀 [Activity Chat] Début de generateText...");
    console.log(
      "📝 [Activity Chat] Messages envoyés:",
      conversationMessages.length
    );
    console.log("🛠️ [Activity Chat] Outils disponibles:", [
      "searchActivities",
      "createActivityValidation",
    ]);

    const systemPrompt = `Tu es Pedro, l'assistant IA de FestiFun, expert en découverte d'activités et lieux touristiques pour festivals.

Tu aides les utilisateurs à découvrir des activités passionnantes près de leur festival avec enthousiasme et expertise locale. Tu DOIS OBLIGATOIREMENT utiliser les outils disponibles pour rechercher des activités.

${activityContext}

Instructions IMPORTANTES AVEC PLANNING INTELLIGENT :
1. Sois enthousiaste et utilise des emojis 🎭
2. ANALYSE TOUJOURS le contexte de planning avant de suggérer des activités :
   - Vérifie les créneaux libres disponibles
   - Respecte les contraintes horaires (évite les conflits avec transport/festival)
   - Adapte la durée des activités selon le temps disponible
3. DÈS que l'utilisateur mentionne un type d'activité, utilise IMMÉDIATEMENT searchActivities
4. PROPOSE des activités qui s'adaptent parfaitement aux créneaux libres :
   - Court créneau (< 3h) → activités courtes (visites, musées)
   - Long créneau (> 3h) → activités immersives (nature, cultural tours)
   - Jour de festival → activités proches et flexibles
   - Journée libre → activités plus lointaines et longues autorisées
5. QUAND l'utilisateur choisit une activité, utilise IMMÉDIATEMENT createActivityValidation avec :
   - scheduledDate = la date du jour sélectionné
   - scheduledTime = heure adaptée au créneau libre choisi
6. RECOMMANDE des horaires précis selon le planning :
   - "Parfait pour le créneau 09h-12h avant le festival !"
   - "Idéal pour l'après-midi libre 14h-17h !"
7. Mets en avant : distance, durée COMPATIBLE, prix, et timing optimal
8. Adapte les suggestions selon les goûts ET créneaux :
   - 🎭 CULTURE: utilise kinds="cultural,historic_architecture,architecture,museums,interesting_places"
   - 🌳 NATURE: utilise kinds="natural,nature_reserves,beaches,interesting_places"  
   - 🍽️ GASTRONOMIE: utilise kinds="foods,restaurants,tourist_facilities,interesting_places"
9. ALERTE si les créneaux sont pleins : "Plus de place ce jour, mais je peux suggérer d'autres jours !"
10. Suggère des activités complémentaires au thème du festival ET au planning

Outils OBLIGATOIRES à utiliser :
- searchActivities : TOUJOURS utiliser pour trouver des activités près du festival  
- createActivityValidation : UTILISER quand l'utilisateur choisit une activité spécifique

Exemples de réponses :
- "🎭 Super ! Je cherche les meilleures activités près du festival !"
- "✨ J'ai trouvé 5 activités parfaites pour ton séjour !"
- "🏛️ Musée d'Art Local - 1,2km - 12€ - 1-2h"
- "🌳 Parc Naturel - 2,5km - Gratuit - 2-4h"

 Ne réponds JAMAIS sans avoir utilisé les outils de recherche !

RÈGLE ABSOLUE : Tu DOIS TOUJOURS écrire un message d'accompagnement même quand tu utilises des outils. Ne jamais laisser le message vide !

RÈGLE CRITIQUE : Ne jamais générer manuellement de marqueurs <!-- TOOL_CALLS: --> dans tes réponses. Les outils s'exécutent automatiquement. Ne génère JAMAIS de code JSON ou de marqueurs dans tes réponses.

Réponds toujours en français avec un ton amical et passionné de tourisme.`;

    if (isReactNative) {
      console.log(
        "📱 [Activity Chat] Mode React Native - utilisation de generateText"
      );

      const result = await generateText({
        model: groq("moonshotai/kimi-k2-instruct"),
        maxSteps: 5,
        system: systemPrompt,
        messages: conversationMessages,
        tools: {
          searchActivities,
          createActivityValidation,
        },
      });

      console.log("✅ [Activity Chat] GenerateText terminé pour React Native");

      // Extraire les tool calls pour React Native depuis les steps
      const toolCallsData = [];

      console.log(
        "📊 [Steps] Total steps:",
        result.steps ? result.steps.length : 0
      );

      if (result.steps && result.steps.length > 0) {
        for (const step of result.steps) {
          console.log(
            "📝 [Step] Tool calls dans cette étape:",
            step.toolCalls ? step.toolCalls.length : 0
          );

          if (step.toolCalls && step.toolCalls.length > 0) {
            for (const toolCall of step.toolCalls) {
              console.log(
                "🔧 [Tool Call] Capturé:",
                toolCall.toolName,
                toolCall.args
              );
              toolCallsData.push({
                id: toolCall.toolCallId,
                toolName: toolCall.toolName,
                args: toolCall.args,
                state: "result", // Marqué comme terminé car generateText attend la fin
              });
            }
          }
        }
      }

      console.log("📋 [Tool Calls] Total capturés:", toolCallsData.length);

      // Créer un marqueur spécial dans le contenu pour les tool calls
      let enhancedContent = result.text;
      if (toolCallsData.length > 0) {
        const toolCallsMarker = `\n\n<!-- TOOL_CALLS:${JSON.stringify(
          toolCallsData
        )} -->`;
        enhancedContent = toolCallsMarker + "\n\n" + result.text;
      }

      // Retourner le format attendu par react-native-vercel-ai
      const responseData = {
        data: {
          role: "assistant",
          content: enhancedContent,
        },
      };

      console.log(
        "📤 [Response] Données envoyées au frontend:",
        JSON.stringify(responseData, null, 2)
      );

      return new Response(JSON.stringify(responseData), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // Pour le web : utiliser streamText (avec streaming)
      console.log("🌐 [Activity Chat] Mode Web - utilisation de streamText");

      const result = streamText({
        model: groq("moonshotai/kimi-k2-instruct"),
        maxSteps: 5,
        system: systemPrompt,
        messages: conversationMessages,
        tools: {
          searchActivities,
          createActivityValidation,
        },
      });

      console.log("✅ [Activity Chat] StreamText initialisé");

      // Avec streamText, on retourne directement la réponse streaming
      return result.toDataStreamResponse();
    }
  } catch (error) {
    console.error("❌ [Activity Chat] Erreur:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
