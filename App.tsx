import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import { Search, Droplet, Flame, ShieldAlert, MapPin, Heart, SlidersHorizontal, Map as MapIcon } from 'lucide-react-native';
import { SAMPLE_PLACES } from './data/places';
import type { CampingPlace } from './data/places';
import PlaceDetailModal from './components/PlaceDetailModal';
import PlacesMap from './components/PlacesMap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { calculateDistance } from './utils/distance';
import { fetchPlaces } from './services/api';
import type { DatabasePlace } from './services/api';

import { styles } from './styles/appStyles';

const FAVORITES_STORAGE_KEY = '@camping-sri-lanka/favorite-place-ids';
type TriState = 'Any' | 'Yes' | 'No';
type DifficultyChoice = 'Any' | CampingPlace['difficulty'];

// A three-way filter supports Yes, No, or no restriction.
const matchesBoolean = (
  value: boolean | null,
  filter: string
): boolean => {
  if (filter === 'Any') return true;

  if (value === null) return false;

  if (filter === 'Yes') return value === true;

  if (filter === 'No') return value === false;

  return false;
};


export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'difficulty'>('default');
  const [showMap, setShowMap] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPlace, setSelectedPlace] = useState<CampingPlace | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyChoice>('Any');
  const [waterFilter, setWaterFilter] = useState<TriState>('Any');
  const [campfireFilter, setCampfireFilter] = useState<TriState>('Any');
  const [vehicleFilter, setVehicleFilter] = useState<TriState>('Any');
  const [permitFilter, setPermitFilter] = useState<TriState>('Any');
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [locationLoading, setLocationLoading] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState(50);
  const [databasePlaces, setDatabasePlaces] = useState<DatabasePlace[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState<string | null>(null);

  // Load cloud records once on mount, independently from GPS access.
  useEffect(() => {
    let active = true;

    async function loadPlaces() {
      try {
        setPlacesLoading(true);
        setPlacesError(null);
        const data = await fetchPlaces();
        if (active) setDatabasePlaces(data);
        console.log('PostgreSQL Places:', data);
      } catch (error) {
        console.error('API Error:', error);
        if (active) setPlacesError('Unable to load locations from the backend. Showing demo places.');
      } finally {
        if (active) setPlacesLoading(false);
      }
    }

    loadPlaces();
    return () => { active = false; };
  }, []);

  // Find My Location must request GPS, not fetch places again.
  const getMyLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission', 'Allow location access to find nearby places.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setShowMap(true);
      console.log('My GPS Location:', position.coords.latitude, position.coords.longitude);
    } catch (error) {
      console.error('GPS Error:', error);
      Alert.alert('Location error', 'Could not get your current location. Try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Cloud records are primary. Demo records are used only when the API fails.
  // An empty successful response means the database has no places yet.
  const allPlaces: CampingPlace[] = placesError
    ? SAMPLE_PLACES
    : databasePlaces;

  // Load saved IDs only once when the app starts.
  useEffect(() => {
    let active = true;
    async function loadFavorites() {
      try {
        const saved = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        if (saved && active) {
          const parsed: unknown = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setFavoriteIds(parsed.filter((id): id is string => typeof id === 'string'));
          }
        }
      } catch (error) {
        console.error('Failed to load favorites', error);
        Alert.alert('Favorites', 'Saved favorites could not be loaded.');
      } finally {
        if (active) setFavoritesLoaded(true);
      }
    }
    loadFavorites();
    return () => { active = false; };
  }, []);

  // Write to device storage whenever the saved IDs change, after loading finishes.
  useEffect(() => {
    if (!favoritesLoaded) return;
    AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds))
      .catch((error) => {
        console.error('Failed to save favorites', error);
        Alert.alert('Favorites', 'Could not save favorites to this device.');
      });
  }, [favoriteIds, favoritesLoaded]);

  const toggleFavorite = (id: string) => {
    if (!favoritesLoaded) return;
    setFavoriteIds((previous) =>
      previous.includes(id)
        ? previous.filter((savedId) => savedId !== id)
        : [...previous, id]
    );
  };


  const resetAdvancedFilters = () => {
    setDifficultyFilter('Any');
    setWaterFilter('Any');
    setCampfireFilter('Any');
    setVehicleFilter('Any');
    setPermitFilter('Any');
  };

  const activeFilterCount = [difficultyFilter, waterFilter, campfireFilter, vehicleFilter, permitFilter]
    .filter((value) => value !== 'Any').length;

  // Reusable set of filter chips (the updater receives the selected value).
  const renderFilterRow = <T extends string,>(
    label: string,
    options: readonly T[],
    current: T,
    update: (value: T) => void,
  ) => (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.filterChoices}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: current === option }}
            onPress={() => update(option)}
            style={[styles.filterChip, current === option && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, current === option && styles.filterChipTextActive]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Search filter function
  const filteredPlaces = allPlaces.filter((place) => {
    const matchesSearch =
      place.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || place.category === selectedCategory;

    const matchesDifficulty = difficultyFilter === 'Any' || place.difficulty === difficultyFilter;
    const matchesFacilities =
      matchesBoolean(place.waterAvailable, waterFilter) &&
      matchesBoolean(place.campfireAllowed, campfireFilter) &&
      matchesBoolean(place.vehicleAccess, vehicleFilter) &&
      matchesBoolean(place.permitRequired, permitFilter);
    const matchesFavorites = !showFavoritesOnly || favoriteIds.includes(place.id);

    return matchesSearch && matchesCategory && matchesDifficulty && matchesFacilities && matchesFavorites;
  });

  // Sort a copy to avoid modifying original data.
  const sortedPlaces = [...filteredPlaces].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'difficulty') {
      const order = { Easy: 1, Moderate: 2, Hard: 3 };
      return order[a.difficulty] - order[b.difficulty];
    }
    return 0;
  });

  const nearbyPlaces = userLocation
    ? [...sortedPlaces].sort((a, b) => {
      const distanceA = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        a.coordinates.latitude,
        a.coordinates.longitude
      );

      const distanceB = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        b.coordinates.latitude,
        b.coordinates.longitude
      );

      return distanceA - distanceB;
    })
    : sortedPlaces;

  const displayedPlaces = nearbyOnly && userLocation
  ? nearbyPlaces.filter((place) => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        place.coordinates.latitude,
        place.coordinates.longitude
      );

      return distance <= nearbyRadius;
    })
  : sortedPlaces;

  const categories = ['All', 'Camping', 'Hiking', 'Viewpoint'];

  // Single Location Card Component
  const renderPlaceCard = ({ item }: { item: CampingPlace }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => setSelectedPlace(item)}
    >
      {item.image ? (
  <Image
    source={{ uri: item.image }}
    style={styles.cardImage}
    resizeMode="cover"
  />
) : (
  <View
    style={[
      styles.cardImage,
      {
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
      },
    ]}
  >
    <Text style={{ color: '#64748b' }}>
      Photo coming soon
    </Text>
  </View>
)}
      
      {/* Heart button works independently from the card's onPress. */}
      <TouchableOpacity
        style={styles.favoriteHeart}
        onPress={() => toggleFavorite(item.id)}
        disabled={!favoritesLoaded}
        accessibilityRole="button"
        accessibilityLabel={favoriteIds.includes(item.id) ? `Remove ${item.name} from favorites` : `Save ${item.name} to favorites`}
      >
        <Heart
          size={22}
          color={favoriteIds.includes(item.id) ? '#e11d48' : '#334155'}
          fill={favoriteIds.includes(item.id) ? '#e11d48' : 'none'}
        />
      </TouchableOpacity>

      {/* Badge for Difficulty */}
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>{item.difficulty}</Text>
      </View>

      <View style={styles.cardDetails}>
        <Text style={styles.placeName}>{item.name}</Text>
        
        <View style={styles.locationRow}>
          <MapPin size={14} color="#666" />
          <Text style={styles.districtName}>{item.district} District</Text>

          {userLocation && (
  <Text style={{ color: '#15803d', marginTop: 5 }}>
    📍 {calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      item.coordinates.latitude,
      item.coordinates.longitude
    ).toFixed(1)} km away
  </Text>
)}
        </View>

        {/* Quick Amenities Icons */}
        <View style={styles.iconRow}>
          {item.waterAvailable && (
            <View style={styles.iconBadge}>
              <Droplet size={14} color="#0284c7" />
              <Text style={styles.iconText}>Water</Text>
            </View>
          )}
          {item.campfireAllowed && (
            <View style={styles.iconBadge}>
              <Flame size={14} color="#e11d48" />
              <Text style={styles.iconText}>Campfire</Text>
            </View>
          )}
          {item.permitRequired && (
            <View style={styles.iconBadge}>
              <ShieldAlert size={14} color="#d97706" />
              <Text style={styles.iconText}>Permit</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TRAVELLER</Text>
        <Text style={styles.headerSubtitle}>Find your next adventure</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by District (e.g. Badulla)..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoryContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.activeCategoryChip,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat && styles.activeCategoryText,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Toggle between all places and locally saved favorites. */}
      <TouchableOpacity
        style={[styles.favoritesToggle, showFavoritesOnly && styles.favoritesToggleActive]}
        onPress={() => setShowFavoritesOnly((value) => !value)}
        disabled={!favoritesLoaded}
        accessibilityRole="button"
        accessibilityLabel={showFavoritesOnly ? 'Show all locations' : 'Show favorite locations'}
      >
        <Heart size={17} color={showFavoritesOnly ? '#ffffff' : '#e11d48'} fill={showFavoritesOnly ? '#ffffff' : 'none'} />
        <Text style={[styles.favoritesToggleText, showFavoritesOnly && styles.favoritesToggleTextActive]}>
          {showFavoritesOnly ? 'Showing Favorites' : `My Favorites (${favoriteIds.length})`}
        </Text>
      </TouchableOpacity>

      {/* Advanced filters: collapsed by default to preserve screen space. */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowAdvancedFilters((previous) => !previous)}
          accessibilityRole="button"
          accessibilityLabel={showAdvancedFilters ? 'Hide advanced filters' : 'Show advanced filters'}
        >
          <SlidersHorizontal size={18} color="#166534" />
          <Text style={styles.filterToggleText}>Advanced Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}</Text>
          <Text style={styles.filterToggleHint}>{showAdvancedFilters ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
        {showAdvancedFilters && (
          <ScrollView style={styles.filtersPanel} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {renderFilterRow<DifficultyChoice>('Difficulty', ['Any', 'Easy', 'Moderate', 'Hard'], difficultyFilter, setDifficultyFilter)}
            {renderFilterRow<TriState>('Water available', ['Any', 'Yes', 'No'], waterFilter, setWaterFilter)}
            {renderFilterRow<TriState>('Campfire allowed', ['Any', 'Yes', 'No'], campfireFilter, setCampfireFilter)}
            {renderFilterRow<TriState>('Vehicle access', ['Any', 'Yes', 'No'], vehicleFilter, setVehicleFilter)}
            {renderFilterRow<TriState>('Permit required', ['Any', 'Yes', 'No'], permitFilter, setPermitFilter)}
            <TouchableOpacity onPress={resetAdvancedFilters} style={styles.resetButton} accessibilityRole="button">
              <Text style={styles.resetButtonText}>Reset advanced filters</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
      <Text style={styles.matchCount}>{displayedPlaces.length} place{displayedPlaces.length === 1 ? '' : 's'} found</Text>

      {/* Sort and optional map preview. The list remains scrollable. */}
      <View style={styles.listToolbar}>
        {(['default', 'name', 'difficulty'] as const).map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.sortButton, sortBy === option && styles.sortButtonActive]}
            onPress={() => setSortBy(option)}
            accessibilityRole="button"
          >
            <Text style={[styles.sortText, sortBy === option && styles.sortTextActive]}>
              {option === 'default' ? 'Default' : option === 'name' ? 'A–Z' : 'Difficulty'}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.mapToggle, showMap && styles.mapToggleActive]}
          onPress={() => setShowMap((value) => !value)}
          accessibilityRole="button"
        >
          <MapIcon size={17} color={showMap ? '#ffffff' : '#166534'} />
          <Text style={[styles.mapToggleText, showMap && styles.sortTextActive]}>Map</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
      onPress={getMyLocation}
      disabled={locationLoading}
      style={{
        backgroundColor: '#15803d',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 10,
        opacity: locationLoading ? 0.6 : 1,
  }}
