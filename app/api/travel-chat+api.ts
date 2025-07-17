import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText, tool } from "ai";
import { z } from "zod";

// Configuration Groq avec Kimi K2 Instruct
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY || "",
});

// Configuration Amadeus (à ajouter dans les variables d'environnement)
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID || "";
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET || "";
const AMADEUS_BASE_URL = "https://test.api.amadeus.com"; // Test environment

// Types
interface AmadeusTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FlightOffer {
  id: string;
  price: {
    total: string;
    currency: string;
  };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      carrierCode: string;
      number: string;
    }>;
  }>;
}

// Fonction pour obtenir le token Amadeus
async function getAmadeusToken(): Promise<string> {
  console.log("🔐 [getAmadeusToken] Début demande token");
  try {
    console.log(
      "🌐 [getAmadeusToken] Appel:",
      `${AMADEUS_BASE_URL}/v1/security/oauth2/token`
    );
    const response = await fetch(
      `${AMADEUS_BASE_URL}/v1/security/oauth2/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: AMADEUS_CLIENT_ID,
          client_secret: AMADEUS_CLIENT_SECRET,
        }),
      }
    );

    console.log(`📡 [getAmadeusToken] Statut: ${response.status}`);
    if (!response.ok) {
      throw new Error(`Erreur Amadeus auth: ${response.status}`);
    }

    const data: AmadeusTokenResponse = await response.json();
    console.log("✅ [getAmadeusToken] Token reçu");
    return data.access_token;
  } catch (error) {
    console.error("❌ [getAmadeusToken] Erreur:", error);
    throw error;
  }
}

// Tool pour rechercher des vols
const searchFlights = tool({
  description: "Rechercher des vols disponibles entre deux aéroports",
  parameters: z.object({
    origin: z.string().describe("Code IATA de l'aéroport de départ (ex: PAR)"),
    destination: z
      .string()
      .describe("Code IATA de l'aéroport d'arrivée (ex: LYS)"),
    departureDate: z.string().describe("Date de départ au format YYYY-MM-DD"),
    adults: z.number().default(1).describe("Nombre d'adultes"),
    max: z.number().default(5).describe("Nombre maximum de résultats"),
  }),
  execute: async ({ origin, destination, departureDate, adults, max }) => {
    try {
      const token = await getAmadeusToken();

      const params = new URLSearchParams({
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: departureDate,
        adults: adults.toString(),
        max: max.toString(),
      });

      const response = await fetch(
        `${AMADEUS_BASE_URL}/v2/shopping/flight-offers?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur recherche vols: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        flights: data.data?.slice(0, 3) || [], // Limiter à 3 résultats
        message: `Trouvé ${
          data.data?.length || 0
        } vols de ${origin} vers ${destination}`,
      };
    } catch (error) {
      console.error("Erreur searchFlights:", error);

      // Si c'est une erreur 429 (Too Many Requests), utiliser des données mock
      if (error instanceof Error && error.message.includes("429")) {
        const mockFlights = getMockFlights(origin, destination, departureDate);
        return {
          success: true,
          flights: mockFlights,
          message: `Vols trouvés de ${origin} vers ${destination} (données de démonstration)`,
        };
      }

      return {
        success: false,
        error: "Impossible de rechercher les vols pour le moment",
        flights: [],
      };
    }
  },
});

// Fonction pour générer des données mock de vols
function getMockFlights(
  origin: string,
  destination: string,
  departureDate: string
) {
  const basePrice = Math.floor(Math.random() * 300) + 100; // Entre 100€ et 400€

  return [
    {
      price: { total: `${basePrice}.00`, currency: "EUR" },
      itineraries: [
        {
          segments: [
            {
              departure: { iataCode: origin, at: `${departureDate}T08:30:00` },
              arrival: {
                iataCode: destination,
                at: `${departureDate}T10:15:00`,
              },
              carrierCode: "AF",
              number: "1234",
              duration: "PT1H45M",
            },
          ],
          duration: "PT1H45M",
        },
      ],
      validatingAirlineCodes: ["AF"],
    },
    {
      price: { total: `${basePrice + 50}.00`, currency: "EUR" },
      itineraries: [
        {
          segments: [
            {
              departure: { iataCode: origin, at: `${departureDate}T14:20:00` },
              arrival: {
                iataCode: destination,
                at: `${departureDate}T16:05:00`,
              },
              carrierCode: "KL",
              number: "5678",
              duration: "PT1H45M",
            },
          ],
          duration: "PT1H45M",
        },
      ],
      validatingAirlineCodes: ["KL"],
    },
    {
      price: { total: `${basePrice + 100}.00`, currency: "EUR" },
      itineraries: [
        {
          segments: [
            {
              departure: { iataCode: origin, at: `${departureDate}T18:45:00` },
              arrival: {
                iataCode: destination,
                at: `${departureDate}T20:30:00`,
              },
              carrierCode: "LH",
              number: "9012",
              duration: "PT1H45M",
            },
          ],
          duration: "PT1H45M",
        },
      ],
      validatingAirlineCodes: ["LH"],
    },
  ];
}

