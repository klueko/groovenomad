import { FestivalSearchFilters } from "./ticketmaster-service";

export interface UserLocation {
  country: string;
  countryCode: string;
  city?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface SearchZone {
  name: string;
  description: string;
  countries: string[];
  distanceMultiplier: number; // Pour le scoring
  priority: number; // 1 = plus prioritaire
}

export interface GeoSearchResult<T> {
  items: T[];
  zone: SearchZone;
  totalFound: number;
}

class GeoSearchService {
  // Zones de recherche concentriques
  private readonly searchZones: SearchZone[] = [
    {
      name: "local",
      description: "Ville et région proche",
      countries: [], // Sera rempli dynamiquement
      distanceMultiplier: 1.0,
      priority: 1,
    },
    {
      name: "national",
      description: "Pays d'origine",
      countries: [], // Sera rempli dynamiquement
      distanceMultiplier: 0.8,
      priority: 2,
    },
    {
      name: "regional_europe",
      description: "Europe de l'Ouest",
      countries: ["FR", "BE", "NL", "DE", "CH", "AT", "IT", "ES", "PT"],
      distanceMultiplier: 0.6,
      priority: 3,
    },
    {
      name: "europe_extended",
      description: "Europe élargie",
      countries: [
        "GB",
        "IE",
        "DK",
        "SE",
        "NO",
        "FI",
        "PL",
        "CZ",
        "HU",
        "HR",
        "SI",
      ],
      distanceMultiplier: 0.4,
      priority: 4,
    },
    {
      name: "international",
      description: "International (USA, Canada, Australie)",
      countries: ["US", "CA", "AU", "NZ"],
      distanceMultiplier: 0.2,
      priority: 5,
    },
  ];

  // Base de données des principales villes européennes avec coordonnées
  private readonly majorCities: Record<
    string,
    Record<string, { lat: number; lon: number }>
  > = {
    // France
    FR: {
      Paris: { lat: 48.8566, lon: 2.3522 },
      Lyon: { lat: 45.764, lon: 4.8357 },
      Marseille: { lat: 43.2965, lon: 5.3698 },
      Toulouse: { lat: 43.6047, lon: 1.4442 },
      Nice: { lat: 43.7102, lon: 7.262 },
      Nantes: { lat: 47.2184, lon: -1.5536 },
      Strasbourg: { lat: 48.5734, lon: 7.7521 },
      Montpellier: { lat: 43.611, lon: 3.8767 },
      Bordeaux: { lat: 44.8378, lon: -0.5792 },
    },
    // Allemagne
    DE: {
      Berlin: { lat: 52.52, lon: 13.405 },
      Munich: { lat: 48.1351, lon: 11.582 },
      Hamburg: { lat: 53.5511, lon: 9.9937 },
      Cologne: { lat: 50.9375, lon: 6.9603 },
      Frankfurt: { lat: 50.1109, lon: 8.6821 },
    },
    // Royaume-Uni
    GB: {
      London: { lat: 51.5074, lon: -0.1278 },
      Manchester: { lat: 53.4808, lon: -2.2426 },
      Birmingham: { lat: 52.4862, lon: -1.8904 },
      Leeds: { lat: 53.8008, lon: -1.5491 },
      Glasgow: { lat: 55.8642, lon: -4.2518 },
    },
    // Espagne
    ES: {
      Madrid: { lat: 40.4168, lon: -3.7038 },
      Barcelona: { lat: 41.3851, lon: 2.1734 },
      Valencia: { lat: 39.4699, lon: -0.3763 },
      Seville: { lat: 37.3891, lon: -5.9845 },
      Bilbao: { lat: 43.2627, lon: -2.9253 },
    },
    // Italie
    IT: {
      Rome: { lat: 41.9028, lon: 12.4964 },
      Milan: { lat: 45.4642, lon: 9.19 },
      Naples: { lat: 40.8518, lon: 14.2681 },
      Turin: { lat: 45.0703, lon: 7.6869 },
      Florence: { lat: 43.7696, lon: 11.2558 },
    },
    // Pays-Bas
    NL: {
      Amsterdam: { lat: 52.3676, lon: 4.9041 },
      Rotterdam: { lat: 51.9244, lon: 4.4777 },
      "The Hague": { lat: 52.0705, lon: 4.3007 },
      Utrecht: { lat: 52.0907, lon: 5.1214 },
    },
    // Belgique
    BE: {
      Brussels: { lat: 50.8503, lon: 4.3517 },
      Antwerp: { lat: 51.2194, lon: 4.4025 },
      Ghent: { lat: 51.0543, lon: 3.7174 },
    },
  };