>
  <Text style={{ color: '#fff', fontWeight: '700' }}>
    {locationLoading ? 'Getting Location...' : '📍 Find My Location'}
  </Text>
</TouchableOpacity>

<TouchableOpacity
  disabled={!userLocation}
  onPress={() => setNearbyOnly(previous => !previous)}
  style={{
    backgroundColor: nearbyOnly ? '#2cc366' : '#e2e8f0',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
    opacity: userLocation ? 1 : 0.5,
  }}
>
  <Text
    style={{
      color: nearbyOnly ? '#ffffff' : '#334155',
      fontWeight: '700',
    }}
  >
    {nearbyOnly ? '✓ Nearby Places' : '📍 Near Me'}
  </Text>
</TouchableOpacity>
{nearbyOnly && (
  <View style={{ flexDirection: 'row', gap: 10, marginVertical: 10 }}>
    {[25, 50, 100, 200].map(radius => (
      <TouchableOpacity
        key={radius}
        onPress={() => setNearbyRadius(radius)}
        style={{
          padding: 10,
          borderRadius: 10,
          backgroundColor:
            nearbyRadius === radius ? '#15803d' : '#e2e8f0',
        }}
      >
        <Text
          style={{
            color: nearbyRadius === radius ? '#fff' : '#334155',
          }}
        >
          {radius} km
        </Text>
      </TouchableOpacity>
    ))}
  </View>

)}

      {/* API loading / failure status; avoid duplicate database preview cards. */}
      {placesLoading && (
        <Text style={{ textAlign: 'center', marginVertical: 8, color: '#64748b' }}>
          Loading locations...
        </Text>
      )}
      {placesError && (
        <Text style={{ textAlign: 'center', marginVertical: 8, color: '#b45309' }}>
          {placesError}
        </Text>
      )}

      {/* Locations List */}
      <FlatList
        data={displayedPlaces}
        ListHeaderComponent={showMap ? (
          <View style={styles.mapPanel}>
            <PlacesMap
              places={displayedPlaces}
              onSelectPlace={setSelectedPlace}
              userLocation={userLocation}
            />
          </View>
        ) : undefined}
        keyExtractor={(item) => item.id}
        renderItem={renderPlaceCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{showFavoritesOnly ? 'No favorite places match your filters.' : 'No places match your search.'}</Text>
          </View>
        }
      />

      <PlaceDetailModal
        place={selectedPlace}
        visible={selectedPlace !== null}
        onClose={() => setSelectedPlace(null)}
        isFavorite={selectedPlace !== null && favoriteIds.includes(selectedPlace.id)}
        onToggleFavorite={() => { if (selectedPlace) toggleFavorite(selectedPlace.id); }}
      />
    </SafeAreaView>
  );
}