// Fonction pour générer des données mock d'aéroports
function getMockAirports(keyword: string) {
  const normalizedKeyword = keyword.toLowerCase().trim();

  const airportDatabase = {
    // France
    paris: [
      {
        iataCode: "CDG",
        name: "Charles de Gaulle Airport",
        city: "Paris",
        country: "France",
      },
      {
        iataCode: "ORY",
        name: "Orly Airport",
        city: "Paris",
        country: "France",
      },
    ],
    lyon: [
      {
        iataCode: "LYS",
        name: "Lyon-Saint Exupéry Airport",
        city: "Lyon",
        country: "France",
      },
    ],
    marseille: [
      {
        iataCode: "MRS",
        name: "Marseille Provence Airport",
        city: "Marseille",
        country: "France",
      },
    ],
    // Royaume-Uni
    london: [
      {
        iataCode: "LHR",
        name: "Heathrow Airport",
        city: "London",
        country: "United Kingdom",
      },
      {
        iataCode: "LGW",
        name: "Gatwick Airport",
        city: "London",
        country: "United Kingdom",
      },
      {
        iataCode: "STN",
        name: "Stansted Airport",
        city: "London",
        country: "United Kingdom",
      },
    ],
    londres: [
      {
        iataCode: "LHR",
        name: "Heathrow Airport",
        city: "London",
        country: "United Kingdom",
      },
      {
        iataCode: "LGW",
        name: "Gatwick Airport",
        city: "London",
        country: "United Kingdom",
      },
    ],
    // Europe
    madrid: [
      {
        iataCode: "MAD",
        name: "Adolfo Suárez Madrid-Barajas Airport",
        city: "Madrid",
        country: "Spain",
      },
    ],
    barcelona: [
      {
        iataCode: "BCN",
        name: "Josep Tarradellas Barcelona-El Prat Airport",
        city: "Barcelona",
        country: "Spain",
      },
    ],
    rome: [
      {
        iataCode: "FCO",
        name: "Leonardo da Vinci–Fiumicino Airport",
        city: "Rome",
        country: "Italy",
      },
    ],
    berlin: [
      {
        iataCode: "BER",
        name: "Berlin Brandenburg Airport",
        city: "Berlin",
        country: "Germany",
      },
    ],
    amsterdam: [
      {
        iataCode: "AMS",
        name: "Amsterdam Airport Schiphol",
        city: "Amsterdam",
        country: "Netherlands",
      },
    ],
  };

  // Recherche exacte
  if (airportDatabase[normalizedKeyword]) {
    return airportDatabase[normalizedKeyword];
  }

  // Recherche partielle
  for (const [city, airports] of Object.entries(airportDatabase)) {
    if (city.includes(normalizedKeyword) || normalizedKeyword.includes(city)) {
      return airports;
    }
  }

  // Par défaut, retourner quelques aéroports populaires
  return [
    {
      iataCode: "CDG",
      name: "Charles de Gaulle Airport",
      city: "Paris",
      country: "France",
    },
    {
      iataCode: "LHR",
      name: "Heathrow Airport",
      city: "London",
      country: "United Kingdom",
    },
    {
      iataCode: "MAD",
      name: "Adolfo Suárez Madrid-Barajas Airport",
      city: "Madrid",
      country: "Spain",
    },
  ];
}

