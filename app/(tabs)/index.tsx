/**
 * Home (v2) — location-aware discovery.
 * Prompts for the device location on load; the header shows the resolved city
 * or a "Choose location" trigger. Below: search, stay-type, "Near you",
 * "Popular areas", "Continue browsing", quick actions and the PGfy footer.
 * The previous home is preserved at `src/legacy/HomeScreenClassic.tsx`.
 */
import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { palette, spacing, radius, shadows, fontFamily } from '@/theme';
import { Text, IconButton, PressableScale, Avatar, Button, EmptyState, Skeleton, VoiceWaveIcon, VoiceSearchSheet } from '@/components/ui';
import { CityTile, SectionHeader, CraftedFooter, PromotedBadge } from '@/components/domain';
import { locationPicker } from '@/store/locationPicker';
import { useTenantLocation } from '@/store/location';
import { recordView } from '@/store/recentlyViewed';
import { useSaved } from '@/store/saved';
import { useAuth } from '@/context/AuthContext';
import { dashboardApi, continueBrowsingApi, notificationsApi, errorMessage, type LocalityMaster, type DashboardPropertyCategory } from '@/lib/api';
import { continueBrowsingToListing } from '@/lib/listingAdapter';
import { defaultCheckIn, defaultCheckOut } from '@/lib/dates';
import { inr } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import type { BookingMode, Gender, Listing } from '@/data/types';
import { EmptyLocation, type LandmarkId } from '@/components/illustrations';
import { useMasterData } from '@/context/MasterDataContext';

const AREA_TILE_ACCENTS = ['#3B82F6', '#1FB573', '#7C5CFC', '#F5A623', '#FF4B3E', '#01264E'];

const FALLBACK_CITY = 'Bengaluru';

/** Home no longer selects a booking mode (it's chosen inside property details), so navigation
 * params that still expect one get this constant default instead of a user selection. */
const DEFAULT_BOOKING_TYPE: BookingMode = 'monthly';

/** Built-in landmark art for well-known cities; anything else falls back to a generic skyline. */
const CITY_LANDMARKS: Record<string, LandmarkId> = {
  Bengaluru: 'vidhanaSoudha',
  Chennai: 'gopuram',
  Hyderabad: 'charminar',
  Pune: 'fort',
  Mumbai: 'gateway',
  Delhi: 'indiaGate',
  'Delhi NCR': 'indiaGate',
  Kolkata: 'victoria',
  Ahmedabad: 'mosque',
};

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

/** Home's "near you" category tabs — booking mode (monthly/daily/hourly) is chosen inside
 * property details instead, so it's no longer a Home-level filter. `'ALL'` (the default) sends
 * no category filter to the dashboard API; the other two map to `DashboardPropertyCategory`. */
type CategoryTab = 'ALL' | DashboardPropertyCategory;

const CATEGORY_TABS: { key: CategoryTab; label: string; icon: keyof typeof Ionicons.glyphMap; accent: string }[] = [
  { key: 'ALL', label: 'All', icon: 'grid', accent: palette.navy },
  { key: 'HOSTEL', label: 'PGs / Hostels', icon: 'bed', accent: palette.navy },
  { key: 'FLAT', label: 'Flats', icon: 'business', accent: palette.success },
  { key: 'HOMESTAY', label: 'HomeStays', icon: 'home', accent: '#7C5CFC' },
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
  icon: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
  iconFamily?: 'Ionicons' | 'MaterialCommunityIcons';
  gradient: [string, string];
  wash: string;
};

const QUICK_SERVICES: QuickService[] = [
  { key: 'group', label: 'Group booking', subtitle: 'Book in bulk', icon: 'people', gradient: [palette.navy, palette.navyDark], wash: palette.navyTint },
  { key: 'invite', label: 'Invite a PG', subtitle: 'Refer a PG', icon: 'business', gradient: [palette.success, '#178A57'], wash: palette.successTint },
  { key: 'metro', label: 'Metro Ticket', subtitle: 'Coming soon', icon: 'train', gradient: ['#3B82F6', '#1D5FD8'], wash: palette.infoTint },
  { key: 'refer', label: 'Refer App', subtitle: 'Invite & save', icon: 'gift', gradient: [palette.coral, palette.coralDark], wash: palette.coralTint },
  { key: 'packers-movers', label: 'Packers & Movers', subtitle: 'Move with ease', icon: 'truck-cargo-container', iconFamily: 'MaterialCommunityIcons', gradient: ['#A855F7', '#7E22CE'], wash: '#FAF5FF' },
  { key: 'storage', label: 'Storage Solutions', subtitle: 'Store with ease', icon: 'warehouse', iconFamily: 'MaterialCommunityIcons', gradient: ['#6366F1', '#4338CA'], wash: '#EEF2FF' },
];

