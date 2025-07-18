// API route pour récupérer les réservations d'un utilisateur depuis Airtable
import { auth } from "../../lib/auth";

// Interface pour les données de réservation Airtable
interface AirtableBooking {
  id: string;
  fields: {
    commande_id: string;
    client_id: string;
    festival_id: string;
    nom_festival: string;
    destination: string;
    country: string;
    date_commande: string;
    date_envoi_devis?: string;
    référence_devis__: number;
    status_reservation: string;
    nb_festivaliers: number;
    ville_residence_client: string;
    type_transport: string;
    Ville_départ: string;
    Date_départ_transport: string;
    type_hebergement: string;
    Adresse_hébergement: string;
    activités_supplémentaires?: string;
    date_festival_start: string;
    date_festival_end: string;
    atmosphere?: string;
    ticket_type?: string;
    currency: string;
    contacts_mail?: string;
    contact_tel_client?: string;
    adresse_postale_client?: string;
    prix_ticket_HT?: number;
    prix_transport_HT?: number;
    prix_hebergement_TTC?: number;
    Montant_total_TTC?: number;
    devis_html?: string;
    [key: string]: any;
  };
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableBooking[];
  offset?: string;
}

// Configuration Airtable
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "appNGAlZCcMJqQOJc";
const AIRTABLE_TABLE_NAME =
  process.env.AIRTABLE_TABLE_ID || "tblbmbPOOMxLh9aoU";
const AIRTABLE_API_KEY =
  process.env.AIRTABLE_API_KEY ||
  "patErQo21TvWpFzpk.704e1a85f2290a29b9d5bab0cbf7b469f7f0206127766e695bcbf2c804696537";

export async function GET(request: Request) {
  try {
    console.log(
      "📥 [Get User Bookings] Récupération des réservations utilisateur"
    );

    // Debug configuration
    console.log("🔧 [Config] Base ID:", AIRTABLE_BASE_ID);
    console.log("🔧 [Config] Table:", AIRTABLE_TABLE_NAME);
    console.log(
      "🔧 [Config] API Key:",
      AIRTABLE_API_KEY ? "✅ Définie" : "❌ Manquante"
    );

    if (!AIRTABLE_API_KEY) {
      console.error("❌ [Get User Bookings] AIRTABLE_API_KEY manquante");
      return new Response(
        JSON.stringify({ error: "Configuration Airtable manquante" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer l'ID utilisateur depuis l'URL ou la session
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get("userId");

    let userId: string;

    if (userIdParam) {
      // Si userId est fourni en paramètre (React Native)
      console.log(
        "✅ [Get User Bookings] ID utilisateur fourni en paramètre:",
        userIdParam
      );
      userId = userIdParam;
    } else {
      // Sinon essayer de récupérer la session via Better Auth (Web)
      console.log(
        "🔍 [Get User Bookings] Tentative de récupération de session..."
      );

      try {
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        if (!session?.user?.id) {
          console.log(
            "❌ [Get User Bookings] Aucune session utilisateur trouvée"
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
          "✅ [Get User Bookings] Session utilisateur récupérée:",
          session.user.id
        );
        userId = session.user.id;
      } catch (error) {
        console.error(
          "❌ [Get User Bookings] Erreur récupération session:",
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

    console.log("✅ [Get User Bookings] ID utilisateur final:", userId);

    // Construire l'URL Airtable avec filtre par client_id
    const filterFormula = `{client_id} = '${userId}'`;
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=${encodeURIComponent(
      filterFormula
    )}&sort[0][field]=date_commande&sort[0][direction]=desc`;

    console.log("🔍 [Get User Bookings] URL Airtable:", airtableUrl);

    // Faire la requête à Airtable
    const airtableResponse = await fetch(airtableUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.text();
      console.error(
        "❌ [Get User Bookings] Erreur Airtable:",
        airtableResponse.status,
        errorData
      );
      return new Response(
        JSON.stringify({
          error: "Erreur lors de la récupération des réservations",
          details: errorData,
        }),
        {
          status: airtableResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const airtableData: AirtableResponse = await airtableResponse.json();
    console.log(
      "✅ [Get User Bookings] Données récupérées:",
      airtableData.records.length,
      "réservations"
    );

    // Transformer les données pour l'app
    const bookings = airtableData.records.map((record) => ({
      id: record.id,
      commandeId: record.fields.commande_id,
      festivalName: record.fields.nom_festival,
      destination: record.fields.destination,
      country: record.fields.country,
      status: record.fields.status_reservation,
      dateCommande: record.fields.date_commande,
      dateEnvoiDevis: record.fields.date_envoi_devis,
      referenceDevis: record.fields.référence_devis__,
      nbFestivaliers: record.fields.nb_festivaliers,
      typeTransport: record.fields.type_transport,
      villeDepart: record.fields.Ville_départ,
      dateDepartTransport: record.fields.Date_départ_transport,
      typeHebergement: record.fields.type_hebergement,
      adresseHebergement: record.fields.Adresse_hébergement,
      activitesSupplementaires: record.fields.activités_supplémentaires,
      dateFestivalStart: record.fields.date_festival_start,
      dateFestivalEnd: record.fields.date_festival_end,
      atmosphere: record.fields.atmosphere,
      ticketType: record.fields.ticket_type,
      currency: record.fields.currency,
      prixTicketHT: record.fields.prix_ticket_HT,
      prixTransportHT: record.fields.prix_transport_HT,
      prixHebergementTTC: record.fields.prix_hebergement_TTC,
      montantTotalTTC: record.fields.Montant_total_TTC,
      devisHtml: record.fields.devis_html,
      createdTime: record.createdTime,
    }));

    console.log(
      "✅ [Get User Bookings] Réservations transformées:",
      bookings.length
    );

    return new Response(JSON.stringify({ bookings }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [Get User Bookings] Erreur:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur serveur lors de la récupération des réservations",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
