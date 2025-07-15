import { spotifyService, MusicPreferences } from "./spotify-service";
import {
  ticketmasterService,
  FestivalRecommendation,
  FestivalSearchFilters,
} from "./ticketmaster-service";
import {
  geoSearchService,
  UserLocation,
  GeoSearchResult,
} from "./geo-search-service";

export interface FestivalMatch {
  id: string;
  name: string;
  description: string;
  image: string;
  location: {
    venue: string;
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  dates: {
    start: string;
    end?: string;
    timezone: string;
  };
  genres: string[];
  artists: string[];
  matchScore: number;
  matchingGenres: string[];
  reasons: string[];
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  ticketUrl: string;
  estimatedPopularity: number;
}

export interface FestivalMatchingOptions {
  location?: {
    countryCode?: string;
    city?: string;
    radius?: number;
  };
  dates?: {
    startDate?: string;
    endDate?: string;
  };
  budget?: {
    min?: number;
    max?: number;
  };
  minMatchScore?: number;
  maxResults?: number;
  includePopularityBoost?: boolean;
}

class FestivalMatcher {
  async findMatchingFestivals(
    userId: string,
    options: FestivalMatchingOptions = {}
  ): Promise<FestivalMatch[]> {
    try {
      console.log(
        "🎯 Recherche intelligente de festivals pour l'utilisateur:",
        userId
      );

      // 1. Récupérer les préférences musicales de l'utilisateur
      const musicPreferences = await spotifyService.getMusicPreferences();

      if (!musicPreferences) {
        console.error("❌ Impossible de récupérer les préférences musicales");
        return [];
      }

      // 2. Déterminer la localisation de l'utilisateur
      const userLocation = await geoSearchService.getUserLocation(
        musicPreferences.profile
      );
      console.log("📍 Localisation utilisateur:", userLocation);

      // 3. Extraire les genres préférés
      const userGenres = this.extractGenresFromPreferences(musicPreferences);
      console.log(
        "🎵 Genres utilisateur:",
        userGenres.slice(0, 10),
        `... (${userGenres.length} total)`
      );

      // 4. Effectuer une recherche concentrique (proche vers loin)
      const geoResults = await this.performIntelligentGeoSearch(
        userLocation,
        userGenres,
        options
      );

      // 5. Convertir tous les résultats en FestivalMatch avec scoring avancé
      const allMatches: FestivalMatch[] = [];

      for (const geoResult of geoResults) {
        for (const recommendation of geoResult.items) {
          const match = await this.convertToFestivalMatch(
            recommendation,
            musicPreferences,
            options,
            userLocation, // Ajouter la localisation pour le scoring géographique
            geoResult.zone
          );

          if (match && match.matchScore >= (options.minMatchScore || 0.1)) {
            allMatches.push(match);
          }
        }
      }

      // 6. Trier par score final (combinant goûts musicaux + distance)
      allMatches.sort((a, b) => b.matchScore - a.matchScore);

      // 7. Éliminer les doublons et prendre les meilleurs
      const uniqueMatches = this.removeDuplicateEvents(allMatches);
      const finalMatches = uniqueMatches.slice(0, options.maxResults || 20);

      console.log(
        `✅ ${finalMatches.length} festivals uniques sélectionnés sur ${allMatches.length} trouvés`
      );

      return finalMatches;
    } catch (error) {
      console.error("❌ Erreur lors de la recherche de festivals:", error);
      return [];
    }
  }

  private async performIntelligentGeoSearch(
    userLocation: UserLocation,
    userGenres: string[],
    options: FestivalMatchingOptions
  ): Promise<GeoSearchResult<FestivalRecommendation>[]> {
    console.log("🌍 Début de la recherche géographique concentrique...");

    // Fonction de recherche pour chaque zone
    const searchFunction = async (
      filters: FestivalSearchFilters
    ): Promise<FestivalRecommendation[]> => {
      return await ticketmasterService.getFestivalRecommendations(
        userGenres,
        filters
      );
    };

    // Filtres de base pour la recherche
    const baseFilters: Omit<FestivalSearchFilters, "countryCode"> = {
      genres: userGenres,
      size: Math.ceil((options.maxResults || 20) / 3), // Répartir sur plusieurs zones
      ...options.dates,
    };

    // Effectuer la recherche concentrique
    const results = await geoSearchService.performConcentricSearch(
      userLocation,
      searchFunction,
      baseFilters
    );

    console.log(
      `🎯 Recherche concentrique terminée: ${results.length} zones avec résultats`
    );
    return results;
  }

