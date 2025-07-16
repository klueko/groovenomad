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
  
  // Search states
  const [cityCode, setCityCode] = useState('LON');
  const [checkInDate, setCheckInDate] = useState('2025-08-20');
  const [checkOutDate, setCheckOutDate] = useState('2025-08-25');
  const [adults, setAdults] = useState(1);
  const [roomQuantity, setRoomQuantity] = useState(1);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  
  // City mapping for hotel search (using IATA city codes)
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
  };

  const searchHotels = async () => {
    if (!cityCode || !checkInDate || !checkOutDate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

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

      // Use the real Amadeus Hotel Search API v3 with correct parameters
      console.log('Searching hotels for city:', cityCode);
      
      // For the test environment, use known hotel IDs that work
      const testHotelIds: { [key: string]: string[] } = {
        'LON': ['MCLONGHM', 'HTLONDON'], // London - JW Marriott example
        'NYC': ['HTNEWYORK', 'MCNEWYORK'], // New York
        'PAR': ['HTPARIS', 'MCPARIS'], // Paris
        'TYO': ['HTTOKYO', 'MCTOKYO'], // Tokyo
      };
      
      const hotelIds = testHotelIds[cityCode] || [];
      
      if (hotelIds.length === 0) {
        Alert.alert('Aucun hôtel trouvé', 'Aucun hôtel disponible pour cette ville dans l\'environnement de test. Essayez LON (London) ou NYC (New York).');
        setHotels([]);
        return;
      }

      console.log('Using hotel IDs:', hotelIds);

      // Search for offers using the hotel IDs with all required parameters
      const res = await axios.get('https://test.api.amadeus.com/v3/shopping/hotel-offers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          hotelIds: hotelIds,
          adults: adults,
          checkInDate: checkInDate,
          checkOutDate: checkOutDate,
          roomQuantity: roomQuantity,
          paymentPolicy: 'NONE',
          bestRateOnly: true,
          lang: 'FR',
        },
      });

      console.log('Hotel offers response:', res.data);
      
      if (res.data.data && res.data.data.length > 0) {
        setHotels(res.data.data);
      } else {
        Alert.alert('Aucune offre trouvée', 'Aucune offre disponible pour les dates sélectionnées. Essayez d\'autres dates.');
        setHotels([]);
      }
    } catch (err: any) {
      console.error('Amadeus Hotel API error:', err.response?.data || err.message);
      if (err.response?.status === 400) {
        Alert.alert('Erreur de paramètres', 'Veuillez vérifier les dates et la ville sélectionnée.');
      } else if (err.response?.status === 401) {
        Alert.alert('Erreur d\'authentification', 'Problème avec l\'accès à l\'API Amadeus.');
      } else {
        Alert.alert('Erreur', 'Impossible de récupérer les hôtels. Veuillez réessayer.');
      }
      setHotels([]);
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
    return stars;
  };

  const SearchForm: React.FC = () => {
    const filteredCities = Object.keys(cityToCode).filter(city =>
      city.toLowerCase().includes(cityCode.toLowerCase())
    );

    const popularCities = ['London', 'New York', 'Paris', 'Tokyo', 'Los Angeles'];

    return (
      <View style={styles.searchContainer}>
        <Text style={styles.searchTitle}>Rechercher un hôtel</Text>
        
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Ville</Text>
            <TextInput
              style={styles.input}
              value={cityCode}
              onChangeText={(text) => {
                setCityCode(text);
                setShowCitySuggestions(true);
              }}
              placeholder="PAR"
              placeholderTextColor="#8E8E93"
              onFocus={() => setShowCitySuggestions(true)}
              blurOnSubmit={false}
            />
            {showCitySuggestions && filteredCities.length > 0 && cityCode.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {filteredCities.slice(0, 5).map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setCityCode(cityToCode[city]);
                      setShowCitySuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionText}>{city}</Text>
                    <Text style={styles.suggestionCode}>{cityToCode[city]}</Text>
                  </TouchableOpacity>
                ))}
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
              placeholder="2025-08-20"
              placeholderTextColor="#8E8E93"
              onFocus={() => setShowCitySuggestions(false)}
              blurOnSubmit={false}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Date de départ</Text>
            <TextInput
              style={styles.input}
              value={checkOutDate}
              onChangeText={setCheckOutDate}
              placeholder="2025-08-25"
              placeholderTextColor="#8E8E93"
              onFocus={() => setShowCitySuggestions(false)}
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
              onFocus={() => setShowCitySuggestions(false)}
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
              onFocus={() => setShowCitySuggestions(false)}
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

        <View style={styles.popularCitiesContainer}>
          <Text style={styles.popularCitiesTitle}>Villes populaires</Text>
          <View style={styles.popularCitiesList}>
            {popularCities.map((city) => (
              <TouchableOpacity
                key={city}
                style={styles.popularCityButton}
                onPress={() => setCityCode(cityToCode[city])}
              >
                <Text style={styles.popularCityText}>{city}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const HotelCard: React.FC<{ hotel: HotelOffer; index: number }> = ({ hotel, index }) => {
    const offer = hotel.offers?.[0];
    const hotelId = hotel.hotel.hotelId;
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
            <Text style={styles.hotelName}>{hotel.hotel.name}</Text>
            <View style={styles.starsContainer}>
              {renderStars(4)} {/* Default rating since not provided in API */}
            </View>
            <Text style={styles.distanceText}>
              {hotel.hotel.cityCode} • {hotel.available ? 'Disponible' : 'Non disponible'}
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
              <Text style={styles.roomType}>{offer.room.typeEstimated?.category || offer.room.type}</Text>
              <Text style={styles.roomDescription}>{offer.room.description.text}</Text>
            </View>

            <View style={styles.priceSection}>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{offer.price.currency} {offer.price.total}</Text>
                <Text style={styles.priceLabel}>pour {nights} nuit(s)</Text>
                <Text style={styles.pricePerNight}>
                  {offer.price.currency} {Math.round(parseFloat(offer.price.total) / nights)} par nuit
                </Text>
              </View>
            </View>

            <View style={styles.policiesSection}>
              <Text style={styles.policyText}>
                {offer.policies.cancellation.type === 'FREE_CANCELLATION' 
                  ? '✅ Annulation gratuite' 
                  : offer.policies.cancellation.description.text}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const HotelDetailsModal: React.FC = () => {
    if (!selectedHotel) return null;

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
                  {selectedHotel.hotel.name}
                </Text>
                <View style={styles.modalStarsContainer}>
                  {renderStars(4)} {/* Default rating since not provided in API */}
                </View>
                <Text style={styles.modalDistance}>
                  {selectedHotel.hotel.cityCode} • {selectedHotel.available ? 'Disponible' : 'Non disponible'}
                </Text>
              </View>

              {offer && (
                <View style={styles.modalOfferSection}>
                  <Text style={styles.modalSectionTitle}>Offre sélectionnée</Text>
                  <View style={styles.modalPriceSection}>
                    <Text style={styles.modalTotalPrice}>
                      {offer.price.currency} {offer.price.total}
                    </Text>
                    <Text style={styles.modalPriceBreakdown}>
                      {offer.price.currency} {Math.round(parseFloat(offer.price.total) / nights)} par nuit
                    </Text>
                    <Text style={styles.modalNights}>{nights} nuit(s)</Text>
                  </View>

                  <View style={styles.modalRoomSection}>
                    <Text style={styles.modalRoomType}>
                      {offer.room.typeEstimated?.category || offer.room.type}
                    </Text>
                    <Text style={styles.modalRoomDescription}>
                      {offer.room.description.text}
                    </Text>
                    {offer.room.typeEstimated?.beds && (
                      <Text style={styles.modalBeds}>
                        {offer.room.typeEstimated.beds} lit(s) - {offer.room.typeEstimated.bedType}
                      </Text>
                    )}
                  </View>

                  <View style={styles.modalPoliciesSection}>
                    <Text style={styles.modalPolicyTitle}>Politique d'annulation</Text>
                    <Text style={styles.modalPolicyText}>
                      {offer.policies.cancellation.description.text}
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
              {Object.keys(cityToCode).find(key => cityToCode[key] === cityCode) || cityCode}
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
}); 