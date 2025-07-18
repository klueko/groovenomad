import { userPreferencesService } from "../../lib/user-preferences-service-server";

export async function POST(request: Request) {
  try {
    const { userId, musicPreferences, selections } = await request.json();

    if (!userId || !selections) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await userPreferencesService.saveUserMusicPreferences(
      userId,
      musicPreferences,
      selections
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/user-preferences:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const action = url.searchParams.get("action");

    console.log(
      "🔍 GET /api/user-preferences - userId:",
      userId,
      "action:",
      action
    );

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Si c'est une demande de stats
    if (action === "stats") {
      const result = await userPreferencesService.getUserPreferencesStats(
        userId
      );

      if (!result) {
        console.log("ℹ️ Aucune stat trouvée pour userId:", userId);
        return new Response(JSON.stringify({ error: "Stats not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log("✅ Stats récupérées avec succès pour userId:", userId);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sinon, récupération normale des préférences
    const result = await userPreferencesService.getUserMusicPreferences(userId);

    if (!result) {
      console.log("ℹ️ Aucune préférence trouvée pour userId:", userId);
      return new Response(JSON.stringify({ error: "Preferences not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("✅ Préférences récupérées avec succès pour userId:", userId);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/user-preferences:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    console.log("🗑️ DELETE /api/user-preferences - userId:", userId);

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const success = await userPreferencesService.deleteUserMusicPreferences(
      userId
    );

    if (!success) {
      return new Response(
        JSON.stringify({ error: "Failed to delete preferences" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in DELETE /api/user-preferences:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const selections = await request.json();

    console.log("🔄 PATCH /api/user-preferences - userId:", userId);

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await userPreferencesService.updateUserSelections(
      userId,
      selections
    );

    if (!result) {
      return new Response(JSON.stringify({ error: "Preferences not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in PATCH /api/user-preferences:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
