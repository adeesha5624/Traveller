import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import {
  X,
  Droplet,
  Flame,
  ShieldAlert,
  MapPin,
  Navigation,
  CarFront,
  Heart,
} from 'lucide-react-native';
import type { CampingPlace } from '../data/places';

interface PlaceDetailModalProps {
  place: CampingPlace | null;
  visible: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function PlaceDetailModal({ place, visible, onClose, isFavorite, onToggleFavorite }: PlaceDetailModalProps) {
  if (!place) return null;

  const openGoogleMaps = async () => {
    const { latitude, longitude } = place.coordinates;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Could not open Google Maps:', error);
      Alert.alert('Map unavailable', 'Please try again later.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: place.image }} style={styles.image} />
            <TouchableOpacity
              style={styles.modalHeart}
              onPress={onToggleFavorite}
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart size={21} color={isFavorite ? '#e11d48' : '#0f172a'} fill={isFavorite ? '#e11d48' : 'none'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close place details">
              <X size={20} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{place.category.toUpperCase()}</Text>
            </View>
            <Text style={styles.title}>{place.name}</Text>
            <View style={styles.locationRow}>
              <MapPin size={16} color="#64748b" />
              <Text style={styles.locationText}>{place.district} District</Text>
            </View>

            <View style={styles.overviewGrid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Difficulty</Text>
                <Text style={styles.gridValue}>{place.difficulty}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Water</Text>
                <Text style={styles.gridValue}>{place.waterAvailable ? 'Available' : 'No'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Campfire</Text>
                <Text style={styles.gridValue}>{place.campfireAllowed ? 'Allowed' : 'No'}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Key Features & Rules</Text>
            <View style={styles.rulesContainer}>
              <View style={[styles.ruleCard, place.waterAvailable ? styles.ruleGood : styles.ruleBad]}>
                <Droplet size={18} color={place.waterAvailable ? '#0284c7' : '#94a3b8'} />
                <Text style={styles.ruleText}>{place.waterAvailable ? 'Natural water source nearby (check safety)' : 'No natural water source listed nearby'}</Text>
              </View>
              <View style={[styles.ruleCard, place.campfireAllowed ? styles.ruleGood : styles.ruleBad]}>
                <Flame size={18} color={place.campfireAllowed ? '#e11d48' : '#94a3b8'} />
                <Text style={styles.ruleText}>{place.campfireAllowed ? 'Campfires marked as allowed in demo data' : 'Campfires marked as prohibited in demo data'}</Text>
              </View>
              <View style={[styles.ruleCard, place.vehicleAccess ? styles.ruleGood : styles.ruleBad]}>
                <CarFront size={18} color={place.vehicleAccess ? '#16a34a' : '#94a3b8'} />
                <Text style={styles.ruleText}>{place.vehicleAccess ? 'Vehicle access indicated' : 'No direct vehicle access indicated'}</Text>
              </View>
              <View style={[styles.ruleCard, place.permitRequired ? styles.ruleWarning : styles.ruleGood]}>
                <ShieldAlert size={18} color={place.permitRequired ? '#d97706' : '#16a34a'} />
                <Text style={styles.ruleText}>{place.permitRequired ? 'Permit indicated as required' : 'Permit not indicated in demo data'}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>About this spot</Text>
            <Text style={styles.description}>{place.description}</Text>

            <View style={styles.coordBox}>
              <Navigation size={18} color="#2563eb" />
              <Text style={styles.coordText}>GPS: {place.coordinates.latitude}, {place.coordinates.longitude}</Text>
            </View>
            <Text style={styles.disclaimer}>Sample data only. Verify GPS coordinates and current local access, permit and fire rules before travelling.</Text>
            <TouchableOpacity style={styles.mapsButton} onPress={openGoogleMaps} accessibilityRole="button" accessibilityLabel="Open location in Google Maps">
              <Navigation size={20} color="#ffffff" />
              <Text style={styles.mapsButtonText}>OPEN IN GOOGLE MAPS</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 20 },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 260 },
  modalHeart: {
    position: 'absolute', top: 16, left: 16, backgroundColor: '#fff',
    borderRadius: 24, padding: 10, elevation: 3,
  },
  closeButton: { position: 'absolute', top: 16, right: 16, backgroundColor: '#fff', borderRadius: 20, padding: 8, elevation: 3 },
  content: { padding: 20 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  categoryBadgeText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 16 },
  locationText: { fontSize: 14, color: '#64748b', marginLeft: 6 },
  overviewGrid: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 20, justifyContent: 'space-around' },
  gridItem: { alignItems: 'center' },
  gridLabel: { fontSize: 12, color: '#94a3b8' },
  gridValue: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 15, marginBottom: 10 },
  rulesContainer: { gap: 10 },
  ruleCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, gap: 10 },
  ruleGood: { backgroundColor: '#f0fdf4' },
  ruleBad: { backgroundColor: '#fef2f2' },
  ruleWarning: { backgroundColor: '#fffbeb' },
  ruleText: { fontSize: 13, color: '#334155', flex: 1 },
  description: { fontSize: 14, color: '#475569', lineHeight: 22 },
  coordBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 12, borderRadius: 10, marginTop: 20, gap: 8 },
  coordText: { fontSize: 13, color: '#1e40af', fontWeight: '600', flex: 1 },
  disclaimer: { marginTop: 12, color: '#9a6700', fontSize: 12, lineHeight: 18 },
  mapsButton: { backgroundColor: '#238653', paddingVertical: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20, marginBottom: 15 },
  mapsButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