function CategoryTabCard({ item, active, onPress }: { item: (typeof CATEGORY_TABS)[number]; active: boolean; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.96}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: radius.pill,
        borderWidth: active ? 1.5 : 1,
        borderColor: active ? palette.navy : palette.border,
        backgroundColor: palette.surface,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        ...shadows.card,
      }}
    >
      <Ionicons name={item.icon} size={18} color={item.accent} />
      <Text variant="bodySm" weight="700" color={palette.ink} numberOfLines={1}>
        {item.label}
      </Text>
    </PressableScale>
  );
}

function NearbyCard({
  listing,
  promoted,
  saved,
  onToggleSave,
  onPress,
}: {
  listing: Listing;
  promoted?: boolean;
  saved: boolean;
  onToggleSave: () => void;
  onPress: () => void;
}) {
  const tag = genderTag(listing.gender);
  // Near-you cards never carry per-mode pricing (see `continueBrowsingToListing`), so this was
  // always effectively `priceFrom` + "/month" regardless of any stay-type selection.
  const price = { amount: listing.priceFrom, unit: '/month' };
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
          {price.amount > 0 ? (
            <Text variant="bodySm" weight="700" mono color={palette.navy}>
              {inr(price.amount)}<Text variant="caption" color={palette.inkTertiary}> {price.unit}</Text>
            </Text>
          ) : <View />}
          <View style={{ backgroundColor: tag.bg, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text variant="caption" weight="700" color={tag.fg}>{tag.label}</Text>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

/** Mirrors `NearbyCard`'s layout (230-wide cover + name/rating/price rows) so the shimmer
 * doesn't jump when the real cards swap in. */
function NearbyCardSkeleton() {
  return (
    <View style={{ width: 230, backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' }}>
      <Skeleton width="100%" height={132} rounded={0} />
      <View style={{ padding: spacing.md, gap: 8 }}>
        <Skeleton width="80%" height={14} />
        <Skeleton width="55%" height={12} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
          <Skeleton width={70} height={14} />
          <Skeleton width={50} height={18} rounded={radius.pill} />
        </View>
      </View>
    </View>
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
          {service.iconFamily === 'MaterialCommunityIcons' ? (
              <MaterialCommunityIcons name={service.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={24} color={palette.white} />
            ) : (
              <Ionicons name={service.icon as keyof typeof Ionicons.glyphMap} size={24} color={palette.white} />
          )}
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

function NotOperationalSection({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <View
      style={{
        marginTop: spacing.base,
        marginHorizontal: spacing.base,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.surface,
        ...shadows.card,
      }}
    >
      <EmptyState
        illustration={<EmptyLocation size={130} />}
        title="We're not in this area yet"
        message={`We're not operational at ${label} yet. Try searching for a different city or area we serve.`}
        actionLabel="Try a different location"
        onAction={onPress}
        compact
      />
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const displayName = user?.name ?? '';
  const firstName = displayName.split(' ')[0] || displayName;
  const saved = useSaved();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Just need to know if *any* are unread for the badge dot — a small page is enough.
    notificationsApi.listNotifications({ limit: 20 })
      .then((page) => setHasUnreadNotifications(page.data.some((n) => n.status === 'UNSEEN')))
      .catch(() => {});
  }, [user]);
  const { location: geo, resolving: locating, attempted, detect, set: setLocation } = useTenantLocation();
  const operational = !!geo && geo.operational;
  const { popularDestinations } = useMasterData();

  const popularTiles = useMemo(
    () =>
      popularDestinations
        // Defensive: a destination row whose eager-loaded `city` failed to join (deleted/
        // inactive city_id) would otherwise throw here and blank the whole Home screen.
        .filter((d) => d.status === 'ACTIVE' && !!d.city?.name)
        .sort((a, b) => a.priority - b.priority)
        .map((d) => ({
          id: String(d.id),
          name: d.city.name,
          image: d.avatar?.link,
          landmarkId: CITY_LANDMARKS[d.city.name] ?? 'cityscape',
        })),
    [popularDestinations],
  );

  // Home's own "near you" category filter — booking mode (monthly/daily/hourly) is chosen
  // inside property details instead, via `BrowseFiltersSheet`'s own `bookingType` (defaulted
  // below, unrelated to this).
  const [categoryFilter, setCategoryFilter] = useState<CategoryTab>('ALL');
  // Free-text "property or PGID" search — submits to /tenant/search.
  const [searchQuery, setSearchQuery] = useState('');

  // Prompt for the device location once on first load.
  useEffect(() => {
    if (!geo && !attempted) detect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCity = geo?.label ?? FALLBACK_CITY;
  const searchCity = activeCity;

  // Deliberately not memoized — "today" must never freeze for the lifetime of this screen
  // (the Home tab can stay mounted for days), or a listing tapped straight off Home without
  // ever opening the filter sheet would carry a stale, possibly past-dated check-in.
  const stayDates = (() => {
    const checkIn = defaultCheckIn();
    return { checkIn, checkOut: defaultCheckOut(checkIn), startTime: '10:00', hours: 4 };
  })();


  // "Near you" + "Popular areas" — location-scoped, from the tenant dashboard API.
  const [nearYou, setNearYou] = useState<Listing[]>([]);
  const [nearYouPromotedIds, setNearYouPromotedIds] = useState<Set<string>>(new Set());
  const [popularAreas, setPopularAreas] = useState<LocalityMaster[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    if (!operational || !geo?.cityId) {
      setNearYou([]);
      setNearYouPromotedIds(new Set());
      setPopularAreas([]);
      return;
    }
    let active = true;
    setDashboardLoading(true);
    setDashboardError(null);
    const coordinates: [number, number] | undefined =
      geo.source === 'gps' && geo.lat != null && geo.lng != null ? [geo.lat, geo.lng] : undefined;
    dashboardApi
      .getDashboard({
        cityId: geo.cityId,
        coordinates,
        ...(categoryFilter === 'ALL' ? {} : { propertyCategory: categoryFilter }),
      })
      .then((res) => {
        if (!active) return;
        setNearYou(res.near_you.map(continueBrowsingToListing));
        setNearYouPromotedIds(new Set(res.near_you.filter((p) => p.is_promoted).map((p) => `cb-${p.id}`)));
        setPopularAreas(res.popular_areas);
      })
      .catch((e) => {
        if (!active) return;
        setDashboardError(errorMessage(e));
        setNearYou([]);
        setPopularAreas([]);
      })
      .finally(() => {
        if (active) setDashboardLoading(false);
      });
    return () => {
      active = false;
    };
  }, [operational, geo?.cityId, geo?.lat, geo?.lng, geo?.source, categoryFilter]);

  // The dashboard call above is already scoped to `categoryFilter` via `property_category`.
  const nearby = nearYou;

  // "Continue browsing" — the tenant's recently-viewed properties, from the backend.
  const [recentListings, setRecentListings] = useState<Listing[]>([]);

  useEffect(() => {
    let active = true;
    continueBrowsingApi
      .getContinueBrowsing({ limit: 10 })
      .then((page) => {
        if (active) setRecentListings(page.data.map(continueBrowsingToListing));
      })
      .catch(() => {
        if (active) setRecentListings([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // Booking mode is now picked inside property details (or inside the filter sheet), not on
  // Home — these just seed a sensible default for screens that still expect the param.
  const searchParams = (extra?: Record<string, string>) => ({
    city: searchCity,
    checkIn: stayDates.checkIn,
    checkOut: stayDates.checkOut,
    bookingType: DEFAULT_BOOKING_TYPE,
    startTime: stayDates.startTime,
    hours: String(stayDates.hours),
    ...(geo?.cityId ? { cityId: String(geo.cityId) } : {}),
    ...(geo?.localityId ? { localityId: String(geo.localityId) } : {}),
    ...extra,
  });

  const listingParams = () => ({
    checkIn: stayDates.checkIn,
    checkOut: stayDates.checkOut,
    bookingType: DEFAULT_BOOKING_TYPE,
    startTime: stayDates.startTime,
    hours: String(stayDates.hours),
  });

  const goToResults = (extra?: Record<string, string>) => {
    router.push({ pathname: '/browse', params: searchParams(extra) });
  };

  const goToSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;
    haptic.select();
    router.push({ pathname: '/browse', params: searchParams({ search: q }) });
  };

  const submitSearch = () => goToSearch(searchQuery);

  const [voiceSearchOpen, setVoiceSearchOpen] = useState(false);
  const onVoiceResult = (text: string) => {
    setSearchQuery(text);
    goToSearch(text);
  };

  const openListing = (id: string) => {
    recordView(id);
    router.push({ pathname: `/listing/${id}`, params: listingParams() });
  };

  const openLocationPicker = () => {
    haptic.select();
    locationPicker.open((picked, ids, isOperational) => {
      setLocation(picked, 'manual', ids, isOperational);
    });
    router.push('/location');
  };

  const onQuickService = (key: string) => {
    haptic.select();
    if (key === 'group') return router.push('/group-booking');
    if (key === 'invite') return router.push('/invite-pg');
    if (key === 'refer') return router.push('/referral');
    if (key === 'metro') {
      return router.push({
        pathname: '/coming-soon',
        params: { title: 'Metro Tickets', subtitle: 'Book metro tickets right inside PGfy. We’re working on it — stay tuned!', icon: 'train-outline' },
      });
    }
    if(key === 'packers-movers') {
      return router.push({
        pathname: '/coming-soon',
        params: { title: 'Packers & Movers', subtitle: 'Move your belongings with ease. We’re working on it — stay tuned!', icon: 'truck-cargo-container', iconFamily: 'MaterialCommunityIcons' },
      });
    }
    if(key === 'storage') {
      return router.push({
        pathname: '/coming-soon',
        params: { title: 'Storage Solutions', subtitle: 'Store your belongings safely and conveniently. We’re working on it — stay tuned!', icon: 'warehouse', iconFamily: 'MaterialCommunityIcons' },
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
            <IconButton icon="notifications-outline" badge={hasUnreadNotifications} onPress={() => router.push('/notifications')} />
            <PressableScale onPress={() => router.push('/(tabs)/profile')} scaleTo={0.92}>
              <Avatar name={displayName} uri={user?.avatar?.thumbnail ?? user?.avatar?.link} size={42} ring />
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

        {/* Search + filter (operational) / not-operational notice / location prompt banner (no location) */}
        {operational ? (
          <View style={{ marginTop: spacing.base, marginHorizontal: spacing.base, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View
              style={{
                flex: 1,
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
              <View style={{ flex: 1, height: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.base }}>
                <Ionicons name="search" size={18} color={palette.inkTertiary} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search for any property or PGID"
                  placeholderTextColor={palette.inkTertiary}
                  returnKeyType="search"
                  onSubmitEditing={submitSearch}
                  style={{ flex: 1, fontFamily: fontFamily.medium, fontSize: 14, color: palette.ink, paddingVertical: 0 }}
                />
                {searchQuery ? (
                  <PressableScale onPress={() => setSearchQuery('')} haptics={false} hitSlop={8} style={{ padding: 2 }}>
                    <Ionicons name="close-circle" size={18} color={palette.inkTertiary} />
                  </PressableScale>
                ) : null}
              </View>
            </View>
            <PressableScale
              onPress={() => { haptic.select(); setVoiceSearchOpen(true); }}
              scaleTo={0.9}
              style={{
                width: 50,
                height: 50,
                borderRadius: radius.md,
                backgroundColor: palette.surface,
                borderWidth: 1,
                borderColor: palette.border,
                alignItems: 'center',
                justifyContent: 'center',
                ...shadows.card,
              }}
            >
              <VoiceWaveIcon size="sm" />
            </PressableScale>
          </View>
        ) : geo ? (
          <NotOperationalSection label={geo.label} onPress={openLocationPicker} />
        ) : (
          <LocationPromptBanner onPress={openLocationPicker} />
        )}

        {/* Property category — only once an operational location is set. Filters "Near you";
         * booking mode (monthly/daily/hourly) is chosen inside property details instead. */}
        {operational ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: spacing.base }}
            contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.base }}
          >
            {CATEGORY_TABS.map((item) => (
              <CategoryTabCard
                key={item.key}
                item={item}
                active={categoryFilter === item.key}
                onPress={() => { haptic.select(); setCategoryFilter(item.key); }}
              />
            ))}
          </ScrollView>
        ) : null}

        {/* Near you — only when we know where the tenant is and it's operational */}
        {operational ? (
          <>
            <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.base }}>
              <SectionHeader
                title="Near you"
                subtitle="Top picks around your location"
                actionLabel="See all"
                onAction={() => goToResults()}
              />
            </View>
            {dashboardLoading ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.base }}
              >
                {[0, 1, 2].map((i) => <NearbyCardSkeleton key={i} />)}
              </ScrollView>
            ) : nearby.length > 0 ? (
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
                    promoted={nearYouPromotedIds.has(listing.id)}
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
                  {dashboardError ?? 'No stays found near you yet.'}
                </Text>
              </View>
            )}
          </>
        ) : null}

        {/* Popular areas (operational) / Popular destinations (no location or not operational) */}
        {operational ? (
          popularAreas.length > 0 || dashboardLoading ? (
            <>
              <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.base }}>
                <SectionHeader
                  title="Popular areas"
                  subtitle="Explore by popular neighbourhoods"
                  actionLabel="See all"
                  onAction={() => router.push({
                    pathname: '/popular-areas',
                    params: { areas: JSON.stringify(popularAreas), cityId: String(geo?.cityId ?? ''), city: activeCity },
                  })}
                />
              </View>
              {popularAreas.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.base }}
                  nestedScrollEnabled
                >
                  {intoColumns(popularAreas).map((column, columnIndex) => (
                    <View key={`area-col-${columnIndex}`} style={{ gap: spacing.md }}>
                      {column.map((locality, i) => (
                        <CityTile
                          key={locality.id}
                          label={locality.name}
                          landmarkId="cityscape"
                          accent={AREA_TILE_ACCENTS[(columnIndex * 2 + i) % AREA_TILE_ACCENTS.length]}
                          image={locality.avatar?.link}
                          onPress={() => goToSearch(locality.name)}
                        />
                      ))}
                    </View>
                  ))}
                </ScrollView>
              ) : null}
            </>
          ) : null
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
              {intoColumns(popularTiles).map((column, columnIndex) => (
                <View key={`dest-col-${columnIndex}`} style={{ gap: spacing.md }}>
                  {column.map((dest) => (
                    <CityTile
                      key={dest.id}
                      label={dest.name}
                      landmarkId={dest.landmarkId}
                      image={dest.image}
                      onPress={() => { haptic.select(); goToSearch(dest.name); }}
                    />
                  ))}
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Continue browsing */}
        {recentListings.length > 0 ? (
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
              {recentListings.map((listing) => (
                <ContinueCard key={listing.id} listing={listing} onPress={() => openListing(listing.id)} />
              ))}
            </ScrollView>
          </>
        ) : null}

        {/* Quick actions (replaces the old promo banner) */}
        <Text variant="h3" style={{ marginTop: spacing.xl, marginBottom: spacing.md, paddingHorizontal: spacing.base }}>
          Quick actions
        </Text>
        <View style={{ paddingHorizontal: spacing.base, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {QUICK_SERVICES.map((service) => (
            <View key={service.key} style={{ flexBasis: '47%', flexGrow: 1 }}>
              <QuickActionTile service={service} onPress={() => onQuickService(service.key)} />
            </View>
          ))}
        </View>

        <View style={{ paddingHorizontal: spacing.base }}>
          <CraftedFooter />
        </View>
      </ScrollView>

      <VoiceSearchSheet
        visible={voiceSearchOpen}
        onClose={() => setVoiceSearchOpen(false)}
        onResult={(text) => {
          setVoiceSearchOpen(false);
          onVoiceResult(text);
        }}
      />
    </View>
  );
}
