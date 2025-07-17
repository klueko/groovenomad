import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  Dimensions,
  TextInput,
  Alert,
  Keyboard,
} from 'react-native';
import axios from 'axios';
import { Link } from 'expo-router';

const { width } = Dimensions.get('window');

interface HotelOffer {
  type: string;
  hotel: {
    type: string;
    hotelId: string;
    chainCode?: string;
    dupeId?: string;
    name: string;
    cityCode: string;
    latitude?: number;
    longitude?: number;
  };
  available: boolean;
  offers: Array<{
    id: string;
    checkInDate: string;
    checkOutDate: string;
    rateCode: string;
    rateFamilyEstimated?: {
      code: string;
      type: string;
    };
    room: {
      type: string;
      typeEstimated: {
        category: string;
        beds: number;
        bedType: string;
      };
      description: {
        text: string;
        lang: string;
      };
    };
    guests: {
      adults: number;
    };
    price: {
      currency: string;
      base: string;
      total: string;
      variations?: {
        average: {
          base: string;
        };
        changes: Array<{
          startDate: string;
          endDate: string;
          total: string;
        }>;
      };
    };
    policies: {
      paymentType: string;
      cancellation: {
        description: {
          text: string;
        };
        type: string;
      };
    };
    self: string;
  }>;
  self: string;
}

interface HotelSearchResponse {
  data: HotelOffer[];
  meta?: {
    count: number;
  };
}

