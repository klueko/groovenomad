import { userPreferencesService } from "../../../../lib/user-preferences-service-server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const userId = pathSegments[pathSegments.length - 2]; // userId est avant /exists

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("🔍 Vérification existence préférences pour userId:", userId);

    const exists = await userPreferencesService.hasUserMusicPreferences(userId);

    console.log("✅ Résultat vérification existence:", exists);

    return new Response(JSON.stringify({ exists }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(
      "❌ Erreur dans GET /api/user-preferences/[userId]/exists:",
      error
    );
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        exists: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