  /**
   * Détermine la localisation de l'utilisateur basée sur son profil Spotify
   */
  async getUserLocation(spotifyProfile: any): Promise<UserLocation> {
    // Pour l'instant, on utilise le pays du profil Spotify
    const countryCode = spotifyProfile?.country || "FR";
    const location: UserLocation = {
      country: this.getCountryName(countryCode),
      countryCode: countryCode,
    };

    // Essayer de déterminer la ville principale du pays
    if (this.majorCities[countryCode as keyof typeof this.majorCities]) {
      const cities =
        this.majorCities[countryCode as keyof typeof this.majorCities];
      const cityNames = Object.keys(cities);
      if (cityNames.length > 0) {
        // Prendre la première ville (souvent la capitale)
        const mainCity = cityNames[0];
        const coords = cities[mainCity as keyof typeof cities];
        location.city = mainCity;
        location.coordinates = {
          latitude: coords.lat,
          longitude: coords.lon,
        };
      }
    }

    console.log("📍 Localisation utilisateur déterminée:", location);
    return location;
  }

  /**
   * Crée les zones de recherche personnalisées basées sur la localisation
   */
  createPersonalizedSearchZones(userLocation: UserLocation): SearchZone[] {
    const zones = [...this.searchZones];

    // Zone locale : pays + pays voisins
    zones[0].countries = [userLocation.countryCode];
    if (userLocation.city) {
      zones[0].description = `${userLocation.city} et région`;
    }

    // Zone nationale
    zones[1].countries = [userLocation.countryCode];
    zones[1].description = `${userLocation.country}`;

    return zones;
  }

  /**
   * Effectue une recherche concentrique en partant de la localisation utilisateur
   */
  async performConcentricSearch<T>(
    userLocation: UserLocation,
    searchFunction: (filters: FestivalSearchFilters) => Promise<T[]>,
    baseFilters: Omit<FestivalSearchFilters, "countryCode"> = {}
  ): Promise<GeoSearchResult<T>[]> {
    const results: GeoSearchResult<T>[] = [];
    const zones = this.createPersonalizedSearchZones(userLocation);

    console.log("🎯 Début de la recherche concentrique...");

    for (const zone of zones) {
      console.log(
        `🔍 Recherche dans la zone: ${zone.name} (${zone.description})`
      );

      // Chercher dans chaque pays de la zone
      for (const countryCode of zone.countries) {
        try {
          const filters: FestivalSearchFilters = {
            ...baseFilters,
            countryCode,
          };

          const items = await searchFunction(filters);

          if (items.length > 0) {
            results.push({
              items,
              zone,
              totalFound: items.length,
            });

            console.log(
              `✅ ${items.length} événements trouvés en ${countryCode}`
            );
          }
        } catch (error) {
          console.error(`❌ Erreur recherche ${countryCode}:`, error);
        }

        // Petit délai pour éviter de surcharger l'API
        await this.delay(100);
      }

      // Si on a trouvé des résultats dans cette zone, on peut arrêter ou continuer selon les besoins
      const totalInZone = results
        .filter((r) => r.zone.name === zone.name)
        .reduce((sum, r) => sum + r.totalFound, 0);

      if (totalInZone >= 20) {
        console.log(
          `🎉 Assez de résultats trouvés dans ${zone.name}, arrêt des recherches étendues`
        );
        break;
      }
    }

    return results;
  }