export default function HotelsPage() {
  const [hotels, setHotels] = useState<HotelOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelOffer | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const cityInputRef = useRef<TextInput>(null);
  
  const [cityName, setCityName] = useState('London');
  const [cityCode, setCityCode] = useState('LON');
  const [checkInDate, setCheckInDate] = useState('2025-09-15');
  const [checkOutDate, setCheckOutDate] = useState('2025-09-20');
  const [adults, setAdults] = useState(1);
  const [roomQuantity, setRoomQuantity] = useState(1);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [priceRange, setPriceRange] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [boardType, setBoardType] = useState('ROOM_ONLY');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [keepKeyboardOpen, setKeepKeyboardOpen] = useState(false);
  const [sortBy, setSortBy] = useState('RECOMMENDED');
  
  const cityToCode: { [key: string]: string } = {
    'Paris': 'PAR',
    'New York': 'NYC',
    'London': 'LON',
    'Tokyo': 'TYO',
    'Los Angeles': 'LAX',
    'Chicago': 'CHI',
    'Miami': 'MIA',
    'Barcelona': 'BCN',
    'Rome': 'ROM',
    'Amsterdam': 'AMS',
    'Berlin': 'BER',
    'Madrid': 'MAD',
    'Toronto': 'YYZ',
    'Sydney': 'SYD',
    'Dubai': 'DXB',
    'Singapore': 'SIN',
    'Hong Kong': 'HKG',
    'Seoul': 'SEL',
    'Bangkok': 'BKK',
    'Istanbul': 'IST',
    'Vienna': 'VIE',
    'Prague': 'PRG',
    'Budapest': 'BUD',
    'Warsaw': 'WAW',
    'Stockholm': 'STO',
    'Copenhagen': 'CPH',
    'Oslo': 'OSL',
    'Helsinki': 'HEL',
    'Zurich': 'ZRH',
    'Geneva': 'GVA',
    'Brussels': 'BRU',
    'Luxembourg': 'LUX',
    'Dublin': 'DUB',
    'Edinburgh': 'EDI',
    'Glasgow': 'GLA',
    'Manchester': 'MAN',
    'Birmingham': 'BHX',
    'Liverpool': 'LPL',
    'Bristol': 'BRS',
    'Newcastle': 'NCL',
    'Leeds': 'LBA',
    'Sheffield': 'SZD',
    'Nottingham': 'EMA',
    'Cardiff': 'CWL',
    'Belfast': 'BFS',
    'Aberdeen': 'ABZ',
    'Inverness': 'INV',
    'Southampton': 'SOU',
    'Bournemouth': 'BOH',
    'Exeter': 'EXT',
    'Plymouth': 'PLH',
    'Norwich': 'NWI',
    'Cambridge': 'CBG',
    'Oxford': 'OXF',
    'Reading': 'RDG',
    'Luton': 'LTN',
    'Stansted': 'STN',
    'Gatwick': 'LGW',
    'Heathrow': 'LHR',
    'City': 'LCY',
  };

  const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
    'London': { lat: 51.5074, lng: -0.1278 },
    'Paris': { lat: 48.8566, lng: 2.3522 },
    'New York': { lat: 40.7128, lng: -74.0060 },
    'Tokyo': { lat: 35.6762, lng: 139.6503 },
    'Barcelona': { lat: 41.3851, lng: 2.1734 },
    'Rome': { lat: 41.9028, lng: 12.4964 },
    'Amsterdam': { lat: 52.3676, lng: 4.9041 },
    'Berlin': { lat: 52.5200, lng: 13.4050 },
    'Madrid': { lat: 40.4168, lng: -3.7038 },
    'Vienna': { lat: 48.2082, lng: 16.3738 },
    'Los Angeles': { lat: 34.0522, lng: -118.2437 },
    'Chicago': { lat: 41.8781, lng: -87.6298 },
    'Miami': { lat: 25.7617, lng: -80.1918 },
    'Toronto': { lat: 43.6532, lng: -79.3832 },
    'Sydney': { lat: -33.8688, lng: 151.2093 },
    'Dubai': { lat: 25.2048, lng: 55.2708 },
    'Singapore': { lat: 1.3521, lng: 103.8198 },
    'Hong Kong': { lat: 22.3193, lng: 114.1694 },
    'Seoul': { lat: 37.5665, lng: 126.9780 },
    'Bangkok': { lat: 13.7563, lng: 100.5018 },
    'Istanbul': { lat: 41.0082, lng: 28.9784 },
  };

  const getCityCoordinates = async (cityName: string) => {
    const knownCity = Object.keys(cityCoordinates).find(city => 
      city.toLowerCase() === cityName.toLowerCase()
    );
    
    if (knownCity) {
      return cityCoordinates[knownCity];
    }
    
    try {
      const geocodeResponse = await axios.get(`https://api.opencagedata.com/geocode/v1/json`, {
        params: {
          q: cityName,
          key: 'YOUR_OPENCAGE_API_KEY',
          limit: 1,
        },
      });
      
      if (geocodeResponse.data.results && geocodeResponse.data.results.length > 0) {
        const { lat, lng } = geocodeResponse.data.results[0].geometry;
        return { lat, lng };
      }
    } catch (error) {
      console.log('Geocoding failed, using default coordinates');
    }
    
    return { lat: 40.730610, lng: -73.935242 };
  };

  const parsePriceRange = (priceRange: string) => {
    if (!priceRange.trim()) return { min: 0, max: 0 };
    
    if (priceRange.includes('-')) {
      const parts = priceRange.split('-');
      return {
        min: parseInt(parts[0]) || 0,
        max: parseInt(parts[1]) || 0
      };
    } else if (priceRange.startsWith('-')) {
      return {
        min: 0,
        max: parseInt(priceRange.substring(1)) || 0
      };
    } else if (priceRange.endsWith('-')) {
      return {
        min: parseInt(priceRange.substring(0, priceRange.length - 1)) || 0,
        max: 0
      };
    } else {
      const price = parseInt(priceRange);
      return {
        min: price || 0,
        max: price || 0
      };
    }
  };

  const generateMockHotels = (
    cityName: string, 
    coordinates: { lat: number; lng: number }, 
    checkInDate: string, 
    checkOutDate: string, 
    adults: number, 
    currency: string
  ): HotelOffer[] => {
    const hotelNames = [
      `${cityName} Grand Hotel`,
      `${cityName} Plaza`,
      `${cityName} Central Hotel`,
      `${cityName} Luxury Resort`,
      `${cityName} Business Center`,
      `${cityName} Boutique Hotel`,
      `${cityName} Garden Inn`,
      `${cityName} Royal Hotel`,
      `${cityName} Modern Suites`,
      `${cityName} Classic Inn`,
      `${cityName} Premium Hotel`,
      `${cityName} Comfort Lodge`,
      `${cityName} Executive Hotel`,
      `${cityName} Heritage Inn`,
      `${cityName} Contemporary Hotel`
    ];

    const roomTypes = [
      'Standard Room',
      'Deluxe Room',
      'Executive Suite',
      'Premium Suite',
      'Business Room',
      'Family Room',
      'Luxury Suite',
      'Garden View Room',
      'City View Room',
      'Presidential Suite'
    ];

    const descriptions = [
      'Chambre confortable avec vue sur la ville',
      'Suite spacieuse avec tous les équipements modernes',
      'Chambre élégante avec décoration contemporaine',
      'Suite de luxe avec vue panoramique',
      'Chambre d\'affaires avec espace de travail',
      'Suite familiale avec espace de vie séparé',
      'Chambre premium avec service personnalisé',
      'Suite avec vue sur le jardin',
      'Chambre moderne avec technologie avancée',
      'Suite présidentielle avec service VIP'
    ];

    const nights = calculateNights(checkInDate, checkOutDate);
    
    return hotelNames.map((name, index) => {
      const basePrice = Math.floor(Math.random() * 200) + 80;
      const totalPrice = basePrice * nights;
      const roomType = roomTypes[index % roomTypes.length];
      const description = descriptions[index % descriptions.length];
      
      return {
        type: 'hotel-offers',
        hotel: {
          type: 'hotel',
          hotelId: `mock-hotel-${index}`,
          name: name,
          cityCode: cityCode,
          latitude: coordinates.lat + (Math.random() - 0.5) * 0.01,
          longitude: coordinates.lng + (Math.random() - 0.5) * 0.01,
        },
        available: true,
        offers: [{
          id: `mock-offer-${index}`,
          checkInDate: checkInDate,
          checkOutDate: checkOutDate,
          rateCode: 'STANDARD',
          room: {
            type: roomType,
            typeEstimated: {
              category: roomType,
              beds: Math.floor(Math.random() * 2) + 1,
              bedType: Math.random() > 0.5 ? 'Double' : 'Queen',
            },
            description: {
              text: description,
              lang: 'FR',
            },
          },
          guests: {
            adults: adults,
          },
          price: {
            currency: currency,
            base: basePrice.toString(),
            total: totalPrice.toString(),
          },
          policies: {
            paymentType: 'NONE',
            cancellation: {
              description: {
                text: 'Annulation gratuite jusqu\'à 24h avant l\'arrivée',
              },
              type: 'FREE_CANCELLATION',
            },
          },
          self: '',
        }],
        self: '',
      };
    });
  };

  const searchHotels = async () => {
    if (!cityName || !checkInDate || !checkOutDate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    if (checkIn < today) {
      Alert.alert('Erreur', 'La date d\'arrivée doit être aujourd\'hui ou dans le futur');
      return;
    }
    
    if (checkOut <= checkIn) {
      Alert.alert('Erreur', 'La date de départ doit être après la date d\'arrivée');
      return;
    }

    const daysDifference = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDifference < 1) {
      Alert.alert('Erreur', 'La durée du séjour doit être d\'au moins 1 jour');
      return;
    }

    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (checkIn > oneYearFromNow) {
      Alert.alert('Erreur', 'La date d\'arrivée ne peut pas être plus de 1 an dans le futur');
      return;
    }

    setLoading(true);
    try {
      console.log(`Searching hotels for city: ${cityName}`);
      
      const coordinates = await getCityCoordinates(cityName);
      console.log(`Using coordinates for ${cityName}:`, coordinates);
      
      const { min: priceMin, max: priceMax } = parsePriceRange(priceRange);
      console.log(`Price range: ${priceMin} - ${priceMax}`);
      
      let hotels = [];
      let apiError = null;
      
      try {
        console.log('Trying TripAdvisor API...');
        const tripAdvisorResponse = await axios.get('https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotelsByLocation', {
          headers: {
            'x-rapidapi-host': 'tripadvisor16.p.rapidapi.com',
            'x-rapidapi-key': 'e44420e1a9msh8e911daf1c413d6p1595bbjsn039c0a7faf40',
          },
          params: {
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            pageNumber: 1,
            adults: adults,
            rooms: roomQuantity,
            currencyCode: currency,
            sort: sortBy,
            rating: 0,
            priceMin: priceMin || undefined,
            priceMax: priceMax || undefined,
          },
          timeout: 10000,
        });

        console.log('TripAdvisor API response:', tripAdvisorResponse.data);
        
        if (tripAdvisorResponse.data.status === false) {
          throw new Error('TripAdvisor API returned error: ' + tripAdvisorResponse.data.message);
        }
        
        if (tripAdvisorResponse.data.data && tripAdvisorResponse.data.data.hotels) {
          const tripAdvisorHotels = tripAdvisorResponse.data.data.hotels;
          console.log('Found hotels from TripAdvisor:', tripAdvisorHotels.length);
          
          hotels = tripAdvisorHotels.map((hotel: any) => ({
            type: 'hotel-offers',
            hotel: {
              type: 'hotel',
              hotelId: hotel.hotelId || hotel.id || `hotel-${Math.random()}`,
              name: hotel.name || hotel.title || 'Hôtel sans nom',
              cityCode: cityCode,
              latitude: hotel.latitude || coordinates.lat,
              longitude: hotel.longitude || coordinates.lng,
            },
            available: true,
            offers: [{
              id: hotel.hotelId || hotel.id || `offer-${Math.random()}`,
              checkInDate: checkInDate,
              checkOutDate: checkOutDate,
              rateCode: 'STANDARD',
              room: {
                type: 'Standard Room',
                typeEstimated: {
                  category: hotel.roomType || hotel.category || 'Standard',
                  beds: 1,
                  bedType: 'Double',
                },
                description: {
                  text: hotel.description || hotel.summary || 'Chambre standard confortable',
                  lang: 'FR',
                },
              },
              guests: {
                adults: adults,
              },
              price: {
                currency: hotel.currency || currency,
                base: hotel.price?.base || hotel.price?.amount || hotel.price || '0',
                total: hotel.price?.total || hotel.price?.amount || hotel.price || '0',
              },
              policies: {
                paymentType: 'NONE',
                cancellation: {
                  description: {
                    text: 'Politique d\'annulation standard',
                  },
                  type: 'STANDARD',
                },
              },
              self: '',
            }],
            self: '',
          }));
        }
      } catch (tripAdvisorError: any) {
        console.error('TripAdvisor API failed:', tripAdvisorError.response?.data || tripAdvisorError.message);
        apiError = tripAdvisorError;
      }
      
      if (hotels.length === 0) {
        console.log('TripAdvisor API failed, using fallback data...');
        
        const mockHotels = generateMockHotels(cityName, coordinates, checkInDate, checkOutDate, adults, currency);
        hotels = mockHotels;
      }
      
      if (hotels.length > 0) {
        setHotels(hotels);
      } else {
        Alert.alert(
          'Aucun hôtel trouvé', 
          `Aucun hôtel disponible pour "${cityName}" avec les critères sélectionnés.`
        );
        setHotels([]);
      }
    } catch (err: any) {
      console.error('Hotel search error:', err.response?.data || err.message);
      
      const coordinates = await getCityCoordinates(cityName);
      const mockHotels = generateMockHotels(cityName, coordinates, checkInDate, checkOutDate, adults, currency);
      setHotels(mockHotels);
      
      Alert.alert(
        'Mode démonstration', 
        'Nous utilisons des données de démonstration. Les vrais prix et disponibilités peuvent différer.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateNights = (checkIn: string, checkOut: string): number => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const openHotelDetails = (hotel: HotelOffer) => {
    setSelectedHotel(hotel);
    setModalVisible(true);
  };

  const toggleFavorite = (hotelId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(hotelId)) {
      newFavorites.delete(hotelId);
    } else {
      newFavorites.add(hotelId);
    }
    setFavorites(newFavorites);
  };

  const renderStars = (rating: number = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={[styles.star, { color: i <= rating ? '#FFD700' : '#4A4A4A' }]}>
          ★
        </Text>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const closeSuggestions = () => {
    setShowCitySuggestions(false);
  };

  const SearchForm: React.FC = () => {
    const filteredCities = Object.keys(cityToCode).filter(city =>
      city.toLowerCase().includes(cityName.toLowerCase())
    );

    const popularCities = [
      'London', 'Paris', 'New York', 'Tokyo', 'Barcelona', 
      'Rome', 'Amsterdam', 'Berlin', 'Madrid', 'Vienna'
    ];

    return (
      <View style={styles.searchContainer}>
        <Text style={styles.searchTitle}>Rechercher un hôtel</Text>
        
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Ville</Text>
            <TextInput
              style={styles.input}
              value={cityName}
              onChangeText={(text) => {
                setCityName(text);
                setShowCitySuggestions(true);
              }}
              placeholder="Entrez le nom de la ville"
              placeholderTextColor="#8E8E93"
              onFocus={() => setShowCitySuggestions(true)}
              blurOnSubmit={false}
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="search"
              ref={cityInputRef}
            />
            {showCitySuggestions && filteredCities.length > 0 && cityName.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {filteredCities.slice(0, 8).map((city) => (
                  <Pressable
                    key={city}
                    style={({ pressed }) => [
                      styles.suggestionItem,
                      pressed && styles.suggestionItemPressed
                    ]}
                    onPress={() => {
                      setCityName(city);
                      setShowCitySuggestions(false);
                      setTimeout(() => {
                        cityInputRef.current?.focus();
                      }, 100);
                    }}
                  >
                    <View style={styles.suggestionContent}>
                      <Text style={styles.suggestionText}>{city}</Text>
                      <Text style={styles.suggestionCode}>{cityToCode[city]}</Text>
                    </View>
                  </Pressable>
                ))}
                {filteredCities.length > 8 && (
                  <View style={styles.suggestionMore}>
                    <Text style={styles.suggestionMoreText}>
                      +{filteredCities.length - 8} autres villes
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Date d'arrivée</Text>
            <TextInput
              style={styles.input}
              value={checkInDate}
              onChangeText={setCheckInDate}
              placeholder="2025-09-15"
              placeholderTextColor="#8E8E93"
              onFocus={closeSuggestions}
              blurOnSubmit={false}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Date de départ</Text>
            <TextInput
              style={styles.input}
              value={checkOutDate}
              onChangeText={setCheckOutDate}
              placeholder="2025-09-20"
              placeholderTextColor="#8E8E93"
              onFocus={closeSuggestions}
              blurOnSubmit={false}
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Voyageurs</Text>
            <TextInput
              style={styles.input}
              value={adults.toString()}
              onChangeText={(text) => setAdults(parseInt(text) || 1)}
              placeholder="1"
              placeholderTextColor="#8E8E93"
              keyboardType="numeric"
              onFocus={closeSuggestions}
              blurOnSubmit={false}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Chambres</Text>
            <TextInput
              style={styles.input}
              value={roomQuantity.toString()}
              onChangeText={(text) => setRoomQuantity(parseInt(text) || 1)}
              placeholder="1"
              placeholderTextColor="#8E8E93"
              keyboardType="numeric"
              onFocus={closeSuggestions}
              blurOnSubmit={false}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.searchButton}
          onPress={searchHotels}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>Rechercher</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.advancedToggleButton}
          onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
        >
          <Text style={styles.advancedToggleText}>
            {showAdvancedOptions ? 'Masquer' : 'Afficher'} les options avancées
          </Text>
        </TouchableOpacity>

        {showAdvancedOptions && (
          <View style={styles.advancedOptionsContainer}>
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Fourchette de prix</Text>
                <TextInput
                  style={styles.input}
                  value={priceRange}
                  onChangeText={setPriceRange}
                  placeholder="100-300 ou -300"
                  placeholderTextColor="#8E8E93"
                  onFocus={closeSuggestions}
                  blurOnSubmit={false}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Devise</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[styles.pickerButton, currency === 'EUR' && styles.pickerButtonActive]}
                    onPress={() => setCurrency('EUR')}
                  >
                    <Text style={[styles.pickerButtonText, currency === 'EUR' && styles.pickerButtonTextActive]}>
                      EUR
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerButton, currency === 'USD' && styles.pickerButtonActive]}
                    onPress={() => setCurrency('USD')}
                  >
                    <Text style={[styles.pickerButtonText, currency === 'USD' && styles.pickerButtonTextActive]}>
                      USD
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerButton, currency === 'GBP' && styles.pickerButtonActive]}
                    onPress={() => setCurrency('GBP')}
                  >
                    <Text style={[styles.pickerButtonText, currency === 'GBP' && styles.pickerButtonTextActive]}>
                      GBP
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Type de pension</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[styles.pickerButton, boardType === 'ROOM_ONLY' && styles.pickerButtonActive]}
                    onPress={() => setBoardType('ROOM_ONLY')}
                  >
                    <Text style={[styles.pickerButtonText, boardType === 'ROOM_ONLY' && styles.pickerButtonTextActive]}>
                      Chambre
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerButton, boardType === 'BREAKFAST' && styles.pickerButtonActive]}
                    onPress={() => setBoardType('BREAKFAST')}
                  >
                    <Text style={[styles.pickerButtonText, boardType === 'BREAKFAST' && styles.pickerButtonTextActive]}>
                      Petit-déj
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Trier par</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[styles.pickerButton, sortBy === 'RECOMMENDED' && styles.pickerButtonActive]}
                    onPress={() => setSortBy('RECOMMENDED')}
                  >
                    <Text style={[styles.pickerButtonText, sortBy === 'RECOMMENDED' && styles.pickerButtonTextActive]}>
                      Recommandé
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerButton, sortBy === 'PRICE' && styles.pickerButtonActive]}
                    onPress={() => setSortBy('PRICE')}
                  >
                    <Text style={[styles.pickerButtonText, sortBy === 'PRICE' && styles.pickerButtonTextActive]}>
                      Prix
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerButton, sortBy === 'RATING' && styles.pickerButtonActive]}
                    onPress={() => setSortBy('RATING')}
                  >
                    <Text style={[styles.pickerButtonText, sortBy === 'RATING' && styles.pickerButtonTextActive]}>
                      Note
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.popularCitiesContainer}>
          <Text style={styles.popularCitiesTitle}>Villes populaires</Text>
          <View style={styles.popularCitiesList}>
            {popularCities.map((city) => (
              <TouchableOpacity
                key={city}
                style={styles.popularCityButton}
                onPress={() => {
                  setCityName(city);
                  setShowCitySuggestions(false);
                }}
              >
                <Text style={styles.popularCityText}>{city}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.helpText}>
            Tapez le nom d'une ville ou choisissez dans la liste. TripAdvisor vous donnera de nombreux résultats d'hôtels !
          </Text>
        </View>
      </View>
    );
  };

  const HotelCard: React.FC<{ hotel: HotelOffer; index: number }> = ({ hotel, index }) => {
    if (!hotel || !hotel.hotel) {
      console.warn('Invalid hotel object:', hotel);
      return null;
    }
    
    const offer = hotel.offers?.[0];
    const hotelId = hotel.hotel.hotelId || `hotel-${index}`;
    const isFavorite = favorites.has(hotelId);
    const nights = calculateNights(checkInDate, checkOutDate);

    return (
      <TouchableOpacity
        style={styles.hotelCard}
        activeOpacity={0.8}
        onPress={() => openHotelDetails(hotel)}
      >
        <View style={styles.hotelHeader}>
          <View style={styles.hotelInfo}>
            <Text style={styles.hotelName}>{hotel.hotel.name || 'Hôtel sans nom'}</Text>
            {renderStars(4)}
            <Text style={styles.distanceText}>
              {hotel.hotel.cityCode || 'N/A'} • {hotel.available ? 'Disponible' : 'Non disponible'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(hotelId)}
          >
            <Text style={[styles.favoriteIcon, { color: isFavorite ? '#FF4757' : '#8E8E93' }]}>
              {isFavorite ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
        </View>

        {offer && (
          <View style={styles.offerSection}>
            <View style={styles.roomInfo}>
              <Text style={styles.roomType}>
                {offer.room?.typeEstimated?.category || offer.room?.type || 'Type de chambre non spécifié'}
              </Text>
              <Text style={styles.roomDescription}>
                {offer.room?.description?.text || 'Description non disponible'}
              </Text>
            </View>

            <View style={styles.priceSection}>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>
                  {offer.price?.currency || 'EUR'} {offer.price?.total || 'N/A'}
                </Text>
                <Text style={styles.priceLabel}>pour {nights} nuit(s)</Text>
                <Text style={styles.pricePerNight}>
                  {offer.price?.currency || 'EUR'} {offer.price?.total ? Math.round(parseFloat(offer.price.total) / nights) : 'N/A'} par nuit
                </Text>
              </View>
            </View>

            <View style={styles.policiesSection}>
              <Text style={styles.policyText}>
                {offer.policies?.cancellation?.type === 'FREE_CANCELLATION' 
                  ? '✅ Annulation gratuite' 
                  : offer.policies?.cancellation?.description?.text || 'Politique d\'annulation non spécifiée'}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const HotelDetailsModal: React.FC = () => {
    if (!selectedHotel || !selectedHotel.hotel) return null;

    const offer = selectedHotel.offers?.[0];
    const nights = calculateNights(checkInDate, checkOutDate);

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails de l'hôtel</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.modalHotelInfo}>
                <Text style={styles.modalHotelName}>
                  {selectedHotel.hotel.name || 'Hôtel sans nom'}
                </Text>
                {renderStars(4)}
                <Text style={styles.modalDistance}>
                  {selectedHotel.hotel.cityCode || 'N/A'} • {selectedHotel.available ? 'Disponible' : 'Non disponible'}
                </Text>
              </View>

              {offer && (
                <View style={styles.modalOfferSection}>
                  <Text style={styles.modalSectionTitle}>Offre sélectionnée</Text>
                  <View style={styles.modalPriceSection}>
                    <Text style={styles.modalTotalPrice}>
                      {offer.price?.currency || 'EUR'} {offer.price?.total || 'N/A'}
                    </Text>
                    <Text style={styles.modalPriceBreakdown}>
                      {offer.price?.currency || 'EUR'} {offer.price?.total ? Math.round(parseFloat(offer.price.total) / nights) : 'N/A'} par nuit
                    </Text>
                    <Text style={styles.modalNights}>{nights} nuit(s)</Text>
                  </View>

                  <View style={styles.modalRoomSection}>
                    <Text style={styles.modalRoomType}>
                      {offer.room?.typeEstimated?.category || offer.room?.type || 'Type de chambre non spécifié'}
                    </Text>
                    <Text style={styles.modalRoomDescription}>
                      {offer.room?.description?.text || 'Description non disponible'}
                    </Text>
                    {offer.room?.typeEstimated?.beds && (
                      <Text style={styles.modalBeds}>
                        {offer.room.typeEstimated.beds} lit(s) - {offer.room.typeEstimated.bedType}
                      </Text>
                    )}
                  </View>

                  <View style={styles.modalPoliciesSection}>
                    <Text style={styles.modalPolicyTitle}>Politique d'annulation</Text>
                    <Text style={styles.modalPolicyText}>
                      {offer.policies?.cancellation?.description?.text || 'Politique d\'annulation non spécifiée'}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.bookButton}>
              <Text style={styles.bookButtonText}>Réserver cet hôtel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#7742FE" />
          <Text style={styles.loadingText}>Recherche d'hôtels en cours...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recherche d'hôtels</Text>
          <Text style={styles.headerSubtitle}>Trouvez votre hébergement idéal</Text>
        </View>
        
        <SearchForm />
        
        {hotels.length > 0 && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {cityName}
            </Text>
            <Text style={styles.resultsCount}>
              {hotels.length} hôtels trouvés • {formatDate(checkInDate)} - {formatDate(checkOutDate)}
            </Text>
          </View>
        )}
        
        {hotels.map((hotel, index) => (
          <HotelCard key={index} hotel={hotel} index={index} />
        ))}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      <HotelDetailsModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  searchContainer: {
    backgroundColor: '#2A2A3E',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3A3A4E',
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#3A3A4E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4A4A5E',
  },
  searchButton: {
    backgroundColor: '#7742FE',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#7742FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#3A3A4E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A4A5E',
    zIndex: 1,
    maxHeight: 200,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#4A4A5E',
  },
  suggestionItemPressed: {
    backgroundColor: '#4A4A5E',
  },
  suggestionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  suggestionText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  suggestionCode: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  suggestionMore: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#4A4A5E',
  },
  suggestionMoreText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  popularCitiesContainer: {
    marginTop: 20,
  },
  popularCitiesTitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    textAlign: 'center',
  },
  popularCitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  popularCityButton: {
    backgroundColor: '#3A3A4E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4A4A5E',
  },
  popularCityText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  resultsCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  hotelCard: {
    backgroundColor: '#2A2A3E',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3A3A4E',
  },
  hotelHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A4E',
  },
  hotelInfo: {
    flex: 1,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  star: {
    fontSize: 16,
  },
  distanceText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: '#3A3A4E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 20,
  },
  offerSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A4E',
  },
  roomInfo: {
    marginBottom: 16,
  },
  roomType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roomDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  priceSection: {
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7742FE',
    marginRight: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  pricePerNight: {
    fontSize: 12,
    color: '#8E8E93',
  },
  policiesSection: {
    marginBottom: 8,
  },
  policyText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  amenitiesSection: {
    padding: 20,
  },
  amenitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityTag: {
    backgroundColor: '#3A3A4E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2A2A3E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A4E',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 24,
    backgroundColor: '#3A3A4E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#8E8E93',
  },
  modalBody: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,
  },
  modalHotelInfo: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A4E',
  },
  modalHotelName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalStarsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  modalDistance: {
    fontSize: 14,
    color: '#8E8E93',
  },
  modalOfferSection: {
    marginBottom: 32,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalPriceSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A4E',
  },
  modalTotalPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7742FE',
    marginBottom: 8,
  },
  modalPriceBreakdown: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalNights: {
    fontSize: 14,
    color: '#8E8E93',
  },
  modalRoomSection: {
    marginBottom: 24,
  },
  modalRoomType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalRoomDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  modalBeds: {
    fontSize: 14,
    color: '#8E8E93',
  },
  modalPoliciesSection: {
    marginBottom: 24,
  },
  modalPolicyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalPolicyText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  modalAmenitiesSection: {
    marginBottom: 24,
  },
  modalAmenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalAmenityTag: {
    backgroundColor: '#3A3A4E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 14,
    color: '#FFFFFF',
  },
  bookButton: {
    backgroundColor: '#7742FE',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#7742FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  advancedToggleButton: {
    backgroundColor: '#3A3A4E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  advancedToggleText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  advancedOptionsContainer: {
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3A3A4E',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#3A3A4E',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  pickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A4A5E',
  },
  pickerButtonActive: {
    backgroundColor: '#7742FE',
    borderColor: '#7742FE',
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  pickerButtonTextActive: {
    color: '#FFFFFF',
  },
  helpText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12,
  },
}); 