  private removeDuplicateEvents(matches: FestivalMatch[]): FestivalMatch[] {
    const festivalGroups = new Map<string, FestivalMatch[]>();

    // Grouper les événements similaires
    for (const match of matches) {
      // Créer une clé basée sur le nom principal et le lieu (sans les détails comme "Friday", "Saturday", etc.)
      const cleanName = this.extractFestivalMainName(match.name);
      const locationKey = `${match.location.city}-${match.location.country}`;
      const groupKey = `${cleanName}||${locationKey}`;

      if (!festivalGroups.has(groupKey)) {
        festivalGroups.set(groupKey, []);
      }
      festivalGroups.get(groupKey)!.push(match);
    }

    const merged: FestivalMatch[] = [];

    // Fusionner les groupes
    for (const [groupKey, events] of festivalGroups) {
      if (events.length === 1) {
        // Pas de doublons, garder tel quel
        merged.push(events[0]);
      } else {
        // Fusionner les événements multiples
        const mergedEvent = this.mergeFestivalEvents(events);
        merged.push(mergedEvent);
        console.log(
          `🔗 Fusion de ${
            events.length
          } événements pour "${this.extractFestivalMainName(events[0].name)}"`
        );
      }
    }

    console.log(
      `🔄 Suppression et fusion des doublons: ${matches.length} -> ${merged.length} événements`
    );
    return merged.sort((a, b) => b.matchScore - a.matchScore); // Re-trier par score
  }

  private extractFestivalMainName(fullName: string): string {
    // Nettoyer le nom pour extraire l'essentiel du festival
    return fullName
      .replace(
        /\s*\|\s*(Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday)/gi,
        ""
      )
      .replace(/\s*\|\s*(Pass \d+ days?|Day \d+|Ticket|Parkingticket)/gi, "")
      .replace(
        /\s*-\s*(Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday)/gi,
        ""
      )
      .replace(/\s*\d{4}\s*/gi, " ") // Enlever les années au milieu
      .replace(/\s{2,}/g, " ") // Normaliser les espaces
      .trim();
  }

  private mergeFestivalEvents(events: FestivalMatch[]): FestivalMatch {
    // Prendre l'événement avec le meilleur score comme base
    const bestEvent = events.reduce((best, current) =>
      current.matchScore > best.matchScore ? current : best
    );

    // Collecter toutes les dates
    const allDates = events.map((e) => e.dates.start).sort();
    const earliestDate = allDates[0];
    const latestDate = allDates[allDates.length - 1];

    // Combiner les genres et raisons
    const allGenres = new Set<string>();
    const allReasons = new Set<string>();
    const allArtists = new Set<string>();

    for (const event of events) {
      event.matchingGenres.forEach((g) => allGenres.add(g));
      event.reasons.forEach((r) => allReasons.add(r));
      event.artists.forEach((a) => allArtists.add(a));
    }

    // Calculer le score moyen pondéré
    const averageScore =
      events.reduce((sum, e) => sum + e.matchScore, 0) / events.length;
    const maxScore = Math.max(...events.map((e) => e.matchScore));
    const finalScore = averageScore * 0.7 + maxScore * 0.3; // Favoriser le meilleur score

    // Créer le nom fusionné
    const mainName = this.extractFestivalMainName(bestEvent.name);
    const dayCount = events.length;
    const mergedName =
      dayCount > 1 ? `${mainName} (${dayCount} jours)` : mainName;

    // Prendre le prix le plus bas et le plus haut
    const prices = events.filter((e) => e.priceRange).map((e) => e.priceRange!);
    const mergedPriceRange =
      prices.length > 0
        ? {
            min: Math.min(...prices.map((p) => p.min)),
            max: Math.max(...prices.map((p) => p.max)),
            currency: prices[0].currency,
          }
        : undefined;

    // Créer une description enrichie
    const uniqueDates = [
      ...new Set(allDates.map((d) => new Date(d).toLocaleDateString("fr-FR"))),
    ];
    const dateDescription =
      uniqueDates.length > 1
        ? `Festival multi-jours du ${uniqueDates[0]} au ${
            uniqueDates[uniqueDates.length - 1]
          }`
        : `Événement le ${uniqueDates[0]}`;

    return {
      ...bestEvent,
      name: mergedName,
      description: `${dateDescription}. ${bestEvent.description}`,
      dates: {
        start: earliestDate,
        end: earliestDate !== latestDate ? latestDate : bestEvent.dates.end,
        timezone: bestEvent.dates.timezone,
      },
      matchingGenres: Array.from(allGenres).slice(0, 8), // Limiter à 8 genres
      reasons: Array.from(allReasons).slice(0, 5), // Limiter à 5 raisons
      artists: Array.from(allArtists).slice(0, 10), // Limiter à 10 artistes
      matchScore: Math.min(finalScore, 1.0), // S'assurer que le score ne dépasse pas 1
      priceRange: mergedPriceRange,
    };
  }

