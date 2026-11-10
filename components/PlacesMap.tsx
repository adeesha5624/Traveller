
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { CampingPlace } from '../data/places';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface PlacesMapProps {
  places: CampingPlace[];
  onSelectPlace: (place: CampingPlace) => void;
  userLocation?: Coordinates | null;
  focusMyLocation?: boolean;
}

export default function PlacesMap({
  places,
  onSelectPlace,
  userLocation,
  focusMyLocation = false,
}: PlacesMapProps) {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);

  // Used to detect changes in the locations shown
  const placesKey = places
    .map(
      (place) =>
        `${place.id}:${place.coordinates.latitude}:${place.coordinates.longitude}`
    )
    .join('|');

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    // MODE 1: Focus on user's GPS location
    if (focusMyLocation && userLocation) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        800
      );

      return;
    }

    // MODE 2: Focus on matching camping locations
    if (places.length === 0) return;

    if (places.length === 1) {
      const { latitude, longitude } =
        places[0].coordinates;

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
        places.map((place) => place.coordinates),
        {
          edgePadding: {
            top: 60,
            right: 60,
            bottom: 60,
            left: 60,
          },
          animated: true,
        }
      );
    }
  }, [
    mapReady,
    focusMyLocation,
    userLocation?.latitude,
    userLocation?.longitude,
    placesKey,
  ]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        onMapReady={() => setMapReady(true)}
        initialRegion={{
          latitude: 7.3,
          longitude: 80.7,
          latitudeDelta: 2.5,
          longitudeDelta: 2.5,
        }}
      >
        {/* Camping and hiking locations */}
        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={place.coordinates}
            title={place.name}
            description={place.district}
            onPress={() => onSelectPlace(place)}
          />
        ))}

        {/* Current GPS location */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="My Current Location"
            description="Your current GPS position"
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
