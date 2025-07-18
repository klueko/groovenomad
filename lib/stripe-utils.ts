import Stripe from "stripe";

// Initialiser Stripe avec la clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

/**
 * Extrait le prix total TTC du HTML du devis
 * @param htmlContent - Le contenu HTML du devis
 * @returns Le prix total TTC en centimes (pour Stripe)
 */
export function extractTotalPriceFromHTML(htmlContent: string): number {
  try {
    console.log("🔍 Extraction du prix depuis le HTML du devis");

    // Rechercher le prix total TTC dans le HTML (format: "Total TTC :703.8€")
    const totalTTCMatch = htmlContent.match(/Total TTC :(\d+(?:\.\d+)?)/);
    if (totalTTCMatch && totalTTCMatch[1]) {
      const priceInEuros = parseFloat(totalTTCMatch[1]);
      console.log("✅ Prix trouvé dans Total TTC:", priceInEuros, "€");
      return Math.round(priceInEuros * 100);
    }

    // Rechercher le prix total TTC avec espace (format: "Total TTC : 703.8€")
    const totalTTCMatchWithSpace = htmlContent.match(
      /Total TTC : (\d+(?:\.\d+)?)/
    );
    if (totalTTCMatchWithSpace && totalTTCMatchWithSpace[1]) {
      const priceInEuros = parseFloat(totalTTCMatchWithSpace[1]);
      console.log(
        "✅ Prix trouvé dans Total TTC (avec espace):",
        priceInEuros,
        "€"
      );
      return Math.round(priceInEuros * 100);
    }

    // Rechercher dans le tableau (dernière ligne du total)
    const totalRowMatch = htmlContent.match(
      /<tr class="total">[\s\S]*?<td[^>]*>(\d+(?:\.\d+)?)€<\/td>/
    );
    if (totalRowMatch && totalRowMatch[1]) {
      const priceInEuros = parseFloat(totalRowMatch[1]);
      console.log("✅ Prix trouvé dans le tableau:", priceInEuros, "€");
      return Math.round(priceInEuros * 100);
    }

    // Rechercher tous les prix dans le tableau et prendre le dernier
    const allPricesMatch = htmlContent.match(
      /<td[^>]*>(\d+(?:\.\d+)?)€<\/td>/g
    );
    if (allPricesMatch && allPricesMatch.length > 0) {
      const lastPriceMatch =
        allPricesMatch[allPricesMatch.length - 1].match(/(\d+(?:\.\d+)?)/);
      if (lastPriceMatch && lastPriceMatch[1]) {
        const priceInEuros = parseFloat(lastPriceMatch[1]);
        console.log("✅ Prix trouvé (dernier du tableau):", priceInEuros, "€");
        return Math.round(priceInEuros * 100);
      }
    }

    // Rechercher le prix dans le format spécifique du devis
    const specificMatch = htmlContent.match(/Total TTC :(\d+(?:\.\d+)?)€/);
    if (specificMatch && specificMatch[1]) {
      const priceInEuros = parseFloat(specificMatch[1]);
      console.log("✅ Prix trouvé (format spécifique):", priceInEuros, "€");
      return Math.round(priceInEuros * 100);
    }

    console.warn("⚠️ Prix non trouvé dans le HTML du devis");
    console.log(
      "🔍 Contenu HTML analysé:",
      htmlContent.substring(0, 500) + "..."
    );
    return 0;
  } catch (error) {
    console.error("❌ Erreur lors de l'extraction du prix:", error);
    return 0;
  }
}

/**
 * Crée un PaymentIntent Stripe pour la signature du devis
 * @param amount - Montant en centimes
 * @param bookingId - ID de la réservation
 * @param customerEmail - Email du client
 * @returns PaymentIntent créé
 */
export async function createPaymentIntent(
  amount: number,
  bookingId: string,
  customerEmail: string
): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      metadata: {
        bookingId,
        customerEmail,
        type: "devis_signature",
      },
      receipt_email: customerEmail,
      description: `Signature devis - Réservation ${bookingId}`,
    });

    console.log("✅ PaymentIntent créé:", paymentIntent.id);
    return paymentIntent;
  } catch (error) {
    console.error("❌ Erreur création PaymentIntent:", error);
    throw error;
  }
}

/**
 * Confirme un PaymentIntent après paiement réussi
 * @param paymentIntentId - ID du PaymentIntent
 * @returns PaymentIntent confirmé
 */
export async function confirmPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      console.log("✅ PaymentIntent déjà confirmé:", paymentIntentId);
      return paymentIntent;
    }

    console.log("❌ PaymentIntent non confirmé:", paymentIntent.status);
    throw new Error("Paiement non confirmé");
  } catch (error) {
    console.error("❌ Erreur confirmation PaymentIntent:", error);
    throw error;
  }
}