  private extractGenresFromPreferences(
    preferences: MusicPreferences
  ): string[] {
    const genreSet = new Set<string>();

    // Extraire les genres des artistes préférés
    for (const artist of preferences.topArtists) {
      for (const genre of artist.genres) {
        genreSet.add(genre);
      }
    }

    // Extraire les genres des top genres
    for (const genre of preferences.topGenres) {
      genreSet.add(genre.genre);
    }

    return Array.from(genreSet);
  }

  private async convertToFestivalMatch(
    recommendation: FestivalRecommendation,
    musicPreferences: MusicPreferences,
    options: FestivalMatchingOptions,
    userLocation?: UserLocation,
    zone?: any
  ): Promise<FestivalMatch | null> {
    try {
      const { event, matchScore, matchingGenres } = recommendation;

      // Vérifier que l'événement a les informations nécessaires
      if (!event.name || !event.dates?.start?.localDate) {
        return null;
      }

      // Extraire les informations de localisation
      const venue = event._embedded?.venues?.[0];
      const location = {
        venue: venue?.name || "Venue non spécifiée",
        city: venue?.city?.name || "Ville non spécifiée",
        country: venue?.country?.name || "Pays non spécifié",
        coordinates:
          venue?.location?.latitude && venue?.location?.longitude
            ? {
                latitude: parseFloat(venue.location.latitude),
                longitude: parseFloat(venue.location.longitude),
              }
            : undefined,
      };

      // Extraire les genres et artistes
      const genres = this.extractEventGenres(event);
      const artists = this.extractEventArtists(event);

      // Calculer le score enrichi avec distance géographique
      const enrichedScore = this.calculateEnrichedScore(
        matchScore,
        event,
        musicPreferences,
        options,
        userLocation,
        zone
      );

      // Générer les raisons du match
      const reasons = this.generateMatchReasons(
        matchingGenres,
        artists,
        musicPreferences
      );

      // Extraire l'image principale
      const image = event.images?.[0]?.url || "";

      // Extraire les informations de prix
      const priceRange = event.priceRanges?.[0]
        ? {
            min: event.priceRanges[0].min,
            max: event.priceRanges[0].max,
            currency: event.priceRanges[0].currency,
          }
        : undefined;

      // Estimer la popularité
      const estimatedPopularity = this.estimatePopularity(event);

      return {
        id: event.id,
        name: event.name,
        description: this.generateEventDescription(
          event,
          matchingGenres,
          artists
        ),
        image,
        location,
        dates: {
          start: event.dates.start.localDate,
          end: event.dates.end?.localDate,
          timezone: event.dates.timezone,
        },
        genres,
        artists,
        matchScore: enrichedScore,
        matchingGenres,
        reasons,
        priceRange,
        ticketUrl: event.url,
        estimatedPopularity,
      };
    } catch (error) {
      console.error("❌ Erreur conversion événement:", error);
      return null;
    }
  }

