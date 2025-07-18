// API route pour créer une demande de devis et l'envoyer à Airtable
import { auth } from "../../lib/auth";

// Interface pour les données de réservation basée sur le CSV Airtable
interface AirtableBookingData {
  commande_id: string;
  client_id: string;
  festival_id: string;
  nom_festival: string;
  destination: string;
  country: string;
  genre_musical_prefere: string;
  date_commande: string;
  date_envoi_devis: string;
  référence_devis__: number;
  status_reservation: string;
  proposition_IA_personnalisée: string;
  proposition_acceptée: string;
  nb_festivaliers: number;
  ville_residence_client: string;
  type_transport: string;
  Ville_départ: string;
  Date_départ_transport: string;
  type_hebergement: string;
  Adresse_hébergement: string;
  activités_supplémentaires: string;
  nb_commandes_client: number;
  date_festival_start: string;
  date_festival_end: string;
  atmosphere: string;
  ticket_type: string;
  currency: string;
  contacts_mail: string;
  contact_tel_client: string;
  adresse_postale_client: string;
  prix_ticket_TTC: number;
  prix_transport_TTC: number;
  prix_hebergement_TTC: number;
  "prix_activité supplémentaire_TTC": number;
  [key: string]: any;
}

// Configuration Airtable
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "appNGAlZCcMJqQOJc"; // Ta Base ID
const AIRTABLE_TABLE_NAME =
  process.env.AIRTABLE_TABLE_ID || "tblbmbPOOMxLh9aoU"; // ID de ta table
const AIRTABLE_API_KEY =
  process.env.AIRTABLE_API_KEY ||
  "patErQo21TvWpFzpk.704e1a85f2290a29b9d5bab0cbf7b469f7f0206127766e695bcbf2c804696537";

