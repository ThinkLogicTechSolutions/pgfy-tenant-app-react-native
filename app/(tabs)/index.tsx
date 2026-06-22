/**
 * Home (v2) — location-aware discovery.
 * Prompts for the device location on load; the header shows the resolved city
 * or a "Choose location" trigger. Below: search, stay-type, "Near you",
 * "Popular areas", "Continue browsing", quick actions and the PGfy footer.
 * The previous home is preserved at `src/legacy/HomeScreenClassic.tsx`.
 */
import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius, shadows } from '@/theme';
import { Text, IconButton, PressableScale, Avatar, Button } from '@/components/ui';
import { CityTile, SectionHeader, CraftedFooter, PromotedBadge } from '@/components/domain';
import { locationPicker } from '@/store/locationPicker';
import { useTenantLocation } from '@/store/location';
import { useRecentlyViewed, recordView } from '@/store/recentlyViewed';
import { useSaved } from '@/store/saved';
import { LISTINGS, USER, unreadCount, listingsByIds, POPULAR_DESTINATIONS } from '@/data';
import { POPULAR_AREAS } from '@/data/popularAreas';
import { defaultCheckIn, defaultCheckOut } from '@/lib/dates';
import { listingSupportsBookingMode, getPromotedPgListingId } from '@/lib/listingDisplay';
import { inr } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import type { BookingMode, Gender, Listing } from '@/data/types';

const FALLBACK_CITY = 'Bengaluru';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function genderTag(gender: Gender): { label: string; bg: string; fg: string } {
  if (gender === 'Male') return { label: 'Boys', bg: palette.navyTint, fg: palette.navy };
  if (gender === 'Female') return { label: 'Girls', bg: palette.coralTint, fg: palette.coralDark };
  return { label: 'Co-living', bg: palette.infoTint, fg: palette.info };
}

function priceForMode(l: Listing, mode: BookingMode): { amount: number; unit: string } {
  if (mode === 'hourly' && l.hourlyPricing.length > 0) {
    return { amount: Math.min(...l.hourlyPricing.map((t) => t.rentPerHour)), unit: '/hr' };
  }
  if (mode === 'daily' && l.dailyPricing.length > 0) {
    return { amount: Math.min(...l.dailyPricing.map((t) => t.rentPerDay)), unit: '/day' };
  }
  return { amount: l.priceFrom, unit: '/month' };
}

const STAY_TYPES: { key: BookingMode; label: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; accent: string; tint: string }[] = [
  { key: 'monthly', label: 'Monthly', subtitle: 'Long term', icon: 'calendar-clear', accent: palette.navy, tint: palette.navyTint },
  { key: 'daily', label: 'Daily', subtitle: 'Short term', icon: 'partly-sunny', accent: palette.coral, tint: palette.coralTint },
  { key: 'hourly', label: 'Hourly', subtitle: 'By the hour', icon: 'hourglass', accent: palette.info, tint: palette.infoTint },
];

/** Split items into N-row columns for a 2-row horizontal rail. */
function intoColumns<T>(items: T[], rows = 2): T[][] {
  const cols: T[][] = [];
  for (let i = 0; i < items.length; i += rows) cols.push(items.slice(i, i + rows));
  return cols;
}

type QuickService = {
  key: string;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  wash: string;
};

const QUICK_SERVICES: QuickService[] = [
  { key: 'group', label: 'Group booking', subtitle: 'Book in bulk', icon: 'people', gradient: [palette.navy, palette.navyDark], wash: palette.navyTint },
  { key: 'metro', label: 'Metro Ticket', subtitle: 'Coming soon', icon: 'train', gradient: ['#3B82F6', '#1D5FD8'], wash: palette.infoTint },
  { key: 'refer', label: 'Refer App', subtitle: 'Invite & save', icon: 'gift', gradient: [palette.coral, palette.coralDark], wash: palette.coralTint },
];

