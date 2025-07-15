export async function POST(request: Request) {
  try {
    console.log("🎫 Recherche Ticketmaster côté serveur...");

    // Vérifier que la clé API est disponible côté serveur
    const apiKey = process.env.TICKETMASTER_API_KEY;
    if (!apiKey) {
      console.error("❌ TICKETMASTER_API_KEY manquante côté serveur");
      return new Response(
        JSON.stringify({ error: "Configuration serveur manquante" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer les paramètres de recherche
    const body = await request.json();
    const {
      genres,
      countryCode,
      city,
      size = 20,
      page = 0,
      startDate,
      endDate,
    } = body;

    console.log("🔍 Paramètres de recherche:", {
      genres: genres?.length || 0,
      countryCode,
      city,
      size,
      page,
    });

    // Construire les paramètres de la requête Ticketmaster
    const params = new URLSearchParams({
      apikey: apiKey,
      size: size.toString(),
      page: page.toString(),
      classificationName: "music",
      sort: "date,asc",
    });

    // Ajouter les filtres optionnels
    if (countryCode) {
      params.append("countryCode", countryCode);
    }

    if (city) {
      params.append("city", city);
    }

    if (startDate) {
      params.append("startDateTime", startDate);
    }

    if (endDate) {
      params.append("endDateTime", endDate);
    }

    // Ajouter les genres si fournis
    if (genres && genres.length > 0) {
      // Mapping avancé et précis des genres pour Ticketmaster
      const genreMapping: Record<string, string[]> = {
        // Rock et variants
        rock: [
          "Rock",
          "Classic Rock",
          "Alternative Rock",
          "Hard Rock",
          "Indie Rock",
        ],
        "classic rock": ["Classic Rock", "Rock", "Hard Rock"],
        "hard rock": ["Hard Rock", "Rock", "Metal"],
        "alternative rock": ["Alternative Rock", "Alternative", "Indie Rock"],
        "indie rock": ["Indie Rock", "Indie", "Alternative Rock"],
        "psychedelic rock": ["Psychedelic", "Rock", "Alternative Rock"],
        "progressive rock": ["Progressive Rock", "Rock", "Art Rock"],
        "art rock": ["Art Rock", "Progressive Rock", "Alternative Rock"],
        "glam rock": ["Glam Rock", "Rock", "Classic Rock"],
        "southern rock": ["Southern Rock", "Rock", "Country Rock"],
        "roots rock": ["Roots Rock", "Rock", "Folk Rock"],

        // Folk et acoustic
        folk: ["Folk", "Folk Rock", "Americana", "Country"],
        "folk rock": ["Folk Rock", "Folk", "Rock", "Americana"],
        "singer-songwriter": ["Singer-Songwriter", "Folk", "Indie", "Acoustic"],
        country: ["Country", "Country Rock", "Americana", "Folk"],
        "country rock": ["Country Rock", "Country", "Rock", "Americana"],
        americana: ["Americana", "Country", "Folk", "Alt-Country"],

        // Pop et variants
        pop: ["Pop", "Pop Rock", "Indie Pop", "Dance Pop"],
        "pop rock": ["Pop Rock", "Pop", "Rock"],
        "indie pop": ["Indie Pop", "Indie", "Pop"],
        "french pop": ["French Pop", "Pop", "Chanson"],

        // Electronic et dance
        electronic: ["Electronic", "Dance", "EDM", "Techno", "House"],
        electro: ["Electronic", "Electro", "Dance"],
        "electro swing": ["Electro Swing", "Electronic", "Swing", "Jazz"],
        house: ["House", "Electronic", "Dance"],
        "french house": ["French House", "House", "Electronic"],
        techno: ["Techno", "Electronic", "Dance"],
        "lo-fi": ["Lo-Fi", "Electronic", "Chill"],
        "lo-fi hip hop": ["Lo-Fi Hip Hop", "Hip Hop", "Electronic"],

        // Hip Hop et rap
        "hip hop": ["Hip Hop", "Rap"],
        rap: ["Rap", "Hip Hop"],
        "french rap": ["French Rap", "Rap", "Hip Hop"],

        // Jazz et variants
        jazz: ["Jazz", "Contemporary Jazz", "Smooth Jazz"],
        "french jazz": ["French Jazz", "Jazz", "Contemporary Jazz"],
        "vocal jazz": ["Vocal Jazz", "Jazz"],
        swing: ["Swing", "Jazz", "Big Band"],
        "swing music": ["Swing", "Jazz", "Big Band"],
        "big band": ["Big Band", "Jazz", "Swing"],

        // Classical et orchestral
        classical: ["Classical", "Orchestra", "Contemporary Classical"],
        opera: ["Opera", "Classical", "Vocal"],
        orchestra: ["Orchestra", "Classical", "Symphony"],
        requiem: ["Classical", "Choral", "Religious"],
        symphony: ["Symphony", "Classical", "Orchestra"],

        // Metal et variants
        metal: ["Metal", "Heavy Metal", "Hard Rock"],
        "heavy metal": ["Heavy Metal", "Metal", "Hard Rock"],
        "glam metal": ["Glam Metal", "Metal", "Hard Rock"],
        "death metal": ["Death Metal", "Metal", "Extreme Metal"],
        "black metal": ["Black Metal", "Metal", "Extreme Metal"],

        // World et international
        latin: ["Latin", "World", "Salsa", "Reggaeton"],
        world: ["World", "International", "Folk"],
        reggae: ["Reggae", "World", "Ska"],
        ska: ["Ska", "Reggae", "Punk"],

        // Punk et hardcore
        punk: ["Punk", "Pop Punk", "Hardcore"],
        "pop punk": ["Pop Punk", "Punk", "Alternative"],
        hardcore: ["Hardcore", "Punk", "Metal"],

        // Blues et variants
        blues: ["Blues", "Contemporary Blues", "Electric Blues"],
        "electric blues": ["Electric Blues", "Blues", "Rock"],

        // Indie et alternative
        indie: ["Indie", "Indie Rock", "Indie Pop", "Alternative"],
        alternative: ["Alternative", "Alternative Rock", "Indie"],

        // Français et chanson
        chanson: ["Chanson", "French Pop", "Variété Française"],
        "variété française": ["Variété Française", "French Pop", "Chanson"],
        "french indie pop": ["French Indie Pop", "Indie Pop", "French Pop"],

        // Standards et vintage
        "adult standards": ["Adult Standards", "Standards", "Vocal"],
        standards: ["Standards", "Jazz", "Vocal"],

        // Special et thématique
        christmas: ["Holiday", "Christmas", "Seasonal"],
        holiday: ["Holiday", "Christmas", "Seasonal"],
        anime: ["Anime", "Soundtrack", "J-Pop"],
        soundtrack: ["Soundtrack", "Film Music", "Score"],
      };

      const ticketmasterGenres = new Set<string>();

      for (const genre of genres) {
        const genreLower = genre.toLowerCase();

        // Recherche exacte
        if (genreMapping[genreLower]) {
          genreMapping[genreLower].forEach((g) => ticketmasterGenres.add(g));
        }

        // Recherche partielle
        for (const [key, values] of Object.entries(genreMapping)) {
          if (genreLower.includes(key) || key.includes(genreLower)) {
            values.forEach((g) => ticketmasterGenres.add(g));
          }
        }
      }

      if (ticketmasterGenres.size > 0) {
        params.append(
          "classificationName",
          Array.from(ticketmasterGenres).join(",")
        );
      }
    }

    // Faire l'appel à l'API Ticketmaster
    const ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
    console.log("🌐 Appel Ticketmaster:", ticketmasterUrl);

    const ticketmasterResponse = await fetch(ticketmasterUrl);

    if (!ticketmasterResponse.ok) {
      console.error("❌ Erreur API Ticketmaster:", ticketmasterResponse.status);
      return new Response(
        JSON.stringify({
          error: "Erreur lors de la recherche",
          status: ticketmasterResponse.status,
        }),
        {
          status: ticketmasterResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await ticketmasterResponse.json();

    console.log("✅ Événements trouvés:", data._embedded?.events?.length || 0);

    // Retourner les données (sans exposer la clé API)
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Erreur serveur:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