export async function POST(request: Request) {
  try {
    console.log("📥 [Booking Request] Nouvelle demande de devis reçue");

    // Debug configuration
    console.log("🔧 [Config] Base ID:", AIRTABLE_BASE_ID);
    console.log("🔧 [Config] Table:", AIRTABLE_TABLE_NAME);
    console.log(
      "🔧 [Config] API Key:",
      AIRTABLE_API_KEY ? "✅ Définie" : "❌ Manquante"
    );

    if (!AIRTABLE_API_KEY) {
      console.error("❌ [Booking Request] AIRTABLE_API_KEY manquante");
      return new Response(
        JSON.stringify({ error: "Configuration Airtable manquante" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (AIRTABLE_BASE_ID === "appXXXXXXXXXXXXXX") {
      console.error(
        "❌ [Booking Request] AIRTABLE_BASE_ID doit être configurée"
      );
      return new Response(
        JSON.stringify({
          error: "AIRTABLE_BASE_ID non configurée",
          instructions:
            "Va sur https://airtable.com/api pour obtenir ta Base ID",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { bookingData, params, userId } = await request.json();
    console.log("🔍 [Booking Request] Données reçues:", {
      bookingData,
      params,
      userId,
    });

    // Vérifier l'authentification avec Better Auth
    let clientId: string;

    if (userId) {
      // Si userId est fourni dans le body (React Native)
      console.log(
        "✅ [Booking Request] ID utilisateur fourni dans le body:",
        userId
      );
      clientId = userId;
    } else {
      // Sinon essayer de récupérer la session via Better Auth (Web)
      console.log(
        "🔍 [Booking Request] Tentative de récupération de session..."
      );

      try {
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        if (!session?.user?.id) {
          console.log(
            "❌ [Booking Request] Aucune session utilisateur trouvée"
          );
          return new Response(
            JSON.stringify({ error: "Utilisateur non authentifié" }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        console.log(
          "✅ [Booking Request] Session utilisateur récupérée:",
          session.user.id
        );
        clientId = session.user.id;
      } catch (error) {
        console.error(
          "❌ [Booking Request] Erreur récupération session:",
          error
        );
        return new Response(
          JSON.stringify({ error: "Erreur d'authentification" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    console.log("✅ [Booking Request] ID client final:", clientId);

    // Générer des IDs uniques basés sur le format du dataset
    const commandeId = `C${Math.floor(Math.random() * 90000) + 10000}`; // Format C##### (5 chiffres)
    // clientId est déjà défini plus haut avec l'authentification
    const festivalId = `F${Math.floor(Math.random() * 4700) + 1}`; // Format F## basé sur F4700 max dans le dataset
    const devisId = Math.floor(Math.random() * 900 + 100) + Math.random(); // Format ###.######## comme dans le dataset

    // Déterminer le type de transport selon les valeurs du dataset
    const transportType =
      params.transportType === "flight"
        ? "avion"
        : params.transportType === "train"
        ? "train"
        : params.transportType === "bus"
        ? "bus"
        : params.transportType === "car"
        ? "voiture"
        : "avion"; // Par défaut

    // Déterminer le type d'hébergement selon les valeurs du dataset
    const accommodationType = params.accommodationRoomType
      ?.toLowerCase()
      .includes("camping")
      ? "camping"
      : params.accommodationRoomType?.toLowerCase().includes("airbnb")
      ? "airbnb"
      : params.accommodationRoomType?.toLowerCase().includes("van")
      ? "van"
      : "hôtel"; // Par défaut

    // Déterminer l'atmosphère basée sur le festival (valeurs du dataset)
    const atmosphereOptions = [
      "Multi-stage",
      "Forest rave",
      "One-stage intimate",
      "Desert gathering",
    ];
    const atmosphere =
      atmosphereOptions[Math.floor(Math.random() * atmosphereOptions.length)];

    // Déterminer le type de ticket (valeurs du dataset)
    const ticketTypeOptions = [
      "General Admission",
      "VIP",
      "Backstage Pass",
      "Camping Pass",
    ];
    const ticketType =
      ticketTypeOptions[Math.floor(Math.random() * ticketTypeOptions.length)];

    // Déterminer la devise selon le pays/région
    const currency =
      bookingData.festivalData.location?.country === "USA"
        ? "USD"
        : bookingData.festivalData.location?.country === "UK"
        ? "GBP"
        : "EUR";

    // Générer une adresse d'hébergement réaliste basée sur le dataset
    const adresseHebergement =
      params.accommodationHotelName ||
      `${Math.floor(Math.random() * 99) + 1} ${
        [
          "Rue de la Musique",
          "Place de la Liberté",
          "Avenue des Festivals",
          "Boulevard des Artistes",
          "Chemin du Soleil",
        ][Math.floor(Math.random() * 5)]
      }, ${bookingData.festivalData.location.city}`;

    // Activités supplémentaires basées sur le dataset
    const activitiesOptions = [
      "plage",
      "spa",
      "équitation",
      "randonnée",
      "rafting",
      "non",
    ];
    const activitesSupplémentaires =
      params.activityName ||
      activitiesOptions[Math.floor(Math.random() * activitiesOptions.length)];

    // Genre musical basé sur le dataset
    const genreOptions = ["EDM", "Techno", "House", "Psytrance"];
    const genreMusical =
      genreOptions[Math.floor(Math.random() * genreOptions.length)];

    // Calculer les prix basés sur les moyennes du dataset et les données réelles
    const ticketPriceHT = Math.floor(Math.random() * 100) + 80; // Entre 80-180 comme dans le dataset
    const ticketPriceTTC = Math.round(ticketPriceHT * 1.2); // TVA 20%

    // Fonction utilitaire pour extraire les prix des paramètres
    const extractPrice = (
      priceString: string | string[] | undefined
    ): number => {
      if (!priceString) return 0;
      const price = Array.isArray(priceString) ? priceString[0] : priceString;

      // Gérer les formats européens avec virgule comme séparateur décimal
      // Ex: "116,91€" -> 116.91, "225€" -> 225, "Gratuit-10€" -> 10
      let cleanPrice = price.replace(/[€$£\s]/g, ""); // Supprimer devises et espaces

      // Si c'est un range comme "Gratuit-10", prendre la valeur max
      if (cleanPrice.includes("-")) {
        const parts = cleanPrice.split("-");
        cleanPrice = parts[parts.length - 1]; // Prendre la dernière partie
      }

      // Si c'est "Gratuit" ou "Free", retourner 0
      if (
        cleanPrice.toLowerCase().includes("gratuit") ||
        cleanPrice.toLowerCase().includes("free")
      ) {
        return 0;
      }

      // Remplacer la virgule par un point pour parseFloat
      cleanPrice = cleanPrice.replace(",", ".");

      return parseFloat(cleanPrice) || 0;
    };

    // Prix du transport (récupérer le prix réel si disponible depuis les paramètres)
    // Transport principal
    const mainTransportPrice = extractPrice(params.transportPrice);
    // Transport retour (si séparé)
    const returnTransportPrice =
      extractPrice(params.transportReturnPrice) ||
      extractPrice(params.transportPrice2);
    // Total transport (aller + retour)
    const totalTransportPrice = mainTransportPrice + returnTransportPrice;

    const transportPriceHT =
      totalTransportPrice > 0
        ? totalTransportPrice
        : Math.floor(Math.random() * 300) + 50;
    const transportPriceTTC = Math.round(transportPriceHT * 1.2); // TVA 20%

    // Prix du logement (récupérer le prix total depuis accommodationPrice)
    const accommodationPriceTTC =
      extractPrice(params.accommodationPrice) ||
      Math.floor(Math.random() * 200) + 100;

    // Prix des activités supplémentaires (récupérer depuis activityPrice si disponible)
    const activityPriceTTC =
      extractPrice(params.activityPrice) ||
      (activitesSupplémentaires === "non"
        ? 0
        : Math.floor(Math.random() * 50) + 20);

    // Calcul du montant total TTC
    const montantTotalTTC =
      ticketPriceTTC +
      transportPriceTTC +
      accommodationPriceTTC +
      activityPriceTTC;

    console.log("💰 [Booking Request] Calcul des prix:", {
      ticketPriceHT,
      ticketPriceTTC,
      transportPriceHT: transportPriceHT,
      transportPriceTTC,
      accommodationPriceTTC,
      activityPriceTTC,
      montantTotalTTC,
      extraction: {
        mainTransportPrice,
        returnTransportPrice,
        totalTransportPrice,
      },
      params: {
        transportPrice: params.transportPrice,
        transportReturnPrice: params.transportReturnPrice,
        accommodationPrice: params.accommodationPrice,
        activityPrice: params.activityPrice,
      },
    });

    // Générer des dates basées sur le dataset (2025)
    const currentDate = new Date();
    const commandeDate = new Date(
      2025,
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1
    );
    const devisDate = new Date(commandeDate);
    devisDate.setDate(devisDate.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7 jours après commande

    // Construire l'objet pour Airtable selon la structure du CSV
    const airtableData: Partial<AirtableBookingData> = {
      commande_id: commandeId,
      client_id: clientId,
      festival_id: festivalId,
      nom_festival: bookingData.festivalData.name,
      destination: bookingData.festivalData.location.city,
      country: bookingData.festivalData.location.country || "France",
      genre_musical_prefere: genreMusical,
      date_commande: commandeDate.toISOString().split("T")[0] + " 00:00",
      date_envoi_devis: devisDate.toISOString().split("T")[0] + " 00:00",
      référence_devis__: devisId,
      status_reservation: "attente", // Valeur par défaut pour nouveau devis
      proposition_IA_personnalisée: "checked", // Format boolean en string du dataset
      proposition_acceptée: "checked", // Format boolean en string du dataset
      nb_festivaliers: bookingData.personCount,
      ville_residence_client: params.departurePoint || "Paris",
      type_transport: transportType,
      Ville_départ: params.transportOrigin || params.departurePoint || "Paris",
      Date_départ_transport: bookingData.arrivalDate.split("T")[0] + " 00:00",
      type_hebergement: accommodationType,
      Adresse_hébergement: adresseHebergement,
      activités_supplémentaires: activitesSupplémentaires,
      nb_commandes_client: 1,
      date_festival_start:
        (bookingData.festivalData.dates.start?.split("T")[0] ||
          bookingData.arrivalDate.split("T")[0]) + " 00:00",
      date_festival_end:
        (bookingData.festivalData.dates.end?.split("T")[0] ||
          bookingData.departureDate.split("T")[0]) + " 00:00",
      atmosphere: atmosphere,
      ticket_type: ticketType,
      currency: currency,
      contacts_mail: "theoletullier@gmail.com", // Email par défaut (l'email utilisateur n'est pas disponible sans session)
      contact_tel_client: `+33 6 ${Math.floor(Math.random() * 90) + 10} ${
        Math.floor(Math.random() * 90) + 10
      } ${Math.floor(Math.random() * 90) + 10} ${
        Math.floor(Math.random() * 90) + 10
      }`,
      adresse_postale_client: `${Math.floor(Math.random() * 99) + 1} ${
        [
          "Rue de la Musique",
          "Avenue des Festivals",
          "Boulevard des Artistes",
          "Chemin du Soleil",
          "Place de la Liberté",
        ][Math.floor(Math.random() * 5)]
      }, ${params.departurePoint || "Paris"}, ${
        bookingData.festivalData.location.country || "France"
      }`,
      // Envoyer uniquement les prix TTC (les prix HT et total peuvent être calculés par Airtable)
      prix_ticket_TTC: ticketPriceTTC,
      prix_transport_TTC: transportPriceTTC,
      prix_hebergement_TTC: accommodationPriceTTC,
      "prix_activité supplémentaire_TTC": activityPriceTTC, // Nom exact du CSV avec espace
    };

    console.log(
      "📋 [Booking Request] Données formatées pour Airtable:",
      airtableData
    );

    // Envoyer à Airtable
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(
      AIRTABLE_TABLE_NAME
    )}`;

    console.log("🌐 [Airtable] URL:", airtableUrl);
    console.log("📤 [Airtable] Envoi des données...");

    const airtableResponse = await fetch(airtableUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: airtableData,
          },
        ],
      }),
    });

    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      console.error("❌ [Airtable] Erreur:", errorText);
      console.error("❌ [Airtable] Status:", airtableResponse.status);

      // Gestion des erreurs spécifiques
      if (errorText.includes("field is computed")) {
        console.log("🔧 [Airtable] Erreur: Champ calculé détecté");
      } else if (errorText.includes("INVALID_MULTIPLE_CHOICE_OPTIONS")) {
        console.log(
          "🔧 [Airtable] Erreur: Option de sélection invalide détectée"
        );
        console.log(
          "💡 [Aide] Vérifie que les valeurs existent dans tes champs Select d'Airtable"
        );
      }

      console.error(
        "❌ [Airtable] Données envoyées:",
        JSON.stringify(airtableData, null, 2)
      );
      throw new Error(`Airtable API error: ${airtableResponse.status}`);
    }

    const airtableResult = await airtableResponse.json();
    console.log("✅ [Airtable] Enregistrement créé:", airtableResult);

    return new Response(
      JSON.stringify({
        success: true,
        commandeId: commandeId,
        devisId: devisId,
        message: "Demande de devis enregistrée avec succès",
        airtableRecordId: airtableResult.records[0].id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [Booking Request] Erreur:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur lors de l'enregistrement de la demande",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
