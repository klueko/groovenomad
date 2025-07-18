import { auth } from "../../lib/auth";
import {
  extractTotalPriceFromHTML,
  createPaymentIntent,
  confirmPaymentIntent,
} from "../../lib/stripe-utils";

// Interface représentant le corps de la requête
interface SignQuoteWithPaymentBody {
  bookingId: string;
  devisHtml: string;
  customerEmail: string;
  paymentIntentId?: string; // Pour la confirmation du paiement
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
    console.log(
      "📥 [Sign Quote with Payment] Nouvelle requête de signature avec paiement"
    );

    if (!AIRTABLE_API_KEY) {
      console.error("❌ [Sign Quote with Payment] AIRTABLE_API_KEY manquante");
      return new Response(
        JSON.stringify({ error: "Configuration Airtable manquante" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer le corps JSON
    const body: SignQuoteWithPaymentBody = await request.json();

    if (!body.bookingId || !body.devisHtml || !body.customerEmail) {
      return new Response(
        JSON.stringify({
          error: "bookingId, devisHtml et customerEmail sont requis",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let userId: string | undefined = body.userId;

    // Si pas de userId passé (web), tenter de récupérer via Better Auth
    if (!userId) {
      console.log(
        "🔍 [Sign Quote with Payment] Recherche de session pour récupérer userId"
      );
      try {
        const session = await auth.api.getSession({ headers: request.headers });
        userId = session?.user?.id;
      } catch (error) {
        console.warn(
          "⚠️ [Sign Quote with Payment] Impossible de récupérer la session:",
          error
        );
      }
    }

    console.log("👤 [Sign Quote with Payment] userId:", userId ?? "Inconnu");

    // Si on a un paymentIntentId, c'est pour confirmer le paiement
    if (body.paymentIntentId) {
      console.log(
        "💳 [Sign Quote with Payment] Confirmation du paiement:",
        body.paymentIntentId
      );

      try {
        const paymentIntent = await confirmPaymentIntent(body.paymentIntentId);

        if (paymentIntent.status === "succeeded") {
          console.log(
            "✅ [Sign Quote with Payment] PaymentIntent confirmé, mise à jour Airtable..."
          );

          // Mettre à jour le statut dans Airtable
          const updateUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${body.bookingId}`;
          const updateData = {
            fields: {
              status_reservation: "acceptée",
            },
          };

          console.log(
            "📝 [Sign Quote with Payment] Données de mise à jour:",
            updateData
          );
          console.log("🔗 [Sign Quote with Payment] URL Airtable:", updateUrl);

          const patchRes = await fetch(updateUrl, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
          });

          console.log(
            "📊 [Sign Quote with Payment] Statut réponse Airtable:",
            patchRes.status
          );

          if (!patchRes.ok) {
            const errText = await patchRes.text();
            console.error(
              "❌ [Sign Quote with Payment] Erreur mise à jour Airtable:",
              errText
            );
            return new Response(
              JSON.stringify({
                error: "Erreur mise à jour statut",
                details: errText,
                status: patchRes.status,
              }),
              {
                status: patchRes.status,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          const updateResult = await patchRes.json();
          console.log(
            "✅ [Sign Quote with Payment] Mise à jour Airtable réussie:",
            updateResult
          );

          return new Response(
            JSON.stringify({
              success: true,
              message: "Devis signé et payé avec succès",
              paymentIntentId: body.paymentIntentId,
              airtableUpdate: updateResult,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        } else {
          return new Response(
            JSON.stringify({ error: "Paiement non confirmé" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      } catch (error) {
        console.error(
          "❌ [Sign Quote with Payment] Erreur confirmation paiement:",
          error
        );
        return new Response(
          JSON.stringify({
            error: "Erreur lors de la confirmation du paiement",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Sinon, créer un nouveau PaymentIntent
    console.log("💰 [Sign Quote with Payment] Extraction du prix du devis");
    const totalPriceInCents = extractTotalPriceFromHTML(body.devisHtml);

    if (totalPriceInCents === 0) {
      return new Response(
        JSON.stringify({ error: "Impossible d'extraire le prix du devis" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      "💶 [Sign Quote with Payment] Prix extrait:",
      totalPriceInCents / 100,
      "€"
    );

    // Créer le PaymentIntent
    const paymentIntent = await createPaymentIntent(
      totalPriceInCents,
      body.bookingId,
      body.customerEmail
    );

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: totalPriceInCents,
        amountInEuros: totalPriceInCents / 100,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [Sign Quote with Payment] Erreur serveur:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