  private extractEventGenres(event: any): string[] {
    const genres = new Set<string>();

    // Genres de l'événement
    for (const classification of event.classifications || []) {
      if (classification?.segment?.name)
        genres.add(classification.segment.name);
      if (classification?.genre?.name) genres.add(classification.genre.name);
      if (classification?.subGenre?.name)
        genres.add(classification.subGenre.name);
    }

    // Genres des artistes
    if (event._embedded?.attractions) {
      for (const attraction of event._embedded.attractions) {
        for (const classification of attraction.classifications || []) {
          if (classification?.segment?.name)
            genres.add(classification.segment.name);
          if (classification?.genre?.name)
            genres.add(classification.genre.name);
          if (classification?.subGenre?.name)
            genres.add(classification.subGenre.name);
        }
      }
    }

    return Array.from(genres);
  }

  private extractEventArtists(event: any): string[] {
    const artists: string[] = [];

    if (event._embedded?.attractions) {
      for (const attraction of event._embedded.attractions) {
        if (attraction?.name) {
          artists.push(attraction.name);
        }
      }
    }

    return artists;
  }

  private calculateEnrichedScore(
    baseScore: number,
    event: any,
    musicPreferences: MusicPreferences,
    options: FestivalMatchingOptions,
    userLocation?: UserLocation,
    zone?: any
  ): number {
    let score = baseScore;

    // Bonus pour les artistes favoris
    const eventArtists = this.extractEventArtists(event);
    const favoriteArtists = musicPreferences.topArtists.map((a) =>
      a.name.toLowerCase()
    );

    for (const artist of eventArtists) {
      if (favoriteArtists.includes(artist.toLowerCase())) {
        score += 0.3; // Gros bonus pour un artiste favori
      }
    }

    // Bonus pour la popularité si demandé
    if (options.includePopularityBoost) {
      const popularity = this.estimatePopularity(event);
      score += popularity * 0.1;
    }

    // Bonus pour les événements récents/futurs
    const eventDate = new Date(event.dates.start.localDate);
    const now = new Date();
    const daysDiff =
      Math.abs(eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff < 90) {
      // Événement dans les 3 mois
      score += 0.1;
    }

    // Bonus pour les festivals (vs concerts individuels)
    if (
      event.name.toLowerCase().includes("festival") ||
      event.name.toLowerCase().includes("fest") ||
      eventArtists.length > 3
    ) {
      score += 0.15;
    }

    // 🌍 Bonus/malus géographique basé sur la distance
    if (userLocation && event._embedded?.venues?.[0]) {
      const venue = event._embedded.venues[0];
      const eventCountry = venue?.country?.countryCode || "";
      const eventCity = venue?.city?.name || "";

      const distanceScore = geoSearchService.calculateDistanceScore(
        userLocation,
        eventCountry,
        eventCity
      );

      // Appliquer le multiplicateur de la zone
      const zoneMultiplier = zone?.distanceMultiplier || 1.0;
      const geographicBonus = (distanceScore - 0.5) * zoneMultiplier * 0.3; // Max 30% de bonus/malus

      score += geographicBonus;

      console.log(
        `🌍 Score géographique pour ${
          event.name
        } (${eventCity}, ${eventCountry}): ${geographicBonus.toFixed(2)}`
      );
    }

    // Bonus saisonnier
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const eventMonth = new Date(event.dates.start.localDate).getMonth() + 1;

    // Bonus pour les événements dans les 3 prochains mois
    if (eventMonth >= currentMonth && eventMonth <= currentMonth + 3) {
      score += 0.05;
    }

    // Bonus supplémentaire pour l'été (mai-septembre)
    if (eventMonth >= 5 && eventMonth <= 9) {
      score += 0.08;
    }

    return Math.min(score, 1); // Limiter à 1
  }

  private generateMatchReasons(
    matchingGenres: string[],
    artists: string[],
    musicPreferences: MusicPreferences
  ): string[] {
    const reasons: string[] = [];

    if (matchingGenres.length > 0) {
      reasons.push(
        `Genres correspondants: ${matchingGenres.slice(0, 3).join(", ")}`
      );
    }

    if (artists.length > 0) {
      reasons.push(`${artists.length} artistes programmés`);
    }

    // Vérifier si des artistes favoris sont présents
    const favoriteArtists = musicPreferences.topArtists.map((a) =>
      a.name.toLowerCase()
    );
    const matchingArtists = artists.filter((a) =>
      favoriteArtists.includes(a.toLowerCase())
    );

    if (matchingArtists.length > 0) {
      reasons.push(`Artistes favoris: ${matchingArtists.join(", ")}`);
    }

    return reasons;
  }

