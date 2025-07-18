import { auth } from "../../lib/auth";

// Interface représentant le corps de la requête
interface SignQuoteBody {
  bookingId: string;
  status?: "acceptée" | "refusée"; // default: acceptée
  userId?: string; // Optionnel pour React-Native
}

// Configuration Airtable (réutilisée)
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "appNGAlZCcMJqQOJc";
const AIRTABLE_TABLE_NAME =
  process.env.AIRTABLE_TABLE_ID || "tblbmbPOOMxLh9aoU";
const AIRTABLE_API_KEY =
  process.env.AIRTABLE_API_KEY ||
  "patErQo21TvWpFzpk.704e1a85f2290a29b9d5bab0cbf7b469f7f0206127766e695bcbf2c804696537";

export async function POST(request: Request) {
  try {
    console.log("📥 [Sign Quote] Nouvelle requête de signature devise");

    if (!AIRTABLE_API_KEY) {
      console.error("❌ [Sign Quote] AIRTABLE_API_KEY manquante");
      return new Response(
        JSON.stringify({ error: "Configuration Airtable manquante" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer le corps JSON
    const body: SignQuoteBody = await request.json();

    if (!body.bookingId) {
      return new Response(JSON.stringify({ error: "bookingId manquant" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let userId: string | undefined = body.userId;

    // Si pas de userId passé (web), tenter de récupérer via Better Auth
    if (!userId) {
      console.log("🔍 [Sign Quote] Recherche de session pour récupérer userId");
      try {
        const session = await auth.api.getSession({ headers: request.headers });
        userId = session?.user?.id;
      } catch (error) {
        console.warn(
          "⚠️ [Sign Quote] Impossible de récupérer la session:",
          error
        );
      }
    }

    console.log("👤 [Sign Quote] userId:", userId ?? "Inconnu");

    // Avant la mise à jour, on peut vérifier que la réservation appartient à l'utilisateur
    if (userId) {
      const recordUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${body.bookingId}`;
      const recordRes = await fetch(recordUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!recordRes.ok) {
        const errText = await recordRes.text();
        console.error(
          "❌ [Sign Quote] Erreur récupération enregistrement:",
          errText
        );
        return new Response(
          JSON.stringify({ error: "Réservation introuvable" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const recordData = await recordRes.json();
      if (
        recordData?.fields?.client_id &&
        recordData.fields.client_id !== userId
      ) {
        console.error(
          "❌ [Sign Quote] Réservation non autorisée pour cet utilisateur"
        );
        return new Response(JSON.stringify({ error: "Accès non autorisé" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Status voulu (acceptée par défaut)
    const newStatus = body.status === "refusée" ? "refusée" : "acceptée";

    // Mise à jour du statut dans Airtable
    const updateUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${body.bookingId}`;
    const patchRes = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          status_reservation: newStatus,
        },
      }),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error("❌ [Sign Quote] Erreur mise à jour Airtable:", errText);
      return new Response(
        JSON.stringify({ error: "Erreur mise à jour statut" }),
        {
          status: patchRes.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ [Sign Quote] Statut mis à jour → ${newStatus}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [Sign Quote] Erreur serveur:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