// Tool pour rechercher des codes d'aéroport
const searchAirports = tool({
  description: "Rechercher des codes IATA d'aéroports par ville ou nom",
  parameters: z.object({
    keyword: z.string().describe("Ville ou nom d'aéroport à rechercher"),
  }),
  execute: async ({ keyword }) => {
    console.log(`🏢 [searchAirports] Début recherche pour: "${keyword}"`);
    try {
      console.log("🔑 [searchAirports] Récupération token Amadeus...");
      const token = await getAmadeusToken();
      console.log("✅ [searchAirports] Token obtenu");

      const params = new URLSearchParams({
        keyword: keyword,
        subType: "AIRPORT",
      });

      console.log(
        `🌐 [searchAirports] Appel API: ${AMADEUS_BASE_URL}/v1/reference-data/locations?${params}`
      );
      const response = await fetch(
        `${AMADEUS_BASE_URL}/v1/reference-data/locations?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(`📡 [searchAirports] Statut réponse: ${response.status}`);
      if (!response.ok) {
        throw new Error(`Erreur recherche aéroports: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        `📊 [searchAirports] Données reçues:`,
        data.data?.length || 0,
        "locations"
      );

      const airports =
        data.data?.filter((loc: any) => loc.subType === "AIRPORT") || [];
      console.log(`✈️ [searchAirports] Aéroports filtrés:`, airports.length);

      const result = {
        success: true,
        airports: airports.slice(0, 3).map((airport: any) => ({
          iataCode: airport.iataCode,
          name: airport.name,
          city: airport.address?.cityName,
          country: airport.address?.countryName,
        })),
        message: `Trouvé ${airports.length} aéroports pour "${keyword}"`,
      };

      console.log(
        `🎯 [searchAirports] Résultat final:`,
        result.airports.length,
        "aéroports"
      );
      return result;
    } catch (error) {
      console.error("❌ [searchAirports] Erreur:", error);

      // Si c'est une erreur 429 (Too Many Requests), utiliser des données mock
      if (error instanceof Error && error.message.includes("429")) {
        console.log(
          "🔄 [searchAirports] Erreur 429 - Utilisation de données mock"
        );
        const mockAirports = getMockAirports(keyword);
        const mockResult = {
          success: true,
          airports: mockAirports,
          message: `Aéroports trouvés pour "${keyword}" (données de démonstration)`,
        };
        console.log(
          `🎭 [searchAirports] Mock result:`,
          mockResult.airports.length,
          "aéroports"
        );
        return mockResult;
      }

      console.log("💥 [searchAirports] Retour d'erreur - pas de données");
      return {
        success: false,
        error: "Impossible de rechercher les aéroports pour le moment",
        airports: [],
      };
    }
  },
});

// Tool pour rechercher des trains (simulation - Amadeus n'a pas d'API train directe)
const searchTrains = tool({
  description: "Rechercher des trains disponibles entre deux villes",
  parameters: z.object({
    origin: z.string().describe("Ville de départ"),
    destination: z.string().describe("Ville d'arrivée"),
    departureDate: z.string().describe("Date de départ au format YYYY-MM-DD"),
  }),
  execute: async ({ origin, destination, departureDate }) => {
    // Simulation - en production, utiliser SNCF Connect API ou autre
    const mockTrains = [
      {
        id: "TGV1234",
        departure: `${origin} - 08:30`,
        arrival: `${destination} - 12:45`,
        duration: "4h15",
        price: "89€",
        type: "TGV",
      },
      {
        id: "TER5678",
        departure: `${origin} - 14:15`,
        arrival: `${destination} - 19:30`,
        duration: "5h15",
        price: "45€",
        type: "TER",
      },
    ];

    return {
      success: true,
      trains: mockTrains,
      message: `Trains disponibles de ${origin} vers ${destination} le ${departureDate}`,
    };
  },
});

// Tool pour rechercher des bus (simulation)
const searchBuses = tool({
  description: "Rechercher des bus disponibles entre deux villes",
  parameters: z.object({
    origin: z.string().describe("Ville de départ"),
    destination: z.string().describe("Ville d'arrivée"),
    departureDate: z.string().describe("Date de départ au format YYYY-MM-DD"),
  }),
  execute: async ({ origin, destination, departureDate }) => {
    // Simulation - en production, utiliser FlixBus API ou autre
    const mockBuses = [
      {
        id: "FB001",
        departure: `${origin} - 07:00`,
        arrival: `${destination} - 15:30`,
        duration: "8h30",
        price: "29€",
        company: "FlixBus",
      },
      {
        id: "FB002",
        departure: `${origin} - 16:45`,
        arrival: `${destination} - 01:15+1`,
        duration: "8h30",
        price: "25€",
        company: "FlixBus",
      },
    ];

    return {
      success: true,
      buses: mockBuses,
      message: `Bus disponibles de ${origin} vers ${destination} le ${departureDate}`,
    };
  },
});

