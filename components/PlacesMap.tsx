
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { CampingPlace } from '../data/places';

// Define the data received from App.tsx
interface PlacesMapProps {
  places: CampingPlace[];
  onSelectPlace: (place: CampingPlace) => void;
  userLocation?: {
    latitude: number;
    longitude: number;
} | null;
}

export default function PlacesMap({
  places,
  onSelectPlace,
  userLocation,
}: PlacesMapProps) {
    const mapRef = useRef<MapView>(null);
    const [mapReady, setMapReady] = React.useState(false);

    useEffect(() => {
  if (!mapRef.current || places.length === 0) return;
  if (!mapReady || !mapRef.current || places.length === 0) return;

  if (places.length === 1) {
    const { latitude, longitude } = places[0].coordinates;

    mapRef.current.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      },
      700
    );
  } else {
    mapRef.current.fitToCoordinates(
      places.map(place => place.coordinates),
      {
        edgePadding: {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50,
        },
        animated: true,
      }
    );
  }
}, [places, mapReady]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        onLayout={() => setMapReady(true)}
        initialRegion={{
          latitude: 7.3,
          longitude: 80.7,
          latitudeDelta: 2.5,
          longitudeDelta: 2.5,
        }}
      >
        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={place.coordinates}
            title={place.name}
            description={place.district}
            onPress={() => onSelectPlace(place)}
          />
        ))}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="My Location"
            description="Your current position"
            pinColor="blue"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },
});