function StayTypeCard({ item, active, onPress }: { item: (typeof STAY_TYPES)[number]; active: boolean; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.96}
      style={{
        flex: 1,
        borderRadius: radius.lg,
        borderWidth: 1.5,
        borderColor: active ? palette.navy : palette.border,
        backgroundColor: active ? palette.navyTint : palette.surface,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xs,
        alignItems: 'center',
        ...(active ? {} : shadows.card),
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: radius.md,
          backgroundColor: active ? palette.surface : item.tint,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        }}
      >
        <Ionicons name={item.icon} size={18} color={item.accent} />
      </View>
      <Text variant="bodySm" weight="700" color={active ? palette.navy : palette.ink} numberOfLines={1}>
        {item.label}
      </Text>
      <Text variant="caption" color={palette.inkTertiary} align="center" numberOfLines={1} style={{ marginTop: 1, fontSize: 11 }}>
        {item.subtitle}
      </Text>
    </PressableScale>
  );
}

function NearbyCard({
  listing,
  bookingType,
  promoted,
  saved,
  onToggleSave,
  onPress,
}: {
  listing: Listing;
  bookingType: BookingMode;
  promoted?: boolean;
  saved: boolean;
  onToggleSave: () => void;
  onPress: () => void;
}) {
  const tag = genderTag(listing.gender);
  const price = priceForMode(listing, bookingType);
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.97}
      style={{ width: 230, backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, overflow: 'hidden', ...shadows.card }}
    >
      <View>
        <Image source={{ uri: listing.coverImage }} style={{ width: '100%', height: 132 }} contentFit="cover" transition={200} />
        <View style={{ position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {promoted ? <PromotedBadge compact /> : null}
          <View style={{ backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3 }}>
            <Text variant="caption" weight="700" color={palette.ink}>{listing.distanceKm} km</Text>
          </View>
        </View>
        <View style={{ position: 'absolute', top: 6, right: 6 }}>
          <IconButton
            icon={saved ? 'heart' : 'heart-outline'}
            size={16}
            color={saved ? palette.coral : palette.ink}
            bg="rgba(255,255,255,0.94)"
            onPress={onToggleSave}
            style={{ width: 32, height: 32, borderRadius: 16 }}
          />
        </View>
      </View>
      <View style={{ padding: spacing.md, gap: 4 }}>
        <Text variant="bodySm" weight="700" numberOfLines={1}>{listing.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="star" size={13} color={palette.star} />
          <Text variant="caption" weight="600" color={palette.inkSecondary}>{listing.rating.toFixed(1)}</Text>
          <Text variant="caption" color={palette.inkTertiary} numberOfLines={1} style={{ flex: 1 }}>· {listing.locality}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <Text variant="bodySm" weight="700" mono color={palette.navy}>
            {inr(price.amount)}
            <Text variant="caption" color={palette.inkTertiary}> {price.unit}</Text>
          </Text>
          <View style={{ backgroundColor: tag.bg, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text variant="caption" weight="700" color={tag.fg}>{tag.label}</Text>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

function ContinueCard({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.97}
      style={{ width: 210, height: 150, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: palette.surfaceRaised }}
    >
      <Image source={{ uri: listing.coverImage }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
      <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(15,36,59,0.78)', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Ionicons name="time-outline" size={12} color={palette.white} />
        <Text variant="caption" weight="700" color={palette.white}>Viewed</Text>
      </View>
      <LinearGradient
        colors={['transparent', 'rgba(1,38,78,0.9)']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', justifyContent: 'flex-end', padding: spacing.sm }}
      >
        <Text variant="bodySm" weight="700" color={palette.white} numberOfLines={1}>{listing.name}</Text>
        <Text variant="bodySm" weight="700" color={palette.white} mono style={{ marginTop: 2 }}>
          {inr(listing.priceFrom)}<Text variant="caption" color="rgba(255,255,255,0.85)"> /month</Text>
        </Text>
        <Text variant="caption" color="rgba(255,255,255,0.85)" numberOfLines={1}>{listing.locality}</Text>
      </LinearGradient>
    </PressableScale>
  );
}

function QuickActionTile({ service, onPress }: { service: QuickService; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.95}
      style={{ flex: 1, borderRadius: radius.lg, backgroundColor: palette.surface, ...shadows.card }}
    >
      <View
        style={{
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: palette.border,
          overflow: 'hidden',
          alignItems: 'center',
          paddingTop: spacing.base,
          paddingBottom: spacing.md,
          paddingHorizontal: spacing.xs,
        }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '56%', backgroundColor: service.wash }} />
        <LinearGradient
          colors={service.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 50, height: 50, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm, ...shadows.raised }}
        >
          <Ionicons name={service.icon} size={24} color={palette.white} />
        </LinearGradient>
        <Text variant="bodySm" weight="700" align="center" numberOfLines={1}>{service.label}</Text>
        <Text variant="caption" color={palette.inkTertiary} align="center" numberOfLines={1} style={{ marginTop: 1 }}>
          {service.subtitle}
        </Text>
      </View>
    </PressableScale>
  );
}

function LocationPromptBanner({ onPress }: { onPress: () => void }) {
  return (
    <View style={{ marginTop: spacing.base, marginHorizontal: spacing.base, borderRadius: radius.xl, overflow: 'hidden', ...shadows.card }}>
      <LinearGradient
        colors={[palette.navy, palette.navyDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: spacing.lg }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="navigate" size={22} color={palette.white} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="h3" color={palette.white}>Where are you looking?</Text>
            <Text variant="bodySm" color="rgba(255,255,255,0.82)" style={{ marginTop: 2 }}>
              Set your location to discover verified stays near you.
            </Text>
          </View>
        </View>
        <Button label="Search location" icon="search" full size="md" onPress={onPress} style={{ marginTop: spacing.base }} />
      </LinearGradient>
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const firstName = USER.name.split(' ')[0] ?? USER.name;
  const saved = useSaved();
  const { location: geo, resolving: locating, attempted, detect, set: setLocation } = useTenantLocation();
  const { ids: viewedIds } = useRecentlyViewed();

  const [stayType, setStayType] = useState<BookingMode>('monthly');
  // Area filter within the resolved city (granted-location only).
  const [area, setArea] = useState<string | null>(null);

  // Prompt for the device location once on first load.
  useEffect(() => {
    if (!geo && !attempted) detect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCity = geo?.label ?? FALLBACK_CITY;
  // When located and an area is selected we search by it; otherwise by the city.
  const searchCity = geo && area ? area : activeCity;

  const stayDates = useMemo(() => {
    const checkIn = defaultCheckIn();
    return { checkIn, checkOut: defaultCheckOut(checkIn), startTime: '10:00', hours: 4 };
  }, []);

  const nearby = useMemo(() => {
    const supported = LISTINGS.filter((l) => listingSupportsBookingMode(l, stayType));
    const scoped = area
      ? supported.filter((l) => `${l.locality} ${l.city}`.toLowerCase().includes(area.toLowerCase()))
      : supported;
    return [...scoped].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 6);
  }, [stayType, area]);

  const promotedPgId = useMemo(() => getPromotedPgListingId(LISTINGS), []);

  const viewedListings = useMemo(() => listingsByIds(viewedIds), [viewedIds]);

  const searchParams = (extra?: Record<string, string>) => ({
    city: searchCity,
    checkIn: stayDates.checkIn,
    checkOut: stayDates.checkOut,
    bookingType: stayType,
    startTime: stayDates.startTime,
    hours: String(stayDates.hours),
    ...extra,
  });

  const listingParams = () => ({
    checkIn: stayDates.checkIn,
    checkOut: stayDates.checkOut,
    bookingType: stayType,
    startTime: stayDates.startTime,
    hours: String(stayDates.hours),
  });

  const goToResults = (extra?: Record<string, string>) => {
    router.push({ pathname: '/browse', params: searchParams(extra) });
  };

  const openListing = (id: string) => {
    recordView(id);
    router.push({ pathname: `/listing/${id}`, params: listingParams() });
  };

  const openLocationPicker = () => {
    haptic.select();
    locationPicker.open((picked) => {
      setLocation(picked, 'manual');
      setArea(null); // a new city clears the area filter
    });
    router.push('/location');
  };

  const openAreaPicker = () => {
    haptic.select();
    locationPicker.open((picked) => setArea(picked));
    router.push('/location');
  };

  const onQuickService = (key: string) => {
    haptic.select();
    if (key === 'group') return router.push('/group-booking');
    if (key === 'refer') return router.push('/referral');
    if (key === 'metro') {
      return router.push({
        pathname: '/coming-soon',
        params: { title: 'Metro Tickets', subtitle: 'Book metro tickets right inside PGfy. We’re working on it — stay tuned!', icon: 'train-outline' },
      });
    }
  };

  const locationLabel = geo ? geo.label : locating ? 'Locating…' : 'Choose location';
  const locationSubtitle = geo
    ? geo.source === 'gps'
      ? 'Using your current location'
      : 'Tap to change location'
    : locating
      ? 'Finding stays near you'
      : 'Set your location to see nearby stays';

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {/* Greeting + actions */}
        <View style={{ paddingHorizontal: spacing.base, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text variant="bodySm" color={palette.inkSecondary}>{greeting()},</Text>
            <Text variant="h2" numberOfLines={1}>{firstName} 👋</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <IconButton icon="notifications-outline" badge={unreadCount > 0} onPress={() => router.push('/notifications')} />
            <PressableScale onPress={() => router.push('/(tabs)/profile')} scaleTo={0.92}>
              <Avatar name={USER.name} uri={USER.avatar} size={42} ring />
            </PressableScale>
          </View>
        </View>

        {/* Location bar — shown once we have (or are resolving) a location */}
        {geo || locating ? (
          <PressableScale
            onPress={openLocationPicker}
            scaleTo={0.99}
            haptics={false}
            style={{ marginTop: spacing.md, marginHorizontal: spacing.base, alignSelf: 'flex-start' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name={geo ? 'location-sharp' : 'location-outline'} size={16} color={geo ? palette.navy : palette.inkTertiary} />
              <Text variant="bodyMd" weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>{locationLabel}</Text>
              <Ionicons name="chevron-down" size={15} color={palette.inkSecondary} />
            </View>
            <Text variant="caption" color={palette.inkTertiary} numberOfLines={1} style={{ marginLeft: 21, marginTop: 1 }}>
              {locationSubtitle}
            </Text>
          </PressableScale>
        ) : null}

        {/* Search + filter (located) / location prompt banner (no permission) */}
        {geo ? (
          <View
            style={{
              marginTop: spacing.base,
              marginHorizontal: spacing.base,
              flexDirection: 'row',
              alignItems: 'center',
              height: 50,
              backgroundColor: palette.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: palette.border,
              overflow: 'hidden',
              ...shadows.card,
            }}
          >
            <PressableScale
              onPress={openAreaPicker}
              scaleTo={0.995}
              haptics={false}
              style={{ flex: 1, height: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: spacing.base, paddingRight: area ? spacing.sm : spacing.base }}
            >
              <Ionicons name="search" size={18} color={palette.inkTertiary} />
              <Text variant="bodySm" color={area ? palette.ink : palette.inkTertiary} numberOfLines={1} style={{ flex: 1 }}>
                {area ? `Area · ${area}` : 'Search for an area…'}
              </Text>
              {area ? (
                <PressableScale onPress={() => setArea(null)} haptics={false} hitSlop={8} style={{ padding: 2 }}>
                  <Ionicons name="close-circle" size={18} color={palette.inkTertiary} />
                </PressableScale>
              ) : null}
            </PressableScale>
            <View style={{ width: 1, height: 22, backgroundColor: palette.border }} />
            <PressableScale
              onPress={() => goToResults({ openFilters: '1' })}
              scaleTo={0.9}
              style={{ height: '100%', justifyContent: 'center', paddingHorizontal: spacing.base }}
            >
              <Ionicons name="options-outline" size={19} color={palette.inkSecondary} />
            </PressableScale>
          </View>
        ) : (
          <LocationPromptBanner onPress={openLocationPicker} />
        )}

        {/* Stay type — only once a location is set */}
        {geo ? (
          <View style={{ marginTop: spacing.base, marginHorizontal: spacing.base, flexDirection: 'row', gap: spacing.sm }}>
            {STAY_TYPES.map((item) => (
              <StayTypeCard
                key={item.key}
                item={item}
                active={stayType === item.key}
                onPress={() => { haptic.select(); setStayType(item.key); }}
              />
            ))}
          </View>
        ) : null}

        {/* Near you — only when we know where the tenant is */}
        {geo ? (
          <>
            <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.base }}>
              <SectionHeader
                title={area ? `Stays in ${area}` : 'Near you'}
                subtitle={area ? 'Filtered by your selected area' : 'Top picks around your location'}
                actionLabel="See all"
                onAction={() => goToResults()}
              />
            </View>
            {nearby.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.base }}
                nestedScrollEnabled
              >
                {nearby.map((listing) => (
                  <NearbyCard
                    key={listing.id}
                    listing={listing}
                    bookingType={stayType}
                    promoted={listing.id === promotedPgId}
                    saved={saved.isSaved(listing.id)}
                    onToggleSave={() => saved.toggle(listing.id)}
                    onPress={() => openListing(listing.id)}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={{ marginHorizontal: spacing.base, paddingVertical: spacing.lg, paddingHorizontal: spacing.base, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, alignItems: 'center', gap: 6 }}>
                <Ionicons name="search-outline" size={22} color={palette.inkTertiary} />
                <Text variant="bodySm" color={palette.inkSecondary} align="center">
                  No stays in {area} yet.
                </Text>
                <Button label="Show all areas" variant="ghost" size="sm" onPress={() => setArea(null)} />
              </View>
            )}
          </>
        ) : null}

        {/* Popular areas (located) / Popular destinations (no location) */}
        {geo ? (
          <>
            <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.base }}>
              <SectionHeader
                title="Popular areas"
                subtitle="Explore by popular neighbourhoods"
                actionLabel="See all"
                onAction={() => router.push('/popular-areas')}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.base }}
              nestedScrollEnabled
            >
              {intoColumns(POPULAR_AREAS).map((column, columnIndex) => (
                <View key={`area-col-${columnIndex}`} style={{ gap: spacing.md }}>
                  {column.map((area) => (
                    <CityTile
                      key={area.id}
                      label={area.name}
                      landmarkId="cityscape"
                      accent={area.accent}
                      image={area.image}
                      onPress={() => { haptic.select(); router.push({ pathname: '/browse', params: searchParams({ city: area.name }) }); }}
                    />
                  ))}
                </View>
              ))}
            </ScrollView>
          </>
        ) : (
          <>
            <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.base }}>
              <SectionHeader
                title="Popular destinations"
                subtitle="Explore stays across cities"
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.base }}
              nestedScrollEnabled
            >
              {intoColumns(POPULAR_DESTINATIONS).map((column, columnIndex) => (
                <View key={`dest-col-${columnIndex}`} style={{ gap: spacing.md }}>
                  {column.map((dest) => (
                    <CityTile
                      key={dest.id}
                      label={dest.name}
                      landmarkId={dest.landmarkId}
                      image={dest.image}
                      onPress={() => { haptic.select(); setLocation(dest.name, 'manual'); router.push({ pathname: '/browse', params: searchParams({ city: dest.name }) }); }}
                    />
                  ))}
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Continue browsing */}
        {viewedListings.length > 0 ? (
          <>
            <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.base }}>
              <SectionHeader
                title="Continue browsing"
                subtitle="Pick up where you left off"
                actionLabel="See all"
                onAction={() => router.push('/continue-browsing')}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.base }}
              nestedScrollEnabled
            >
              {viewedListings.map((listing) => (
                <ContinueCard key={listing.id} listing={listing} onPress={() => openListing(listing.id)} />
              ))}
            </ScrollView>
          </>
        ) : null}

        {/* Quick actions (replaces the old promo banner) */}
        <Text variant="h3" style={{ marginTop: spacing.xl, marginBottom: spacing.md, paddingHorizontal: spacing.base }}>
          Quick actions
        </Text>
        <View style={{ paddingHorizontal: spacing.base, flexDirection: 'row', gap: spacing.md }}>
          {QUICK_SERVICES.map((service) => (
            <QuickActionTile key={service.key} service={service} onPress={() => onQuickService(service.key)} />
          ))}
        </View>

        <View style={{ paddingHorizontal: spacing.base }}>
          <CraftedFooter />
        </View>
      </ScrollView>
    </View>
  );
}
