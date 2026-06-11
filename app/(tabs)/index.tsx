/** Home — location, stay dates, search, and top PGs. */
import { useMemo, useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, spacing, radius } from '@/theme';
import { Text, IconButton, PressableScale } from '@/components/ui';
import { ListingCard, CraftedFooter } from '@/components/domain';
import { HomeSearchCard, type StayBookingValues } from '@/components/search';
import { locationPicker } from '@/store/locationPicker';
import { LISTINGS, USER, unreadCount } from '@/data';
import { POPULAR_DESTINATIONS, type PopularDestination } from '@/data/popularDestinations';
import { isBefore } from '@/lib/dates';
import { defaultCheckIn, defaultCheckOut } from '@/lib/dates';
import { listingSupportsBookingMode, getPromotedPgListingId } from '@/lib/listingDisplay';
import { haptic } from '@/lib/haptics';
import type { BookingMode } from '@/data/types';

const DESTINATION_CARD_WIDTH = 132;
const DESTINATION_CARD_HEIGHT = 164;
const DESTINATION_GRID_ROWS = 2;

const popularDestinations = POPULAR_DESTINATIONS;

function destinationColumns(items: PopularDestination[], rows = DESTINATION_GRID_ROWS) {
  const columns: PopularDestination[][] = [];
  for (let i = 0; i < items.length; i += rows) {
    columns.push(items.slice(i, i + rows));
  }
  return columns;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function defaultStayValues(): StayBookingValues {
  const checkIn = defaultCheckIn();
  return {
    checkIn,
    checkOut: defaultCheckOut(checkIn),
    startTime: '10:00',
    hours: 4,
  };
}

function DestinationCard({ dest, onPress }: { dest: PopularDestination; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.97}
      style={{
        width: DESTINATION_CARD_WIDTH,
        height: DESTINATION_CARD_HEIGHT,
        borderRadius: radius.lg,
        overflow: 'hidden',
        backgroundColor: palette.surfaceRaised,
      }}
    >
      <Image source={{ uri: dest.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(1,38,78,0.85)']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '58%', justifyContent: 'flex-end', padding: spacing.sm }}
      >
        <Text variant="bodySm" weight="700" color={palette.white} numberOfLines={1}>
          {dest.name}
        </Text>
        <Text variant="caption" color="rgba(255,255,255,0.88)" style={{ marginTop: 2 }} numberOfLines={1}>
          {dest.subtitle}
        </Text>
      </LinearGradient>
    </PressableScale>
  );
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const firstName = USER.name.split(' ')[0] ?? USER.name;

  const [location, setLocation] = useState('');
  const [stayType, setStayType] = useState<BookingMode>('monthly');
  const [stayValues, setStayValues] = useState<StayBookingValues>(defaultStayValues);

  const promotedPgId = useMemo(() => getPromotedPgListingId(LISTINGS), []);

  const topPgs = useMemo(
    () => [...LISTINGS]
      .filter((l) => l.type === 'PG')
      .filter((l) => listingSupportsBookingMode(l, stayType))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5),
    [stayType],
  );

  const searchParams = () => ({
    city: location.trim(),
    checkIn: stayValues.checkIn,
    checkOut: stayValues.checkOut,
    bookingType: stayType,
    startTime: stayValues.startTime,
    hours: String(stayValues.hours),
  });

  const browseWithLocation = (city: string) => {
    router.push({
      pathname: '/browse',
      params: { ...searchParams(), city: city.trim() },
    });
  };

  const validateSearch = (city = location): boolean => {
    if (!city.trim()) {
      Alert.alert('Location required', 'Choose where you want to stay.');
      return false;
    }
    if (!stayValues.checkIn) {
      Alert.alert('Date required', 'Select your stay date.');
      return false;
    }
    if (stayType === 'daily') {
      if (!stayValues.checkOut) {
        Alert.alert('Dates required', 'Select check-in and check-out dates.');
        return false;
      }
      if (isBefore(stayValues.checkOut, stayValues.checkIn) || stayValues.checkOut === stayValues.checkIn) {
        Alert.alert('Check dates', 'Check-out must be after check-in.');
        return false;
      }
    }
    if (stayType === 'hourly') {
      if (!stayValues.startTime) {
        Alert.alert('Time required', 'Select a start time for your hourly stay.');
        return false;
      }
      if (!stayValues.hours || stayValues.hours < 1) {
        Alert.alert('Duration required', 'Select how many hours you need (1–18).');
        return false;
      }
    }
    return true;
  };

  const search = () => {
    if (!validateSearch()) return;
    browseWithLocation(location);
  };

  const openDestination = (name: string) => {
    haptic.select();
    setLocation(name);
    if (!validateSearch(name)) return;
    router.push({
      pathname: '/browse',
      params: { ...searchParams(), city: name.trim() },
    });
  };

  const listingParams = () => ({
    checkIn: stayValues.checkIn,
    checkOut: stayValues.checkOut,
    bookingType: stayType,
    startTime: stayValues.startTime,
    hours: String(stayValues.hours),
  });

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing['3xl'] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <Text variant="h2" numberOfLines={1} style={{ flex: 1 }}>
            {greeting()}, {firstName}
          </Text>
          <IconButton icon="notifications-outline" badge={unreadCount > 0} onPress={() => router.push('/notifications')} />
        </View>

        <HomeSearchCard
          stayType={stayType}
          onStayTypeChange={setStayType}
          location={location}
          onLocationPress={() => {
            locationPicker.open((loc) => setLocation(loc));
            router.push('/location');
          }}
          stayValues={stayValues}
          onStayValuesChange={setStayValues}
          onSearch={search}
          searchDisabled={!location.trim()}
        />

        <Text variant="h3" style={{ marginBottom: spacing.sm, marginTop: spacing.xl }}>
          Popular destinations
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.base }}
          style={{ marginBottom: 0 }}
          nestedScrollEnabled
        >
          {destinationColumns(popularDestinations).map((column, columnIndex) => (
            <View key={`col-${columnIndex}`} style={{ gap: spacing.md }}>
              {column.map((dest) => (
                <DestinationCard key={dest.id} dest={dest} onPress={() => openDestination(dest.name)} />
              ))}
            </View>
          ))}
        </ScrollView>

        <Text variant="h3" style={{ marginBottom: spacing.md, marginTop: 22 }}>
          Top PGs for you
        </Text>
        <View style={{ gap: spacing.md }}>
          {topPgs.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              titleFormat="nearLandmark"
              showDistance={false}
              showMeta={false}
              promoted={listing.id === promotedPgId}
              bookingType={stayType}
              badgeLabels={listing.gender === 'Female' ? ['Highly rated by women'] : []}
              onPress={() => router.push({
                pathname: `/listing/${listing.id}`,
                params: listingParams(),
              })}
            />
          ))}
        </View>

        <CraftedFooter />
      </ScrollView>
    </View>
  );
}
