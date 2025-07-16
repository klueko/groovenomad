import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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

interface FlightSegment {
  departure?: { at: string; iataCode: string };
  arrival?: { at: string; iataCode: string };
  carrierCode?: string;
  aircraft?: { code: string };
}

interface Itinerary {
  segments: FlightSegment[];
}

interface Price {
  currency: string;
  total: string;
  base: string;
}

interface Flight {
  itineraries: Itinerary[];
  price: Price;
}

export default function FlightsPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // États pour la recherche
  const [origin, setOrigin] = useState('Paris');
  const [destination, setDestination] = useState('New York');
  const [departureDate, setDepartureDate] = useState('2025-08-20');
  const [adults, setAdults] = useState(1);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  
  // Mapping des villes vers les codes d'aéroport
  const cityToAirport: { [key: string]: string } = {
    'Paris': 'CDG',
    'New York': 'JFK',
    'London': 'LHR',
    'Tokyo': 'NRT',
    'Los Angeles': 'LAX',
    'Chicago': 'ORD',
    'Miami': 'MIA',
    'Barcelona': 'BCN',
    'Rome': 'FCO',
    'Amsterdam': 'AMS',
    'Berlin': 'BER',
    'Madrid': 'MAD',
    'Toronto': 'YYZ',
    'Sydney': 'SYD',
    'Dubai': 'DXB',
    'Singapore': 'SIN',
    'Hong Kong': 'HKG',
    'Seoul': 'ICN',
    'Bangkok': 'BKK',
    'Istanbul': 'IST',
  };

  const swapOriginDestination = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const searchFlights = async () => {
    if (!origin || !destination || !departureDate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    // Convertir les villes en codes d'aéroport
    const originAirport = cityToAirport[origin] || origin;
    const destinationAirport = cityToAirport[destination] || destination;

    setLoading(true);
    try {
      const tokenRes = await axios.post(
        'https://test.api.amadeus.com/v1/security/oauth2/token',
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: 'EGViMCRwOJlselzqnjOvrFcYukvJAAhm',
          client_secret: '2WbTft6A10f3tlxj',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const token = tokenRes.data.access_token;

      const res = await axios.get('https://test.api.amadeus.com/v2/shopping/flight-offers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          originLocationCode: originAirport,
          destinationLocationCode: destinationAirport,
          departureDate: departureDate,
          adults: adults,
          max: 100,
        },
      });

      setFlights(res.data.data);
    } catch (err: any) {
      console.error('Amadeus error:', err.response?.data || err.message);
      Alert.alert('Erreur', 'Impossible de récupérer les vols. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateTimeString?: string): string => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateTimeString?: string): string => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const calculateDuration = (departure?: string, arrival?: string): string => {
    if (!departure || !arrival) return '';
    const dep = new Date(departure);
    const arr = new Date(arrival);
    const diffMs = arr.getTime() - dep.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const openFlightDetails = (flight: Flight) => {
    setSelectedFlight(flight);
    setModalVisible(true);
  };

  const toggleFavorite = (flightId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(flightId)) {
      newFavorites.delete(flightId);
    } else {
      newFavorites.add(flightId);
    }
    setFavorites(newFavorites);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={[styles.star, { color: i <= rating ? '#FFD700' : '#4A4A4A' }]}>
          ★
        </Text>
      );
    }
    return stars;
  };

  const SearchForm: React.FC = () => {
    const filteredOriginCities = Object.keys(cityToAirport).filter(city =>
      city.toLowerCase().includes(origin.toLowerCase())
    );
    
    const filteredDestinationCities = Object.keys(cityToAirport).filter(city =>
      city.toLowerCase().includes(destination.toLowerCase())
    );

    const popularCities = ['Paris', 'New York', 'London', 'Tokyo', 'Los Angeles'];

    const closeAllSuggestions = () => {
      setShowOriginSuggestions(false);
      setShowDestinationSuggestions(false);
    };

    return (
      <View style={styles.searchContainer}>
        <Text style={styles.searchTitle}>Rechercher un vol</Text>
        
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Ville de départ</Text>
            <TextInput
              style={styles.input}
              value={origin}
              onChangeText={(text) => {
                setOrigin(text);
                setShowOriginSuggestions(true);
                setShowDestinationSuggestions(false);
              }}
              placeholder="Paris"
              placeholderTextColor="#8E8E93"
              onFocus={() => {
                setShowOriginSuggestions(true);
                setShowDestinationSuggestions(false);
              }}
              blurOnSubmit={false}
            />
            {showOriginSuggestions && filteredOriginCities.length > 0 && origin.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {filteredOriginCities.slice(0, 5).map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setOrigin(city);
                      setShowOriginSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionText}>{city}</Text>
                    <Text style={styles.suggestionCode}>{cityToAirport[city]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          <TouchableOpacity style={styles.swapButton} onPress={swapOriginDestination}>
            <Text style={styles.swapIcon}>⇄</Text>
          </TouchableOpacity>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Ville d'arrivée</Text>
            <TextInput
              style={styles.input}
              value={destination}
              onChangeText={(text) => {
                setDestination(text);
                setShowDestinationSuggestions(true);
                setShowOriginSuggestions(false);
              }}
              placeholder="New York"
              placeholderTextColor="#8E8E93"
              onFocus={() => {
                setShowDestinationSuggestions(true);
                setShowOriginSuggestions(false);
              }}
              blurOnSubmit={false}
            />
            {showDestinationSuggestions && filteredDestinationCities.length > 0 && destination.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {filteredDestinationCities.slice(0, 5).map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setDestination(city);
                      setShowDestinationSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionText}>{city}</Text>
                    <Text style={styles.suggestionCode}>{cityToAirport[city]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Date de départ</Text>
            <TextInput
              style={styles.input}
              value={departureDate}
              onChangeText={setDepartureDate}
              placeholder="2025-08-20"
              placeholderTextColor="#8E8E93"
              onFocus={() => {
                setShowOriginSuggestions(false);
                setShowDestinationSuggestions(false);
              }}
              blurOnSubmit={false}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Passagers</Text>
            <TextInput
              style={styles.input}
              value={adults.toString()}
              onChangeText={(text) => setAdults(parseInt(text) || 1)}
              placeholder="1"
              placeholderTextColor="#8E8E93"
              keyboardType="numeric"
              onFocus={() => {
                setShowOriginSuggestions(false);
                setShowDestinationSuggestions(false);
              }}
              blurOnSubmit={false}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.searchButton}
          onPress={searchFlights}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>Rechercher</Text>
          )}
        </TouchableOpacity>

        <View style={styles.popularCitiesContainer}>
          <Text style={styles.popularCitiesTitle}>Villes populaires</Text>
          <View style={styles.popularCitiesList}>
            {popularCities.map((city) => (
              <TouchableOpacity
                key={city}
                style={styles.popularCityButton}
                onPress={() => {
                  if (origin === 'Paris') {
                    setDestination(city);
                  } else {
                    setOrigin(city);
                  }
                }}
              >
                <Text style={styles.popularCityText}>{city}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const FlightCard: React.FC<{ flight: Flight; index: number }> = ({ flight, index }) => {
    const segment = flight.itineraries?.[0]?.segments?.[0];
    const airline = segment?.carrierCode || 'Unknown';
    const duration = calculateDuration(segment?.departure?.at, segment?.arrival?.at);
    const flightId = `${airline}-${segment?.departure?.iataCode}-${segment?.arrival?.iataCode}`;
    const isFavorite = favorites.has(flightId);

    return (
      <TouchableOpacity
        style={styles.flightCard}
        activeOpacity={0.8}
        onPress={() => openFlightDetails(flight)}
      >
        <View style={styles.weatherHeader}>
          <View style={styles.weatherInfo}>
            <Text style={styles.weatherIcon}>☀️</Text>
            <Text style={styles.weatherTemp}>17°C</Text>
            <Text style={styles.weatherDesc}>Clear</Text>
          </View>
          <Text style={styles.weatherDetails}>Max : 17°C Min : 6°C</Text>
        </View>

        <View style={styles.flightInfo}>
          <View style={styles.routeContainer}>
            <Text style={styles.routeText}>
              Vol {segment?.departure?.iataCode} → {segment?.arrival?.iataCode}
            </Text>
            <Text style={styles.dateText}>{formatDate(segment?.departure?.at)}</Text>
          </View>

          <View style={styles.routeVisual}>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(segment?.departure?.at)}</Text>
              <Text style={styles.airportCode}>{segment?.departure?.iataCode}</Text>
            </View>
            
            <View style={styles.flightPath}>
              <View style={styles.pathLine} />
              <View style={styles.plane}>
                <Text style={styles.planeIcon}>✈️</Text>
              </View>
              <View style={styles.pathLine} />
            </View>

            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(segment?.arrival?.at)}</Text>
              <Text style={styles.airportCode}>{segment?.arrival?.iataCode}</Text>
            </View>
          </View>
        </View>

        <View style={styles.ratingSection}>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingScore}>4.{Math.floor(Math.random() * 5)}</Text>
            <View style={styles.starsContainer}>
              {renderStars(4)}
            </View>
            <Text style={styles.reviewCount}>({Math.floor(Math.random() * 1000) + 100} Avis)</Text>
          </View>
        </View>

        <View style={styles.priceSection}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{flight.price?.currency} {flight.price?.total}</Text>
            <Text style={styles.priceLabel}>par personne</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(flightId)}
          >
            <Text style={[styles.favoriteIcon, { color: isFavorite ? '#FF4757' : '#8E8E93' }]}>
              {isFavorite ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Détails du vol */}
        <View style={styles.flightDetails}>
          <Text style={styles.detailText}>Durée: {duration}</Text>
          <Text style={styles.detailText}>
            {flight.itineraries?.[0]?.segments?.length > 1
              ? `${flight.itineraries[0].segments.length - 1} escale(s)`
              : 'Direct'}
          </Text>
          <Text style={styles.detailText}>Compagnie: {airline}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const FlightDetailsModal: React.FC = () => {
    if (!selectedFlight) return null;

    const segments = selectedFlight.itineraries?.[0]?.segments || [];

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
              <Text style={styles.modalTitle}>Détails du vol</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.modalPriceSection}>
                <Text style={styles.totalPrice}>
                  {selectedFlight.price?.currency} {selectedFlight.price?.total}
                </Text>
                <Text style={styles.priceBreakdown}>
                  Prix de base: {selectedFlight.price?.currency} {selectedFlight.price?.base}
                </Text>
              </View>

              {segments.map((segment, index) => (
                <View key={index} style={styles.segmentCard}>
                  <View style={styles.segmentRoute}>
                    <Text style={styles.segmentAirport}>
                      {segment.departure?.iataCode}
                    </Text>
                    <Text style={styles.segmentArrow}>→</Text>
                    <Text style={styles.segmentAirport}>
                      {segment.arrival?.iataCode}
                    </Text>
                  </View>
                  <View style={styles.segmentDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Départ:</Text>
                      <Text style={styles.detailValue}>
                        {formatTime(segment.departure?.at)} - {formatDate(segment.departure?.at)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Arrivée:</Text>
                      <Text style={styles.detailValue}>
                        {formatTime(segment.arrival?.at)} - {formatDate(segment.arrival?.at)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Durée:</Text>
                      <Text style={styles.detailValue}>
                        {calculateDuration(segment.departure?.at, segment.arrival?.at)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.bookButton}>
              <Text style={styles.bookButtonText}>Réserver mon vol</Text>
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
          <Text style={styles.loadingText}>Recherche de vols en cours...</Text>
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
          <Text style={styles.headerTitle}>Recherche de vols</Text>
          <Text style={styles.headerSubtitle}>Trouvez votre prochain voyage</Text>
        </View>
        
        <SearchForm />
        
        {flights.length > 0 && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {origin} → {destination} • {departureDate}
            </Text>
            <Text style={styles.resultsCount}>
              {flights.length} vols trouvés • {cityToAirport[origin] || origin} → {cityToAirport[destination] || destination}
            </Text>
          </View>
        )}
        
        {flights.map((flight, index) => (
          <FlightCard key={index} flight={flight} index={index} />
        ))}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      <FlightDetailsModal />
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
  // Search form styles
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
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: '#7742FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  swapIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  suggestionText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  suggestionCode: {
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
  flightCard: {
    backgroundColor: '#2A2A3E',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3A3A4E',
  },
  weatherHeader: {
    backgroundColor: '#3A3A4E',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#4A4A5E',
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  weatherTemp: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 12,
  },
  weatherDesc: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  weatherDetails: {
    fontSize: 12,
    color: '#8E8E93',
  },
  flightInfo: {
    padding: 20,
  },
  routeContainer: {
    marginBottom: 16,
  },
  routeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  routeVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeContainer: {
    flex: 1,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  airportCode: {
    fontSize: 14,
    color: '#8E8E93',
  },
  flightPath: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pathLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#7742FE',
  },
  plane: {
    marginHorizontal: 8,
  },
  planeIcon: {
    fontSize: 16,
  },
  ratingSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  star: {
    fontSize: 16,
  },
  reviewCount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  priceLabel: {
    fontSize: 12,
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
  flightDetails: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#3A3A4E',
    paddingTop: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  bottomSpacing: {
    height: 20,
  },
  // Modal styles
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
  modalPriceSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A4E',
  },
  totalPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7742FE',
    marginBottom: 12,
  },
  priceBreakdown: {
    fontSize: 14,
    color: '#8E8E93',
  },
  segmentCard: {
    backgroundColor: '#3A3A4E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  segmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  segmentRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  segmentAirport: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  segmentArrow: {
    fontSize: 16,
    color: '#8E8E93',
    marginHorizontal: 12,
  },
  segmentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
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
});