  private generateEventDescription(
    event: any,
    matchingGenres: string[],
    artists: string[]
  ): string {
    let description = `${event.name}`;

    if (matchingGenres.length > 0) {
      description += ` - ${matchingGenres.slice(0, 2).join(" & ")}`;
    }

    if (artists.length > 0) {
      description += ` avec ${artists.length} artistes`;
      if (artists.length <= 3) {
        description += ` dont ${artists.join(", ")}`;
      }
    }

    return description;
  }

  private estimatePopularity(event: any): number {
    let popularity = 0.5; // Score de base

    // Facteurs de popularité
    if (event.name.toLowerCase().includes("festival")) popularity += 0.2;
    if (event._embedded?.attractions?.length > 5) popularity += 0.1;
    if (event.priceRanges?.[0]?.max > 100) popularity += 0.1;

    // Bonus pour les grandes villes
    const bigCities = [
      "paris",
      "london",
      "new york",
      "los angeles",
      "berlin",
      "madrid",
    ];
    const city = event._embedded?.venues?.[0]?.city?.name?.toLowerCase();
    if (city && bigCities.includes(city)) {
      popularity += 0.1;
    }

    return Math.min(popularity, 1);
  }

  // Méthodes utilitaires pour les filtres
  async searchFestivalsByGenre(
    genres: string[],
    options: FestivalMatchingOptions = {}
  ): Promise<FestivalMatch[]> {
    try {
      const searchFilters: FestivalSearchFilters = {
        genres,
        size: options.maxResults || 20,
        ...options.location,
        ...options.dates,
      };

      const recommendations =
        await ticketmasterService.getFestivalRecommendations(
          genres,
          searchFilters
        );

      const matches: FestivalMatch[] = [];

      for (const recommendation of recommendations) {
        // Créer des préférences musicales basiques pour le matching
        const basicPreferences: MusicPreferences = {
          topArtists: [],
          topTracks: [],
          topGenres: genres.map((g) => ({
            genre: g,
            count: 1,
            percentage: 100 / genres.length,
          })),
          profile: {
            id: "test",
            display_name: "Test User",
            email: "test@example.com",
            country: "US",
            followers: { total: 0 },
            images: [],
            product: "free",
          },
        };

        const match = await this.convertToFestivalMatch(
          recommendation,
          basicPreferences,
          options
        );

        if (match && match.matchScore >= (options.minMatchScore || 0.1)) {
          matches.push(match);
        }
      }

      matches.sort((a, b) => b.matchScore - a.matchScore);
      return matches.slice(0, options.maxResults || 20);
    } catch (error) {
      console.error("❌ Erreur recherche par genre:", error);
      return [];
    }
  }

  async searchFestivalsInLocation(
    location: { countryCode?: string; city?: string; radius?: number },
    options: FestivalMatchingOptions = {}
  ): Promise<FestivalMatch[]> {
    try {
      const searchFilters: FestivalSearchFilters = {
        size: options.maxResults || 20,
        ...location,
        ...options.dates,
      };

      const response = await ticketmasterService.searchFestivals(searchFilters);

      if (!response?._embedded?.events) {
        return [];
      }

      const matches: FestivalMatch[] = [];

      for (const event of response._embedded.events) {
        const recommendation: FestivalRecommendation = {
          event,
          matchScore: 0.5, // Score neutre
          matchingGenres: this.extractEventGenres(event),
        };

        const basicPreferences: MusicPreferences = {
          topArtists: [],
          topTracks: [],
          topGenres: [],
          profile: {
            id: "test",
            display_name: "Test User",
            email: "test@example.com",
            country: "US",
            followers: { total: 0 },
            images: [],
            product: "free",
          },
        };

        const match = await this.convertToFestivalMatch(
          recommendation,
          basicPreferences,
          options
        );

        if (match) {
          matches.push(match);
        }
      }

      matches.sort((a, b) => b.estimatedPopularity - a.estimatedPopularity);
      return matches.slice(0, options.maxResults || 20);
    } catch (error) {
      console.error("❌ Erreur recherche par localisation:", error);
      return [];
    }
  }
}

export const festivalMatcher = new FestivalMatcher();
