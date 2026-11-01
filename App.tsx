import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
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
import { Search, Droplet, Flame, ShieldAlert, MapPin, Heart, SlidersHorizontal } from 'lucide-react-native';
import { SAMPLE_PLACES } from './data/places';
import type { CampingPlace } from './data/places';
import PlaceDetailModal from './components/PlaceDetailModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_STORAGE_KEY = '@camping-sri-lanka/favorite-place-ids';
type TriState = 'Any' | 'Yes' | 'No';
type DifficultyChoice = 'Any' | CampingPlace['difficulty'];

// A three-way filter supports Yes, No, or no restriction.
const matchesBoolean = (value: boolean, choice: TriState) =>
  choice === 'Any' || (choice === 'Yes' ? value : !value);


export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
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
  const filteredPlaces = SAMPLE_PLACES.filter((place) => {
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

  const categories = ['All', 'Camping', 'Hiking', 'Viewpoint'];

  // Single Location Card Component
  const renderPlaceCard = ({ item }: { item: CampingPlace }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => setSelectedPlace(item)}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      
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

      <TouchableOpacity
        onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
      >
      <Text>Advanced Filters</Text>
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
        <Text style={styles.headerTitle}>CAMPING SRI LANKA</Text>
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
      <Text style={styles.matchCount}>{filteredPlaces.length} place{filteredPlaces.length === 1 ? '' : 's'} found</Text>
      {showAdvancedFilters && (
        <View>
        <Text>Advanced Filters Options</Text>
        </View>
)}
      {/* Locations List */}
      <FlatList
        data={filteredPlaces}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    height: 50,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    marginRight: 10,
  },
  activeCategoryChip: {
    backgroundColor: '#15803d',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  activeCategoryText: {
    color: '#fff',
  },
  filterSection: { marginHorizontal: 20, marginBottom: 8 },
  filterToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#dcfce7', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
  filterToggleText: { flex: 1, color: '#166534', fontSize: 14, fontWeight: '700' },
  filterToggleHint: { color: '#166534', fontSize: 12, fontWeight: '600' },
  filtersPanel: { maxHeight: 310, marginTop: 8, borderRadius: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', padding: 12 },
  filterGroup: { marginBottom: 14 },
  filterLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8 },
  filterChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { borderRadius: 18, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 7 },
  filterChipActive: { backgroundColor: '#15803d', borderColor: '#15803d' },
  filterChipText: { color: '#334155', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#ffffff' },
  resetButton: { paddingVertical: 12, alignItems: 'center', marginBottom: 10, borderRadius: 10, backgroundColor: '#f1f5f9' },
  resetButtonText: { color: '#166534', fontWeight: '700', fontSize: 13 },
  matchCount: { marginHorizontal: 20, marginBottom: 8, fontSize: 12, color: '#64748b' },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  favoriteHeart: {
    position: 'absolute', top: 12, left: 12, zIndex: 2,
    backgroundColor: '#ffffff', borderRadius: 24,
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  favoritesToggle: {
    alignSelf: 'flex-start', marginHorizontal: 20, marginBottom: 12,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 22,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff1f2',
  },
  favoritesToggleActive: { backgroundColor: '#15803d' },
  favoritesToggleText: { color: '#9f1239', fontWeight: '700' },
  favoritesToggleTextActive: { color: '#ffffff' },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardDetails: {
    padding: 14,
  },
  placeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  districtName: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 4,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  iconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  iconText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
});