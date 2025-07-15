import Constants from "expo-constants";

export interface TicketmasterEvent {
  id: string;
  name: string;
  type: string;
  url: string;
  locale: string;
  images: Array<{
    url: string;
    width: number;
    height: number;
    fallback: boolean;
  }>;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
      dateTime: string;
    };
    end?: {
      localDate: string;
      localTime?: string;
      dateTime: string;
    };
    timezone: string;
    status: {
      code: string;
    };
  };
  classifications: Array<{
    primary: boolean;
    segment: {
      id: string;
      name: string;
    };
    genre: {
      id: string;
      name: string;
    };
    subGenre: {
      id: string;
      name: string;
    };
  }>;
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  _embedded?: {
    venues?: Array<{
      id: string;
      name: string;
      city: {
        name: string;
      };
      country: {
        name: string;
        countryCode: string;
      };
      address: {
        line1: string;
      };
      location: {
        latitude: string;
        longitude: string;
      };
    }>;
    attractions?: Array<{
      id: string;
      name: string;
      type: string;
      images: Array<{
        url: string;
        width: number;
        height: number;
      }>;
      classifications: Array<{
        primary: boolean;
        segment: {
          id: string;
          name: string;
        };
        genre: {
          id: string;
          name: string;
        };
        subGenre: {
          id: string;
          name: string;
        };
      }>;
    }>;
  };
}

export interface TicketmasterResponse {
  _embedded: {
    events: TicketmasterEvent[];
  };
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface FestivalSearchFilters {
  genres?: string[];
  countryCode?: string;
  city?: string;
  radius?: number;
  startDate?: string;
  endDate?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  size?: number;
  page?: number;
}

export interface FestivalRecommendation {
  event: TicketmasterEvent;
  matchScore: number;
  matchingGenres: string[];
  distance?: number;
}

class TicketmasterService {
  private readonly apiKey: string;
  private readonly baseUrl = "https://app.ticketmaster.com/discovery/v2";

  constructor() {
    // La clé API sera utilisée côté serveur seulement
    this.apiKey = ""; // Pas besoin côté client
  }

  // Mapping entre genres Spotify et classifications Ticketmaster
  private readonly genreMapping: Record<string, string[]> = {
    // Genres principaux
    rock: ["Rock", "Alternative Rock", "Hard Rock", "Classic Rock"],
    pop: ["Pop", "Pop Rock", "Indie Pop"],
    electronic: ["Electronic", "Dance", "Techno", "House", "EDM"],
    "hip hop": ["Hip Hop", "Rap", "Hip-Hop"],
    rap: ["Hip Hop", "Rap", "Hip-Hop"],
    "r&b": ["R&B", "Soul", "Rhythm & Blues"],
    jazz: ["Jazz", "Smooth Jazz", "Contemporary Jazz"],
    blues: ["Blues", "Contemporary Blues"],
    country: ["Country", "Country Rock", "Americana"],
    folk: ["Folk", "Folk Rock", "Indie Folk"],
    reggae: ["Reggae", "Ska"],
    punk: ["Punk", "Pop Punk", "Hardcore"],
    metal: ["Metal", "Heavy Metal", "Death Metal"],
    classical: ["Classical", "Orchestra"],
    latin: ["Latin", "Salsa", "Reggaeton"],
    world: ["World", "World Music"],
    indie: ["Indie", "Indie Rock", "Indie Pop"],
    alternative: ["Alternative", "Alternative Rock"],
    house: ["House", "Electronic", "Dance"],
    techno: ["Techno", "Electronic", "Dance"],
    dubstep: ["Dubstep", "Electronic", "Dance"],
    trance: ["Trance", "Electronic", "Dance"],
    ambient: ["Ambient", "Electronic"],
    funk: ["Funk", "Soul", "R&B"],
    disco: ["Disco", "Dance", "Pop"],
    gospel: ["Gospel", "Christian"],
    ska: ["Ska", "Reggae"],
    grunge: ["Grunge", "Alternative Rock"],
    "new wave": ["New Wave", "Alternative"],
    progressive: ["Progressive", "Progressive Rock"],
    psychedelic: ["Psychedelic", "Psychedelic Rock"],
  };

