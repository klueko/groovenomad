export async function POST(request: Request) {
  try {
    console.log(
      "🌍 Recherche intelligente de festivals avec géolocalisation..."
    );

    // Récupérer les paramètres de recherche
    const body = await request.json();
    const {
      userId = "user", // ID utilisateur pour les futures améliorations
      maxResults = 20,
      minMatchScore = 0.1,
      includePopularityBoost = true,
      location,
      dates,
      budget,
    } = body;

    console.log("📋 Paramètres de recherche intelligente:", {
      userId,
      maxResults,
      minMatchScore,
      location,
      dates,
    });

    // Utiliser le festival matcher amélioré
    const { festivalMatcher } = await import("../../lib/festival-matcher");

    const recommendations = await festivalMatcher.findMatchingFestivals(
      userId,
      {
        location,
        dates,
        budget,
        maxResults,
        minMatchScore,
        includePopularityBoost,
      }
    );

    console.log(
      `🎯 ${recommendations.length} festivals recommandés avec scoring géographique`
    );

    // Ajouter des métadonnées sur la recherche
    const response = {
      festivals: recommendations,
      searchMetadata: {
        totalResults: recommendations.length,
        searchMethod: "concentric_geographic",
        timestamp: new Date().toISOString(),
        criteria: {
          minMatchScore,
          maxResults,
          includePopularityBoost,
          location,
          dates,
          budget,
        },
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache", // Les données changent fréquemment
      },
    });
  } catch (error) {
    console.error("❌ Erreur dans la recherche intelligente:", error);

    return new Response(
      JSON.stringify({
        error: "Erreur lors de la recherche intelligente",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
