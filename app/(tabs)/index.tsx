/** Home — location, stay dates, search, and top PGs. */
import { useMemo, useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, spacing, radius } from '@/theme';
import { Text, Button, IconButton, PressableScale } from '@/components/ui';
import { ListingCard, CraftedFooter } from '@/components/domain';
import { LocationSearchTrigger } from '@/components/search/LocationAutocomplete';
import { locationPicker } from '@/store/locationPicker';
import { StayDateRangeField } from '@/components/search/StayDateRangeField';
import { LISTINGS, USER, unreadCount } from '@/data';
import { POPULAR_DESTINATIONS, type PopularDestination } from '@/data/popularDestinations';
import { isBefore } from '@/lib/dates';
import { defaultCheckIn, defaultCheckOut } from '@/lib/dates';
import { haptic } from '@/lib/haptics';

const DESTINATION_CARD_WIDTH = 132;
const DESTINATION_CARD_HEIGHT = 164;
const DESTINATION_GRID_ROWS = 2;

/** Resolved once at module load — avoids barrel/circular import leaving the export undefined. */
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
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(() => defaultCheckOut(defaultCheckIn()));

  const topPgs = useMemo(
    () => [...LISTINGS].filter((l) => l.type === 'PG').sort((a, b) => b.rating - a.rating).slice(0, 5),
    [],
  );

  const browseWithLocation = (city: string) => {
    router.push({
      pathname: '/browse',
      params: { city: city.trim(), checkIn, checkOut },
    });
  };

  const search = () => {
    if (!location.trim()) {
      Alert.alert('Location required', 'Choose where you want to stay.');
      return;
    }
    if (!checkIn || !checkOut) {
      Alert.alert('Dates required', 'Select check-in and check-out dates.');
      return;
    }
    if (isBefore(checkOut, checkIn) || checkOut === checkIn) {
      Alert.alert('Check dates', 'Check-out must be after check-in.');
      return;
    }
    browseWithLocation(location);
  };

  const openDestination = (name: string) => {
    haptic.select();
    setLocation(name);
    browseWithLocation(name);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing['3xl'] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <Text variant="h2" numberOfLines={1} style={{ flex: 1 }}>
            {greeting()}, {firstName}
          </Text>
          <IconButton icon="notifications-outline" badge={unreadCount > 0} onPress={() => router.push('/notifications')} />
        </View>

        <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
          <LocationSearchTrigger
            value={location}
            onPress={() => {
              locationPicker.open((loc) => setLocation(loc));
              router.push('/location');
            }}
          />
          <StayDateRangeField
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={({ checkIn: ci, checkOut: co }) => {
              setCheckIn(ci);
              setCheckOut(co);
            }}
          />
          <Button label="Search" icon="search" full size="lg" onPress={search} disabled={!location.trim()} />
        </View>

        <Text variant="h3" style={{ marginBottom: spacing.sm }}>
          Popular destinations
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.base }}
          style={{ marginBottom: 0 }}
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
              badgeLabels={listing.gender === 'Female' ? ['Highly rated by women'] : []}
              onPress={() => router.push({
                pathname: `/listing/${listing.id}`,
                params: { checkIn, checkOut },
              })}
            />
          ))}
        </View>

        <CraftedFooter />
      </ScrollView>
    </View>
  );
}