  /**
   * Calcule la distance entre deux points géographiques (en km)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  }

  /**
   * Score un événement basé sur sa distance géographique
   */
  calculateDistanceScore(
    userLocation: UserLocation,
    eventCountry: string,
    eventCity?: string
  ): number {
    // Score de base selon le pays
    let baseScore = 0.5;

    if (eventCountry === userLocation.countryCode) {
      baseScore = 1.0; // Même pays
    } else {
      // Chercher dans quelle zone se trouve le pays de l'événement
      const zones = this.createPersonalizedSearchZones(userLocation);
      for (const zone of zones) {
        if (zone.countries.includes(eventCountry)) {
          baseScore = zone.distanceMultiplier;
          break;
        }
      }
    }

    // Bonus si on peut calculer la distance exacte
    if (
      userLocation.coordinates &&
      eventCity &&
      this.majorCities[eventCountry as keyof typeof this.majorCities]
    ) {
      const cities =
        this.majorCities[eventCountry as keyof typeof this.majorCities];
      const eventCityCoords = cities[eventCity as keyof typeof cities];

      if (eventCityCoords) {
        const distance = this.calculateDistance(
          userLocation.coordinates.latitude,
          userLocation.coordinates.longitude,
          eventCityCoords.lat,
          eventCityCoords.lon
        );

        // Ajuster le score selon la distance
        if (distance < 100) baseScore += 0.2;
        else if (distance < 300) baseScore += 0.1;
        else if (distance < 500) baseScore += 0.05;

        console.log(
          `📏 Distance ${userLocation.city} -> ${eventCity}: ${Math.round(
            distance
          )}km (score: +${baseScore > 1 ? (baseScore - 1).toFixed(2) : "0"})`
        );
      }
    }

    return Math.min(baseScore, 1.0);
  }

  /**
   * Obtient les villes recommandées pour la recherche selon la localisation
   */
  getRecommendedCities(userLocation: UserLocation): string[] {
    const cities: string[] = [];

    // Ajouter les villes du pays de l'utilisateur
    if (
      this.majorCities[
        userLocation.countryCode as keyof typeof this.majorCities
      ]
    ) {
      const countryCities = Object.keys(
        this.majorCities[
          userLocation.countryCode as keyof typeof this.majorCities
        ]
      );
      cities.push(...countryCities);
    }

    // Ajouter les grandes villes européennes proches
    const zones = this.createPersonalizedSearchZones(userLocation);
    for (const zone of zones.slice(0, 2)) {
      // Juste les 2 premières zones
      for (const countryCode of zone.countries) {
        if (this.majorCities[countryCode as keyof typeof this.majorCities]) {
          const countryCities = Object.keys(
            this.majorCities[countryCode as keyof typeof this.majorCities]
          );
          cities.push(...countryCities.slice(0, 2)); // Prendre les 2 premières villes
        }
      }
    }

    return [...new Set(cities)]; // Éliminer les doublons
  }

  // Méthodes utilitaires
  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getCountryName(countryCode: string): string {
    const countries: Record<string, string> = {
      FR: "France",
      DE: "Allemagne",
      GB: "Royaume-Uni",
      ES: "Espagne",
      IT: "Italie",
      BE: "Belgique",
      NL: "Pays-Bas",
      CH: "Suisse",
      AT: "Autriche",
      PT: "Portugal",
      IE: "Irlande",
      DK: "Danemark",
      SE: "Suède",
      NO: "Norvège",
      FI: "Finlande",
      PL: "Pologne",
      CZ: "République tchèque",
      HU: "Hongrie",
      US: "États-Unis",
      CA: "Canada",
      AU: "Australie",
      NZ: "Nouvelle-Zélande",
    };

    return countries[countryCode] || countryCode;
  }
}

export const geoSearchService = new GeoSearchService();