// Tool pour créer un bouton de validation de réservation
const createBookingValidation = tool({
  description:
    "Créer un bouton de validation pour permettre à l'utilisateur de confirmer et réserver une option de transport spécifique. Utilise cette fonction quand l'utilisateur exprime une préférence pour une option particulière ou demande à réserver/valider un choix.",
  parameters: z.object({
    transportType: z
      .enum(["flight", "train", "bus"])
      .describe("Type de transport choisi"),
    optionDetails: z
      .object({
        id: z.string().describe("Identifiant de l'option choisie"),
        company: z.string().describe("Compagnie de transport"),
        price: z.string().describe("Prix affiché (ex: '98,16€')"),
        departureTime: z.string().describe("Heure de départ"),
        arrivalTime: z.string().describe("Heure d'arrivée"),
        duration: z.string().describe("Durée du trajet"),
        origin: z.string().describe("Lieu de départ"),
        destination: z.string().describe("Lieu d'arrivée"),
      })
      .describe("Détails de l'option de transport sélectionnée"),
    contextInfo: z
      .object({
        festivalName: z.string().describe("Nom du festival"),
        festivalLocation: z.string().describe("Lieu du festival"),
        departureDate: z.string().describe("Date de départ"),
        returnDate: z
          .string()
          .optional()
          .describe("Date de retour si applicable"),
      })
      .describe("Informations contextuelles du voyage"),
  }),
  execute: async ({ transportType, optionDetails, contextInfo }) => {
    console.log(
      `✅ [createBookingValidation] Validation créée pour ${transportType}:`,
      optionDetails
    );

    return {
      success: true,
      validationId: `validation-${Date.now()}`,
      buttonText: "Valider cette option",
      transportType,
      selectedOption: optionDetails,
      tripContext: contextInfo,
      message: `Parfait ! Tu peux maintenant valider cette option ${
        transportType === "flight"
          ? "de vol"
          : transportType === "train"
          ? "de train"
          : "de bus"
      } pour ton voyage vers ${contextInfo.festivalName} !`,
    };
  },
});

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    console.log(
      "📥 [Travel Chat] Données reçues:",
      JSON.stringify(body, null, 2)
    );

    // Détecter si la requête vient de React Native
    const userAgent = request.headers.get("user-agent") || "";
    const clientPlatform = request.headers.get("x-client-platform") || "";

    // Plusieurs façons de détecter React Native :
    // 1. Header personnalisé que nous ajoutons
    // 2. User-Agent contenant Expo
    // 3. User-Agent mobile iOS/Android (CFNetwork pour iOS, okhttp pour Android)
    const isReactNative =
      clientPlatform === "react-native" ||
      userAgent.includes("Expo") ||
      userAgent.includes("ReactNative") ||
      userAgent.includes("CFNetwork") || // iOS natif
      userAgent.includes("okhttp") || // Android natif
      userAgent.includes("Darwin"); // iOS

    console.log("📱 [Travel Chat] User-Agent:", userAgent);
    console.log("🔧 [Travel Chat] Client-Platform header:", clientPlatform);
    console.log("🤖 [Travel Chat] Est React Native:", isReactNative);

    // Tracker pour les tool calls (React Native)
    let toolCallsExecuted: Array<{
      id: string;
      toolName: string;
      args: any;
      result?: any;
      state: "call" | "result";
    }> = [];

    // Nouveau format avec useChat de Vercel AI SDK
    const { messages } = body;

    // Récupérer le contexte depuis le header
    const contextHeader = request.headers.get("x-travel-context");
    const context = contextHeader ? JSON.parse(contextHeader) : null;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Contexte du voyage depuis les paramètres
    const travelContext = context
      ? `
Contexte du voyage :
- Festival : ${context.festivalName}
- Lieu : ${context.festivalLocation}
- Point de départ : ${context.departurePoint}
- Date d'arrivée : ${context.arrivalDate}
- Date de départ : ${context.departureDate}
- Direction : ${context.direction === "outbound" ? "aller" : "retour"}
`
      : "";

    // Les messages sont déjà au bon format pour Vercel AI SDK
    const conversationMessages = messages;

    console.log("🚀 [Travel Chat] Début de generateText...");
    console.log(
      "📝 [Travel Chat] Messages envoyés:",
      conversationMessages.length
    );
    console.log(
      "🛠️ [Travel Chat] Outils disponibles:",
      Object.keys({
        searchAirports,
        searchFlights,
        searchTrains,
        searchBuses,
        createBookingValidation,
      })
    );

    const systemPrompt = `Tu es Pedro, l'assistant IA de FestiFun, expert en planification de voyages pour festivals.

Tu aides les utilisateurs à configurer leurs trajets avec enthusiasme et expertise. Tu DOIS OBLIGATOIREMENT utiliser les outils disponibles pour rechercher des options de transport.

${travelContext}

Instructions IMPORTANTES :
1. Sois enthousiaste et utilise des emojis
2. DÈS que l'utilisateur mentionne UNE SEULE ville/aéroport, utilise IMMÉDIATEMENT searchAirports
3. Si l'utilisateur mentionne 2 villes (origine + destination), recherche les aéroports pour les DEUX immédiatement
4. Pour les vols : utilise TOUJOURS searchFlights avec les codes IATA
5. Pour les trains : utilise TOUJOURS searchTrains avec les noms de villes
6. Pour les bus : utilise TOUJOURS searchBuses avec les noms de villes
7. Présente les résultats de manière claire et attractive
8. QUAND l'utilisateur exprime une préférence pour une option spécifique (ex: "je prends l'option 1", "je choisis le vol à 98€", "je veux le train de 10h"), utilise IMMÉDIATEMENT createBookingValidation avec tous les détails de l'option choisie
9. N'hésite JAMAIS à utiliser les outils - c'est ton travail principal !
10. RÈGLE ABSOLUE : Tu DOIS TOUJOURS écrire un message d'accompagnement même quand tu utilises des outils. Ne jamais laisser le message vide !

Outils OBLIGATOIRES à utiliser :
- searchAirports : TOUJOURS utiliser pour trouver des codes d'aéroport
- searchFlights : TOUJOURS utiliser pour rechercher des vols avec codes IATA
- searchTrains : TOUJOURS utiliser pour rechercher des trains
- searchBuses : TOUJOURS utiliser pour rechercher des bus
- createBookingValidation : UTILISER quand l'utilisateur exprime une préférence pour une option spécifique ou demande à valider/réserver un choix

RÈGLE ABSOLUE : Si l'utilisateur demande une recherche de transport, tu DOIS utiliser les outils correspondants. Ne jamais donner de réponse générique sans recherche.

IMPORTANT : Même quand tu utilises des outils, tu DOIS toujours écrire un message pour expliquer ce que tu fais. Exemples :
- "✈️ Super ! Je recherche les aéroports pour Paris et Toulouse..."
- "🔍 Parfait ! Je cherche des vols pour toi..."
- "🚆 Excellente idée le train ! Je regarde les horaires..."

Réponds toujours en français avec un ton amical et professionnel.`;

    if (isReactNative) {
      // Pour React Native : utiliser generateText (sans streaming)
      console.log(
        "📱 [Travel Chat] Mode React Native - utilisation de generateText"
      );

      const result = await generateText({
        model: groq("moonshotai/kimi-k2-instruct"),
        maxSteps: 5,
        system: systemPrompt,
        messages: conversationMessages,
        tools: {
          searchAirports,
          searchFlights,
          searchTrains,
          searchBuses,
          createBookingValidation,
        },
      });

      console.log("✅ [Travel Chat] GenerateText terminé pour React Native");

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
      console.log("🌐 [Travel Chat] Mode Web - utilisation de streamText");

      const result = streamText({
        model: groq("moonshotai/kimi-k2-instruct"),
        maxSteps: 5,
        system: systemPrompt,
        messages: conversationMessages,
        tools: {
          searchAirports,
          searchFlights,
          searchTrains,
          searchBuses,
          createBookingValidation,
        },
      });

      console.log("✅ [Travel Chat] StreamText initialisé");

      // Avec streamText, on retourne directement la réponse streaming
      return result.toDataStreamResponse();
    }
  } catch (error) {
    console.error("Erreur API travel-chat:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur interne du serveur",
        message: "Désolé, j'ai rencontré un problème. Peux-tu réessayer ?",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
