/** T-S11 — Map view (real Google Maps with pins from listing coordinates + horizontal preview cards). */
import { useRef, useState } from 'react';
import { View, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import RNMapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { palette, spacing, radius, shadows } from '@/theme';
import { Text, IconButton, PressableScale, EmptyState } from '@/components/ui';
import { RatingPill } from '@/components/domain';
import { EmptySearch } from '@/components/illustrations';
import { useMapResults } from '@/store/mapResults';
import { showAlert } from '@/lib/alert';
import { haptic } from '@/lib/haptics';
import type { Listing } from '@/data/types';
import { inr } from '@/lib/format';

const DEFAULT_DELTA = 0.02;

function regionFor(lat: number, lng: number, delta = DEFAULT_DELTA): Region {
  return { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta };
}

function regionForListings(listings: Listing[]): Region {
  const lats = listings.map((l) => l.lat);
  const lngs = listings.map((l) => l.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(maxLat - minLat, DEFAULT_DELTA) * 1.6,
    longitudeDelta: Math.max(maxLng - minLng, DEFAULT_DELTA) * 1.6,
  };
}

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const mapRef = useRef<RNMapView>(null);
  const [selected, setSelected] = useState(0);
  const [locating, setLocating] = useState(false);
  const listings = useMapResults();

  const cardWidth = Math.min(300, width * 0.82);
  const cardGap = spacing.md;
  const cardStep = cardWidth + cardGap;

  const selectListing = (index: number) => {
    const i = Math.max(0, Math.min(index, listings.length - 1));
    setSelected(i);
    scrollRef.current?.scrollTo({ x: i * cardStep, animated: true });
    mapRef.current?.animateToRegion(regionFor(listings[i].lat, listings[i].lng), 350);
  };

  const goToMyLocation = async () => {
    haptic.light();
    setLocating(true);
    try {
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Location permission needed', 'Allow location access to center the map on where you are.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      mapRef.current?.animateToRegion(regionFor(pos.coords.latitude, pos.coords.longitude, 0.01), 500);
    } catch {
      showAlert('Could not get your location', 'Please try again.');
    } finally {
      setLocating(false);
    }
  };

  if (listings.length === 0) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
        <View style={{ paddingHorizontal: spacing.base, paddingBottom: spacing.sm }}>
          <IconButton icon="chevron-back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={{ borderRadius: 21 }} />
        </View>
        <EmptyState illustration={<EmptySearch />} title="No properties to show" message="Go back and search or browse properties first." />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.navyTint }}>
      <RNMapView
        ref={mapRef}
        style={{ position: 'absolute', inset: 0 }}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={regionForListings(listings)}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {listings.map((l, i) => {
          const active = i === selected;
          return (
            <Marker
              key={l.id}
              coordinate={{ latitude: l.lat, longitude: l.lng }}
              onPress={() => selectListing(i)}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View
                style={{
                  backgroundColor: active ? palette.coral : palette.navy,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  ...(active ? shadows.floating : shadows.card),
                  transform: [{ scale: active ? 1.08 : 1 }],
                }}
              >
                <Ionicons name="home" size={12} color={palette.white} />
                <Text variant="caption" weight="700" color={palette.white} style={{ fontSize: 11 }}>
                  {inr(l.priceFrom)}
                </Text>
              </View>
            </Marker>
          );
        })}
      </RNMapView>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.base }}>
        <IconButton icon="chevron-back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={{ borderRadius: 21 }} />
        <IconButton icon={locating ? 'ellipsis-horizontal' : 'locate'} color={palette.navy} onPress={goToMyLocation} />
      </View>

      <PressableScale
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 150,
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: palette.navy,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 999,
          ...shadows.floating,
        }}
      >
        <Ionicons name="list" size={16} color={palette.white} />
        <Text variant="bodySm" weight="600" color={palette.white}>
          List view
        </Text>
      </PressableScale>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardStep}
        snapToAlignment="start"
        contentContainerStyle={{
          paddingHorizontal: spacing.base,
          gap: cardGap,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.base,
        }}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / cardStep);
          selectListing(idx);
        }}
      >
        {listings.map((listing, i) => (
          <MapPreviewCard
            key={listing.id}
            listing={listing}
            width={cardWidth}
            active={i === selected}
            onPress={() => router.push(`/listing/${listing.id}`)}
            onFocus={() => selectListing(i)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function MapPreviewCard({
  listing,
  width,
  active,
  onPress,
  onFocus,
}: {
  listing: Listing;
  width: number;
  active: boolean;
  onPress: () => void;
  onFocus: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      onPressIn={onFocus}
      scaleTo={0.98}
      style={{
        width,
        backgroundColor: palette.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        flexDirection: 'row',
        gap: spacing.md,
        borderWidth: active ? 2 : 1,
        borderColor: active ? palette.coral : palette.border,
        ...shadows.floating,
      }}
    >
      <Image source={{ uri: listing.coverImage }} style={{ width: 80, height: 80, borderRadius: radius.md }} contentFit="cover" />
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
            <Text variant="bodyMd" weight="700" numberOfLines={1} style={{ flex: 1 }}>
              {listing.name}
            </Text>
            <RatingPill rating={listing.rating} />
          </View>
          <Text variant="caption" color={palette.inkSecondary} numberOfLines={1}>
            {listing.locality} · {listing.type} · {listing.distanceKm} km
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="bodyMd" weight="700" mono color={palette.navy}>
            {inr(listing.priceFrom)}
            <Text variant="caption" color={palette.inkTertiary}>
              /mo
            </Text>
          </Text>
          <Text variant="caption" color={listing.vacantBeds <= 2 ? palette.coralDark : palette.success}>
            {listing.vacantBeds} beds left
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}