  private mapSpotifyGenresToTicketmaster(spotifyGenres: string[]): string[] {
    const ticketmasterGenres = new Set<string>();

    for (const genre of spotifyGenres) {
      const genreLower = genre.toLowerCase();

      // Recherche exacte
      if (this.genreMapping[genreLower]) {
        this.genreMapping[genreLower].forEach((g) => ticketmasterGenres.add(g));
      }

      // Recherche partielle
      for (const [key, values] of Object.entries(this.genreMapping)) {
        if (genreLower.includes(key) || key.includes(genreLower)) {
          values.forEach((g) => ticketmasterGenres.add(g));
        }
      }
    }

    return Array.from(ticketmasterGenres);
  }

  async searchFestivals(
    filters: FestivalSearchFilters = {}
  ): Promise<TicketmasterResponse | null> {
    try {
      console.log("🎫 Recherche de festivals via notre API sécurisée...");

      // Préparer les paramètres pour notre API
      const searchParams = {
        genres: filters.genres || [],
        countryCode: filters.countryCode,
        city: filters.city,
        size: filters.size || 50,
        page: filters.page || 0,
        startDate: filters.startDate,
        endDate: filters.endDate,
      };

      console.log("🔍 Paramètres de recherche:", searchParams);

      // Appeler notre API sécurisée au lieu de Ticketmaster directement
      const baseURL =
        Constants.expoConfig?.extra?.betterAuthUrl || "http://localhost:8081";
      const response = await fetch(`${baseURL}/api/ticketmaster-search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchParams),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erreur API:", response.status, errorData.error);
        return null;
      }

      const data = await response.json();
      console.log("✅ Festivals trouvés:", data._embedded?.events?.length || 0);

      return data;
    } catch (error) {
      console.error("❌ Erreur lors de la recherche de festivals:", error);
      return null;
    }
  }

  async getFestivalRecommendations(
    userGenres: string[],
    filters: FestivalSearchFilters = {}
  ): Promise<FestivalRecommendation[]> {
    try {
      console.log(
        "🎵 Recherche de recommandations basées sur les genres:",
        userGenres
      );

      const searchFilters = {
        ...filters,
        genres: userGenres,
      };

      const response = await this.searchFestivals(searchFilters);

      if (!response || !response._embedded?.events) {
        return [];
      }

      const recommendations: FestivalRecommendation[] = [];

      for (const event of response._embedded.events) {
        const matchScore = this.calculateMatchScore(event, userGenres);
        const matchingGenres = this.findMatchingGenres(event, userGenres);

        if (matchScore > 0) {
          recommendations.push({
            event,
            matchScore,
            matchingGenres,
          });
        }
      }

      // Trier par score de correspondance décroissant
      recommendations.sort((a, b) => b.matchScore - a.matchScore);

      console.log("✅ Recommandations générées:", recommendations.length);
      return recommendations;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la génération des recommandations:",
        error
      );
      return [];
    }
  }

  private calculateMatchScore(
    event: TicketmasterEvent,
    userGenres: string[]
  ): number {
    const ticketmasterGenres = this.mapSpotifyGenresToTicketmaster(userGenres);
    let score = 0;
    let totalPossibleScore = 0;

    // Analyser les classifications de l'événement
    for (const classification of event.classifications || []) {
      const { segment, genre, subGenre } = classification;

      totalPossibleScore += 3; // 3 niveaux de classification

      // Vérifier segment
      if (segment?.name && ticketmasterGenres.includes(segment.name)) {
        score += 1;
      }

      // Vérifier genre (plus important)
      if (genre?.name && ticketmasterGenres.includes(genre.name)) {
        score += 2;
      }

      // Vérifier sous-genre (le plus précis)
      if (subGenre?.name && ticketmasterGenres.includes(subGenre.name)) {
        score += 3;
      }
    }

    // Analyser les artistes/attractions
    if (event._embedded?.attractions) {
      for (const attraction of event._embedded.attractions) {
        for (const classification of attraction.classifications || []) {
          const { segment, genre, subGenre } = classification;

          totalPossibleScore += 3;

          if (segment?.name && ticketmasterGenres.includes(segment.name)) {
            score += 1;
          }

          if (genre?.name && ticketmasterGenres.includes(genre.name)) {
            score += 2;
          }

          if (subGenre?.name && ticketmasterGenres.includes(subGenre.name)) {
            score += 3;
          }
        }
      }
    }

    // Retourner un score normalisé entre 0 et 1
    return totalPossibleScore > 0 ? Math.min(score / totalPossibleScore, 1) : 0;
  }

  private findMatchingGenres(
    event: TicketmasterEvent,
    userGenres: string[]
  ): string[] {
    const ticketmasterGenres = this.mapSpotifyGenresToTicketmaster(userGenres);
    const matchingGenres = new Set<string>();

    // Analyser les classifications de l'événement
    for (const classification of event.classifications || []) {
      const { segment, genre, subGenre } = classification;

      if (segment?.name && ticketmasterGenres.includes(segment.name)) {
        matchingGenres.add(segment.name);
      }

      if (genre?.name && ticketmasterGenres.includes(genre.name)) {
        matchingGenres.add(genre.name);
      }

      if (subGenre?.name && ticketmasterGenres.includes(subGenre.name)) {
        matchingGenres.add(subGenre.name);
      }
    }

    // Analyser les artistes/attractions
    if (event._embedded?.attractions) {
      for (const attraction of event._embedded.attractions) {
        for (const classification of attraction.classifications || []) {
          const { segment, genre, subGenre } = classification;

          if (segment?.name && ticketmasterGenres.includes(segment.name)) {
            matchingGenres.add(segment.name);
          }

          if (genre?.name && ticketmasterGenres.includes(genre.name)) {
            matchingGenres.add(genre.name);
          }

          if (subGenre?.name && ticketmasterGenres.includes(subGenre.name)) {
            matchingGenres.add(subGenre.name);
          }
        }
      }
    }

    return Array.from(matchingGenres);
  }

  async getEventDetails(eventId: string): Promise<TicketmasterEvent | null> {
    try {
      const url = `${this.baseUrl}/events/${eventId}.json?apikey=${this.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        console.error(
          "❌ Erreur récupération détails événement:",
          response.status
        );
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Erreur récupération détails événement:", error);
      return null;
    }
  }

  // Méthodes utilitaires pour les filtres
  getCountryCodes(): Record<string, string> {
    return {
      FR: "France",
      US: "United States",
      GB: "United Kingdom",
      CA: "Canada",
      AU: "Australia",
      DE: "Germany",
      IT: "Italy",
      ES: "Spain",
      NL: "Netherlands",
      BE: "Belgium",
      CH: "Switzerland",
      AT: "Austria",
      SE: "Sweden",
      NO: "Norway",
      DK: "Denmark",
      FI: "Finland",
      PT: "Portugal",
      IE: "Ireland",
      PL: "Poland",
      CZ: "Czech Republic",
      HU: "Hungary",
      RO: "Romania",
      BG: "Bulgaria",
      HR: "Croatia",
      SI: "Slovenia",
      SK: "Slovakia",
      LT: "Lithuania",
      LV: "Latvia",
      EE: "Estonia",
      GR: "Greece",
      CY: "Cyprus",
      MT: "Malta",
      LU: "Luxembourg",
    };
  }

  getPopularFestivalCities(): string[] {
    return [
      "Paris",
      "London",
      "Berlin",
      "Amsterdam",
      "Barcelona",
      "Madrid",
      "Milan",
      "Rome",
      "Vienna",
      "Prague",
      "Budapest",
      "Copenhagen",
      "Stockholm",
      "Oslo",
      "Helsinki",
      "Zurich",
      "Brussels",
      "Dublin",
      "Lisbon",
      "Warsaw",
      "Munich",
      "Frankfurt",
      "Hamburg",
      "Cologne",
      "New York",
      "Los Angeles",
      "Chicago",
      "Miami",
      "Las Vegas",
      "San Francisco",
      "Austin",
      "Nashville",
      "Montreal",
      "Toronto",
      "Vancouver",
      "Sydney",
      "Melbourne",
      "Brisbane",
    ];
  }
}

export const ticketmasterService = new TicketmasterService();
