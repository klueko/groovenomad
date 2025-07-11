import { db } from "../../lib/database";
import { account } from "../../lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    console.log("🔍 Route alternative - Récupération du token Spotify...");

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      console.log("❌ ID utilisateur manquant");
      return new Response(JSON.stringify({ error: "ID utilisateur requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("✅ ID utilisateur reçu:", userId);

    // Récupérer le compte Spotify de l'utilisateur
    const spotifyAccount = await db
      .select()
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "spotify")))
      .limit(1);

    if (!spotifyAccount.length) {
      console.log("❌ Aucun compte Spotify trouvé pour cet utilisateur");
      return new Response(
        JSON.stringify({ error: "Compte Spotify non trouvé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const account_data = spotifyAccount[0];
    console.log("✅ Compte Spotify trouvé:", account_data.accountId);

    // Vérifier si le token est encore valide
    const now = new Date();
    const tokenExpired =
      account_data.accessTokenExpiresAt &&
      account_data.accessTokenExpiresAt < now;

    if (tokenExpired) {
      console.log("⚠️ Token expiré, tentative de refresh...");

      if (!account_data.refreshToken) {
        console.log("❌ Pas de refresh token disponible");
        return new Response(
          JSON.stringify({ error: "Token expiré et pas de refresh token" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Refresh le token
      try {
        const refreshResponse = await fetch(
          "https://accounts.spotify.com/api/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(
                `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
              ).toString("base64")}`,
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: account_data.refreshToken,
            }),
          }
        );

        if (!refreshResponse.ok) {
          console.log("❌ Erreur lors du refresh du token");
          return new Response(
            JSON.stringify({ error: "Impossible de rafraîchir le token" }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        const tokenData = await refreshResponse.json();
        console.log("✅ Token refreshé avec succès");

        // Mettre à jour le token dans la base de données
        const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

        await db
          .update(account)
          .set({
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || account_data.refreshToken,
            accessTokenExpiresAt: newExpiresAt,
            updatedAt: new Date(),
          })
          .where(eq(account.id, account_data.id));

        console.log("✅ Token mis à jour dans la base de données");

        return new Response(
          JSON.stringify({
            accessToken: tokenData.access_token,
            expiresAt: newExpiresAt.toISOString(),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("❌ Erreur lors du refresh:", error);
        return new Response(
          JSON.stringify({ error: "Erreur lors du refresh du token" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Token encore valide
    if (!account_data.accessToken) {
      console.log("❌ Pas de token d'accès disponible");
      return new Response(
        JSON.stringify({ error: "Token d'accès non disponible" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Token Spotify valide récupéré");
    return new Response(
      JSON.stringify({
        accessToken: account_data.accessToken,
        expiresAt: account_data.accessTokenExpiresAt?.toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du token:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
