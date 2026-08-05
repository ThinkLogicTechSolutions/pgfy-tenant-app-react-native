/** T-S13 — Property details page with verification/trust surfaced. */
import { useEffect, useState } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, spacing, radius, shadows } from '@/theme';
import { Text, Card, IconButton, Divider, Button, EmptyState, Sheet, PressableScale, Skeleton, SegmentedControl } from '@/components/ui';
import { StayBookingFields, type StayBookingValues } from '@/components/search';
import { PgfyScore, StatusPill, RatingPill, ReviewCard, WeeklyFoodMenuSheet, PropertyRatingSection, buildWeeklyMenu, buildWeeklyMenuFromApi, PropertyImageCarousel, PromotedBadge, type WeekDay } from '@/components/domain';
import { listingCarouselImages, listingPhotoCount, PROPERTY_IMAGE_ASPECT } from '@/lib/media';
import { getListing, LISTINGS } from '@/data';
import { inr, formatDate } from '@/lib/format';
import { listingNearLandmarkTitle, isPromotedListing } from '@/lib/listingDisplay';
import { defaultCheckOut, clampCheckInToFuture } from '@/lib/dates';
import { useCheckInFreshness } from '@/lib/useCheckInFreshness';
import { useSaved } from '@/store/saved';
import { recordView } from '@/store/recentlyViewed';
import { haptic } from '@/lib/haptics';
import type { BookingMode, Listing } from '@/data/types';
import { propertyApi, favoritesApi, errorMessage, type ApiBookingMode } from '@/lib/api';
import { propertyDetailsToListing, parseApiPropertyId } from '@/lib/listingAdapter';
import { cachePropertyDetails } from '@/store/propertyDetailsCache';
import { useAuth } from '@/context/AuthContext';
import { alert } from '@/lib/alertDialog';

function formatTime12(t: string) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Mirrors the loaded screen's layout (gallery → title → about → booking → occupancy) so the
 * shimmer doesn't jump when the real content swaps in. */
function PropertyDetailsSkeleton({ insetTop }: { insetTop: number }) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Skeleton width="100%" height={260 + insetTop} rounded={0} />
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.base, gap: spacing.base }}>
          <View>
            <Skeleton width="70%" height={26} />
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              <Skeleton width={64} height={22} rounded={radius.pill} />
              <Skeleton width={72} height={22} rounded={radius.pill} />
            </View>
          </View>
          <Card>
            <Skeleton width="40%" height={18} style={{ marginBottom: spacing.sm }} />
            <Skeleton width="100%" height={14} style={{ marginBottom: 6 }} />
            <Skeleton width="90%" height={14} style={{ marginBottom: 6 }} />
            <Skeleton width="60%" height={14} />
          </Card>
          <Card>
            <Skeleton width="50%" height={18} style={{ marginBottom: spacing.md }} />
            <Skeleton width="100%" height={44} />
          </Card>
          <Card>
            <Skeleton width="30%" height={18} style={{ marginBottom: spacing.md }} />
            <Skeleton width="100%" height={64} style={{ marginBottom: spacing.sm }} />
            <Skeleton width="100%" height={64} />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

function capitalizeFirst(s: string): string {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Same monthly/daily/hourly switch as Home's stay-type picker. */
const BOOKING_MODE_SEGMENTS: { key: BookingMode; label: string }[] = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'daily', label: 'Daily' },
  { key: 'hourly', label: 'Hourly' },
];

const MEAL_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Morning tea': 'cafe-outline',
  Breakfast: 'sunny-outline',
  Lunch: 'partly-sunny-outline',
  'Evening tea': 'cafe-outline',
  Dinner: 'moon-outline',
};

const MONTHLY_PLAN_ADJUSTMENTS = {
  monthly_ac_with_food: 4500,
  monthly_ac_no_food: 2500,
  monthly_nonac_with_food: 3000,
  monthly_nonac_no_food: 0,
} as const;

const MONTHLY_PLAN_META = [
  { key: 'monthly_ac_with_food', label: 'Monthly · AC · With food' },
  { key: 'monthly_ac_no_food', label: 'Monthly · AC · No food' },
  { key: 'monthly_nonac_with_food', label: 'Monthly · Non-AC · With food' },
  { key: 'monthly_nonac_no_food', label: 'Monthly · Non-AC · No food' },
] as const;

function pricingAnchorKey(hasAcRoom: boolean, foodIncluded: boolean) {
  if (hasAcRoom && foodIncluded) return 'monthly_ac_with_food';
  if (hasAcRoom) return 'monthly_ac_no_food';
  if (foodIncluded) return 'monthly_nonac_with_food';
  return 'monthly_nonac_no_food';
}

function monthlyPlansForTier(rent: number, hasAcRoom: boolean, foodIncluded: boolean) {
  const anchor = pricingAnchorKey(hasAcRoom, foodIncluded);
  const base = rent - MONTHLY_PLAN_ADJUSTMENTS[anchor];
  return MONTHLY_PLAN_META.map((plan) => ({
    ...plan,
    amount: Math.max(base + MONTHLY_PLAN_ADJUSTMENTS[plan.key], 0),
  }));
}

function occupancyPlanKey(hasAcRoom: boolean, withFood: boolean) {
  if (hasAcRoom) return withFood ? 'monthly_ac_with_food' : 'monthly_ac_no_food';
  return withFood ? 'monthly_nonac_with_food' : 'monthly_nonac_no_food';
}

export default function ListingDetail() {
  const {
    id, checkIn, checkOut, openFoodMenu,
    bookingType: routeBookingType, startTime: routeStartTime, hours: routeHours,
  } = useLocalSearchParams<{
    id: string;
    checkIn?: string;
    checkOut?: string;
    openFoodMenu?: string;
    bookingType?: string;
    startTime?: string;
    hours?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const saved = useSaved();
  const { user } = useAuth();

  const apiId = parseApiPropertyId(String(id));
  const mockListing = apiId ? null : getListing(String(id));
  const [apiListing, setApiListing] = useState<Listing | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(!!apiId);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [favorite, setFavorite] = useState<{ isFavorite: boolean; favoriteId: number | null }>({ isFavorite: false, favoriteId: null });
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  const [foodSheetOpen, setFoodSheetOpen] = useState(false);
  const [selectedWeekDay, setSelectedWeekDay] = useState<WeekDay>('Mon');
  const [expandedOccupancy, setExpandedOccupancy] = useState<string | null>(null);
  // Editable here (not just inherited from the route) so the tenant can switch monthly/daily/
  // hourly on this page the same way Home's stay-type + date/time picker works.
  const [selectedBookingMode, setSelectedBookingMode] = useState<BookingMode>(
    ['hourly', 'daily', 'monthly'].includes(routeBookingType ?? '') ? (routeBookingType as BookingMode) : 'monthly',
  );
  const apiBookingMode: ApiBookingMode = selectedBookingMode === 'hourly' ? 'HOURLY' : selectedBookingMode === 'daily' ? 'DAILY' : 'MONTHLY';

  useEffect(() => {
    if (!apiId) return;
    let active = true;
    setDetailsLoading(true);
    setDetailsError(null);
    propertyApi.getPropertyDetails(apiId, { bookingMode: apiBookingMode, recordView: true })
      .then((data) => {
        if (!active) return;
        const mapped = propertyDetailsToListing(data);
        setApiListing(mapped);
        setFavorite({ isFavorite: mapped.isFavorite ?? false, favoriteId: mapped.favoriteId ?? null });
        // Review-booking reads this instead of re-fetching the same property.
        cachePropertyDetails(apiId, mapped);
      })
      .catch((e) => { if (active) setDetailsError(errorMessage(e)); })
      .finally(() => { if (active) setDetailsLoading(false); });
    return () => { active = false; };
  }, [apiId, apiBookingMode, retryTick]);

  const listing = apiId ? apiListing : mockListing;

  const toggleFavorite = async () => {
    if (!apiId || favoriteBusy) {
      if (!apiId) saved.toggle(String(id));
      return;
    }
    setFavoriteBusy(true);
    const prev = favorite;
    try {
      if (favorite.isFavorite && favorite.favoriteId != null) {
        await favoritesApi.removeFavoriteProperty(favorite.favoriteId);
        setFavorite({ isFavorite: false, favoriteId: null });
      } else {
        const res = await favoritesApi.addFavoriteProperty(apiId);
        setFavorite({ isFavorite: true, favoriteId: res.id });
      }
    } catch (e) {
      setFavorite(prev);
      alert('Could not update favorite', errorMessage(e));
    } finally {
      setFavoriteBusy(false);
    }
  };
  const isFavorite = apiId ? favorite.isFavorite : saved.isSaved(String(id));

  const [selectedOccupancy, setSelectedOccupancy] = useState<{
    key: string;
    sharingType: string;
    /** Raw API layout code — needed by the choose-room/bed screen for API-backed properties. */
    layout?: string;
    title: string;
    rent: number;
    hasAc: boolean;
    acLabel: 'AC' | 'Non-AC';
    withFood: boolean;
  } | null>(null);
  const [stayValues, setStayValues] = useState<StayBookingValues>(() => {
    const nextCheckIn = clampCheckInToFuture(checkIn);
    return {
      checkIn: nextCheckIn,
      checkOut: checkOut || defaultCheckOut(nextCheckIn),
      startTime: routeStartTime || '10:00',
      hours: routeHours ? Number(routeHours) : 4,
    };
  });

  // See `useCheckInFreshness` — re-clamps `stayValues.checkIn` forward both on navigation
  // focus and on the app returning from the background, so it never silently shows a past
  // date after this screen has been sitting open (or merely backgrounded) for a while.
  useCheckInFreshness(setStayValues);

  /** Switching mode changes the pricing tiers entirely, so any in-progress occupancy pick
   * no longer applies. */
  const changeBookingMode = (mode: BookingMode) => {
    setSelectedBookingMode(mode);
    setSelectedOccupancy(null);
    setExpandedOccupancy(null);
  };

  useEffect(() => {
    if (listing) recordView(listing.id);
  }, [listing?.id]);

  // Re-fetch after the tenant creates/edits/deletes their rating — the aggregate rating,
  // rating breakdown, and reviews list all depend on the server, not just their own rating.
  const refreshAfterRatingChange = () => {
    if (!apiId) return;
    propertyApi.getPropertyDetails(apiId, { bookingMode: apiBookingMode })
      .then((data) => {
        const mapped = propertyDetailsToListing(data);
        setApiListing(mapped);
        cachePropertyDetails(apiId, mapped);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (openFoodMenu === '1') setFoodSheetOpen(true);
  }, [openFoodMenu]);

  if (!listing) {
    if (apiId && detailsLoading) {
      return <PropertyDetailsSkeleton insetTop={insets.top} />;
    }
    if (apiId && detailsError) {
      return (
        <View style={{ flex: 1, paddingTop: insets.top + 60 }}>
          <EmptyState title="Couldn't load this property" message={detailsError} actionLabel="Retry" onAction={() => setRetryTick((t) => t + 1)} />
        </View>
      );
    }
    return <View style={{ flex: 1, paddingTop: insets.top + 60 }}><EmptyState title="Property not found" /></View>;
  }
  const l = listing;
  /** Mock listings have no `canRate` field — default to allowed. */
  const canRate = l.canRate !== false;
  const weeklyMenu = l.weeklyFoodMenu ? buildWeeklyMenuFromApi(l.weeklyFoodMenu) : buildWeeklyMenu(l.foodMenu);
  const todayMenu = weeklyMenu.find((menu) => menu.day === selectedWeekDay) ?? weeklyMenu[0];
  const hasFoodMenu = l.foodIncluded && weeklyMenu.some((menu) => menu.meals.length > 0);

  const promoted = !apiId && isPromotedListing(l.id, LISTINGS);
  const availableModeSegments = BOOKING_MODE_SEGMENTS.filter((s) => (
    s.key === 'monthly' ? l.bookingConfig.monthlyEnabled
      : s.key === 'daily' ? l.bookingConfig.dailyEnabled
        : l.bookingConfig.hourlyEnabled
  ));

  const occupancyPriceSuffix = selectedBookingMode === 'hourly' ? '/hr' : selectedBookingMode === 'daily' ? '/day' : '/mo';
  type OccupancyOption = { key: string; title: string; hasAc: boolean; acLabel: 'AC' | 'Non-AC'; withFood: boolean; rent: number };
  type OccupancyTier = { sharingType: string; layout?: string; available: number; rent: number; options: OccupancyOption[] };
  // Flat/Home stay book the whole (single, backend-seeded) unit — there's just one rent, no
  // AC/food tiers, so the tiered occupancy picker below doesn't apply at all.
  const unitRent = l.isUnitProperty ? l.pricingVariants?.[0]?.rent ?? l.priceFrom : 0;
  const occupancyTiers: OccupancyTier[] = l.isUnitProperty
    ? []
    : l.pricingVariants
    ? l.pricingVariants
        .map((v): OccupancyTier => {
          // A ₹0 (or unset) rate means the owner isn't offering that AC/food combo for this
          // layout at all — not a free option, so it shouldn't be selectable.
          const allOptions: OccupancyOption[] = [
            { key: `${v.layout}-ac-with-food`, title: `${v.sharingType} room with food`, hasAc: true, acLabel: 'AC', withFood: true, rent: v.acWithFood ?? 0 },
            { key: `${v.layout}-ac-without-food`, title: `${v.sharingType} room without food`, hasAc: true, acLabel: 'AC', withFood: false, rent: v.acNoFood ?? 0 },
            { key: `${v.layout}-nonac-with-food`, title: `${v.sharingType} room with food`, hasAc: false, acLabel: 'Non-AC', withFood: true, rent: v.nonAcWithFood ?? 0 },
            { key: `${v.layout}-nonac-without-food`, title: `${v.sharingType} room without food`, hasAc: false, acLabel: 'Non-AC', withFood: false, rent: v.nonAcNoFood ?? 0 },
          ];
          const options = allOptions.filter((o) => o.rent > 0);
          return {
            sharingType: v.sharingType,
            layout: v.layout,
            available: v.available,
            rent: options.length ? Math.min(...options.map((o) => o.rent)) : 0,
            options,
          };
        })
        .filter((tier) => tier.options.length > 0)
    : (selectedBookingMode === 'hourly'
        ? l.hourlyPricing.map((h) => ({ sharingType: h.sharingType, rent: h.rentPerHour, available: h.available }))
        : selectedBookingMode === 'daily'
          ? l.dailyPricing.map((d) => ({ sharingType: d.sharingType, rent: d.rentPerDay, available: d.available }))
          : l.pricing
      ).map((tier): OccupancyTier => {
        const plans = monthlyPlansForTier(tier.rent, l.amenities.includes('AC'), l.foodIncluded);
        const allOptions: OccupancyOption[] = [
          { key: `${tier.sharingType}-ac-with-food`, title: `${tier.sharingType} room with food`, hasAc: true, acLabel: 'AC', withFood: true, rent: plans.find((p) => p.key === occupancyPlanKey(true, true))?.amount ?? tier.rent },
          { key: `${tier.sharingType}-ac-without-food`, title: `${tier.sharingType} room without food`, hasAc: true, acLabel: 'AC', withFood: false, rent: plans.find((p) => p.key === occupancyPlanKey(true, false))?.amount ?? tier.rent },
          { key: `${tier.sharingType}-nonac-with-food`, title: `${tier.sharingType} room with food`, hasAc: false, acLabel: 'Non-AC', withFood: true, rent: plans.find((p) => p.key === occupancyPlanKey(false, true))?.amount ?? tier.rent },
          { key: `${tier.sharingType}-nonac-without-food`, title: `${tier.sharingType} room without food`, hasAc: false, acLabel: 'Non-AC', withFood: false, rent: plans.find((p) => p.key === occupancyPlanKey(false, false))?.amount ?? tier.rent },
        ];
        const options = allOptions.filter((o) => o.rent > 0);
        return {
          sharingType: tier.sharingType,
          available: tier.available,
          rent: options.length ? Math.min(...options.map((o) => o.rent)) : tier.rent,
          options,
        };
      }).filter((tier) => tier.options.length > 0);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Gallery */}
        <View>
          <PropertyImageCarousel
            images={listingCarouselImages(l)}
            width={width}
            aspectRatio={PROPERTY_IMAGE_ASPECT}
            maxImages={5}
            showDots
          />
          <LinearGradient colors={['rgba(1,38,78,0.5)', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 110 }} pointerEvents="none" />
          <View style={{ position: 'absolute', top: insets.top + spacing.xs, left: spacing.base, right: spacing.base, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <IconButton icon="chevron-back" bg="rgba(255,255,255,0.92)" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} />
              {promoted ? <PromotedBadge /> : null}
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <IconButton icon={isFavorite ? 'heart' : 'heart-outline'} color={isFavorite ? palette.coral : palette.ink} bg="rgba(255,255,255,0.92)" onPress={toggleFavorite} />
              <IconButton icon="share-social-outline" bg="rgba(255,255,255,0.92)" />
            </View>
          </View>
          <PressableScale
            onPress={() => router.push({
              pathname: `/listing/${l.id}/media`,
              params: { section: l.mediaSections[0]?.id, sections: JSON.stringify(l.mediaSections) },
            })}
            scaleTo={0.97}
            style={{
              position: 'absolute',
              bottom: 12,
              left: spacing.base,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(255,255,255,0.94)',
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 999,
              ...shadows.card,
            }}
          >
            <Ionicons name="images-outline" size={15} color={palette.navy} />
            <Text variant="bodySm" weight="600" color={palette.navy}>{listingPhotoCount(l)} Photos</Text>
            <Ionicons name="chevron-forward" size={14} color={palette.navy} />
          </PressableScale>
        </View>

        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.base, gap: spacing.base }}>
          {/* Title */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
              <Text variant="h1" style={{ flex: 1 }}>{listingNearLandmarkTitle(l)}</Text>
              <RatingPill rating={l.rating} count={l.reviewCount} />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' }}>
              <StatusPill status={l.type} small />
              <StatusPill status={l.gender} small />
              {l.tags.filter((t) => t === 'New').map((t) => <StatusPill key={t} status={t} small />)}
            </View>
          </View>

          {/* About */}
          <Card>
            <Text variant="h3" style={{ marginBottom: spacing.sm }}>About this property</Text>
            <Text variant="body" color={palette.inkSecondary} style={{ lineHeight: 22 }}>
              {l.description}
            </Text>
          </Card>

          {/* Booking details */}
          <Card>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>Your booking details</Text>
            {availableModeSegments.length > 1 ? (
              <SegmentedControl
                segments={availableModeSegments}
                value={selectedBookingMode}
                onChange={(key) => changeBookingMode(key as BookingMode)}
                style={{ marginBottom: spacing.md }}
              />
            ) : null}
            <StayBookingFields
              mode={selectedBookingMode}
              values={stayValues}
              onChange={setStayValues}
              showModeLabel={availableModeSegments.length <= 1}
            />
            {selectedBookingMode === 'hourly' && l.bookingConfig.hourly ? (
              <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: spacing.md }}>
                Property window: {formatTime12(l.bookingConfig.hourly.windowStart)} – {formatTime12(l.bookingConfig.hourly.windowEnd)}
              </Text>
            ) : null}
            {selectedBookingMode === 'daily' && l.bookingConfig.daily ? (
              <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: spacing.md }}>
                Standard check-in {formatTime12(l.bookingConfig.daily.checkInTime)} · check-out {formatTime12(l.bookingConfig.daily.checkOutTime)}
              </Text>
            ) : null}
          </Card>

          {/* Price — Flat/Home stay only: a single whole-property price, no room/bed tiers. */}
          {l.isUnitProperty ? (
            <Card>
              <Text variant="h3" style={{ marginBottom: spacing.xs }}>Price</Text>
              <Text variant="caption" color={palette.inkTertiary} style={{ marginBottom: spacing.md }}>
                This {l.type === 'Flat' ? 'flat' : 'home stay'} is booked in full — up to {l.maxOccupancy ?? 1} guest{(l.maxOccupancy ?? 1) > 1 ? 's' : ''}.
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text variant="bodyMd" weight="600">
                  {selectedBookingMode === 'hourly' ? 'Hourly price' : selectedBookingMode === 'daily' ? 'Daily price' : 'Monthly price'}
                </Text>
                <Text variant="h3" mono color={palette.navy}>{inr(unitRent)}{occupancyPriceSuffix}</Text>
              </View>
              {/* Hourly/daily stays have no lock-in — no security deposit applies. */}
              {selectedBookingMode === 'monthly' ? (
                <>
                  <Divider style={{ marginTop: spacing.md, marginBottom: spacing.md }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, paddingRight: spacing.md }}>
                      <Text variant="bodyMd" weight="600">Safety deposit</Text>
                      <Text variant="caption" color={palette.inkTertiary}>One-time refundable</Text>
                    </View>
                    <Text variant="bodyMd" weight="700" mono color={palette.navy}>{inr(l.securityDeposit)}</Text>
                  </View>
                </>
              ) : null}
            </Card>
          ) : (
          <Card>
            <Text variant="h3" style={{ marginBottom: spacing.xs }}>Occupancy</Text>
            <Text variant="caption" color={palette.inkTertiary} style={{ marginBottom: spacing.md }}>
              Expand a room type and select one option to continue to room / bed selection.
            </Text>

            <View style={{ gap: spacing.md }}>
              {occupancyTiers.map((tier) => {
                const tierRent = tier.rent;
                const priceSuffix = occupancyPriceSuffix;
                const options = tier.options;
                const expanded = expandedOccupancy === tier.sharingType;
                const activeSelection = selectedOccupancy?.sharingType === tier.sharingType ? selectedOccupancy : null;
                return (
                  <View
                    key={tier.layout ?? tier.sharingType}
                    style={{
                      borderWidth: 1,
                      borderColor: activeSelection ? palette.coral : palette.border,
                      borderRadius: radius.lg,
                      overflow: 'hidden',
                      backgroundColor: palette.surface,
                    }}
                  >
                    <PressableScale
                      onPress={() => setExpandedOccupancy(expanded ? null : tier.sharingType)}
                      scaleTo={0.99}
                      haptics={false}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.md,
                        backgroundColor: activeSelection ? 'rgba(255, 90, 79, 0.08)' : palette.surfaceRaised,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: radius.md,
                            backgroundColor: activeSelection ? palette.coralTint : palette.navyTint,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons name="bed-outline" size={20} color={activeSelection ? palette.coralDark : palette.navy} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text variant="bodyMd" weight="700">{tier.sharingType}</Text>
                          <Text variant="caption" color={palette.inkTertiary}>{tier.available} beds available</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', paddingLeft: spacing.sm }}>
                        <Text variant="bodySm" weight="700" color={palette.coralDark}>
                          From {inr(tierRent)}{priceSuffix}
                        </Text>
                        <Text variant="caption" color={activeSelection ? palette.coralDark : palette.inkTertiary}>
                          {activeSelection ? 'Option selected' : expanded ? 'Hide plans' : 'View plans'}
                        </Text>
                      </View>
                      <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={palette.inkTertiary}
                        style={{ marginLeft: spacing.sm }}
                      />
                    </PressableScale>
                    {expanded ? (
                      <View
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingTop: spacing.sm,
                          paddingBottom: spacing.md,
                          gap: spacing.sm,
                          borderTopWidth: 1,
                          borderTopColor: palette.border,
                          backgroundColor: activeSelection ? 'rgba(255, 90, 79, 0.03)' : palette.surface,
                        }}
                      >
                        {options.map((option) => {
                          const selected = selectedOccupancy?.key === option.key;
                          return (
                            <PressableScale
                              key={option.key}
                              onPress={() => setSelectedOccupancy({
                                key: option.key,
                                sharingType: tier.sharingType,
                                layout: tier.layout,
                                title: option.title,
                                rent: option.rent,
                                hasAc: option.hasAc,
                                acLabel: option.acLabel,
                                withFood: option.withFood,
                              })}
                              scaleTo={0.99}
                              haptics={false}
                              style={{
                                gap: spacing.sm,
                                borderWidth: 1,
                                borderColor: selected ? palette.coral : palette.border,
                                borderRadius: radius.md,
                                backgroundColor: selected ? palette.coralTint : palette.surfaceRaised,
                                paddingHorizontal: spacing.md,
                                paddingVertical: spacing.md,
                              }}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md }}>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                  <Text variant="bodySm" weight="700" numberOfLines={2}>{option.title}</Text>
                                  <Text variant="caption" color={palette.inkSecondary} style={{ marginTop: 4 }}>
                                    {option.acLabel}
                                  </Text>
                                  <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: 8 }}>
                                    {selected ? 'Selected occupancy option' : 'Select this plan to continue'}
                                  </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end', gap: 6, minWidth: 92 }}>
                                  <Text variant="bodyMd" weight="700" mono color={palette.navy}>
                                    {inr(option.rent)}
                                  </Text>
                                  {selected ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                      <Ionicons name="checkmark-circle" size={18} color={palette.coral} />
                                      <Text variant="caption" weight="600" color={palette.coralDark}>Selected</Text>
                                    </View>
                                  ) : null}
                                </View>
                              </View>
                            </PressableScale>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
            {selectedBookingMode === 'monthly' ? (
              <>
                <Divider style={{ marginTop: spacing.md, marginBottom: spacing.md }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, paddingRight: spacing.md }}>
                    <Text variant="bodyMd" weight="600">Safety deposit</Text>
                    <Text variant="caption" color={palette.inkTertiary}>One-time refundable · same for all room types</Text>
                  </View>
                  <Text variant="bodyMd" weight="700" mono color={palette.navy}>{inr(l.securityDeposit)}</Text>
                </View>
              </>
            ) : null}
          </Card>
          )}

          {/* Amenities */}
          <Card>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>Amenities</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {l.amenities.map((a) => (
                <View key={a} style={{ width: '50%', paddingVertical: spacing.sm }}>
                  <Text variant="bodySm" color={palette.inkSecondary} numberOfLines={1}>{capitalizeFirst(a)}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Food menu — hidden entirely when the property has no food data */}
          {hasFoodMenu ? (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
                <Text variant="h3">Food menu</Text>
                <PressableScale onPress={() => setFoodSheetOpen(true)} haptics={false}>
                  <Text variant="bodySm" weight="600" color={palette.coralDark}>More</Text>
                </PressableScale>
              </View>
              <View style={{ gap: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: palette.successTint, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="restaurant-outline" size={20} color={palette.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMd" weight="700">Today&apos;s menu</Text>
                    <Text variant="caption" color={palette.inkTertiary}>Open weekly menu to view other weekdays</Text>
                  </View>
                </View>
                {todayMenu.meals.map((meal) => (
                  <View
                    key={meal.meal}
                    style={{
                      flexDirection: 'row',
                      gap: spacing.md,
                      borderWidth: 1,
                      borderColor: palette.border,
                      borderRadius: radius.md,
                      backgroundColor: palette.surfaceRaised,
                      padding: spacing.md,
                    }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.coralTint, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={MEAL_ICON[meal.meal] ?? 'restaurant-outline'} size={18} color={palette.coralDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMd" weight="700">{meal.meal}</Text>
                      <Text variant="bodySm" color={palette.inkSecondary} style={{ marginTop: 4, lineHeight: 21 }}>
                        {meal.items}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}

          {/* Ratings & reviews */}
          <View>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>Ratings & reviews</Text>

            {l.ratingBreakdown.length > 0 ? (
              <Card style={{ marginBottom: spacing.base }}>
                <Text variant="bodyMd" weight="700" style={{ marginBottom: spacing.md }}>Ratings</Text>
                {l.ratingBreakdown.map((r) => (
                  <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}>
                    <Text variant="bodySm" color={palette.inkSecondary} style={{ width: 90 }}>{r.label}</Text>
                    <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: palette.surfaceSunken, overflow: 'hidden' }}>
                      <View style={{ width: `${(r.value / 5) * 100}%`, height: '100%', borderRadius: 4, backgroundColor: palette.success }} />
                    </View>
                    <Text variant="bodySm" weight="700" mono style={{ width: 30 }}>{r.value.toFixed(1)}</Text>
                  </View>
                ))}
              </Card>
            ) : null}

            {apiId ? (
              <View style={{ marginBottom: spacing.md }}>
                <PropertyRatingSection
                  key={`${user?.id ?? 'guest'}-${apiId}`}
                  propertyId={apiId}
                  propertyName={l.name}
                  initialMyRating={l.myRating}
                  canRate={canRate}
                  onChanged={refreshAfterRatingChange}
                />
              </View>
            ) : null}

            {l.reviews.length > 0 ? (
              <>
                <Text variant="bodyMd" weight="700" style={{ marginBottom: spacing.sm }}>Customer's reviews</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }} style={{ marginHorizontal: -spacing.base, paddingHorizontal: spacing.base }}>
                  {l.reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                </ScrollView>
              </>
            ) : (
              <Text variant="bodySm" color={palette.inkTertiary}>No reviews yet.</Text>
            )}
          </View>

          {/* House rules */}
          <Card>
            <Text variant="h3" style={{ marginBottom: spacing.sm }}>House rules & policies</Text>
            {l.houseRules.map((r) => (
              <View key={r} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingVertical: 5 }}>
                <Ionicons name="ellipse" size={5} color={palette.inkTertiary} />
                <Text variant="bodySm" color={palette.inkSecondary}>{r}</Text>
              </View>
            ))}
            <Divider style={{ marginVertical: spacing.sm }} />
            <Text variant="caption" color={palette.inkTertiary}>Notice period {l.noticePeriodDays} days · Lock-in {l.lockInMonths} months</Text>
          </Card>

          {/* Verification & trust */}
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: l.verified ? spacing.md : 0 }}>
              <Text variant="h3">Verification & trust</Text>
              <PgfyScore score={l.pgfyScore} verified={l.verified} />
            </View>
            {l.verified ? (
              <>
                {l.certificates.map((c, i) => (
                  <View key={c.label}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm }}>
                      <Text variant="bodySm" color={palette.inkSecondary}>{c.label}</Text>
                      <StatusPill status={c.status} small dot />
                    </View>
                    {i < l.certificates.length - 1 ? <Divider /> : null}
                  </View>
                ))}
              </>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: spacing.sm }}>
                <Ionicons name="information-circle" size={16} color={palette.warning} style={{ marginTop: 1 }} />
                <Text variant="caption" color={palette.inkSecondary} style={{ flex: 1 }}>This property isn't PGfy-verified yet. You can request it and our team will onboard & inspect it.</Text>
              </View>
            )}
          </Card>

        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
        <Button
          label={l.verified ? (l.isUnitProperty ? 'Book this property' : 'Choose Room/Bed') : 'Request This Property'}
          // icon={l.verified ? (l.isUnitProperty ? 'people-outline' : 'bed-outline') : 'paper-plane-outline'}
          onPress={() => {
            if (!l.verified) { router.push(`/listing/${l.id}/request`); return; }
            if (l.isUnitProperty) {
              router.push({
                pathname: `/listing/${l.id}/guests`,
                params: {
                  checkIn: stayValues.checkIn,
                  checkOut: stayValues.checkOut,
                  startTime: stayValues.startTime,
                  hours: String(stayValues.hours),
                  bookingType: selectedBookingMode,
                  rent: String(unitRent),
                  maxOccupancy: String(l.maxOccupancy ?? 1),
                  propertyName: l.name,
                },
              });
              return;
            }
            router.push({
              pathname: `/listing/${l.id}/select`,
              params: {
                checkIn: stayValues.checkIn,
                checkOut: stayValues.checkOut,
                startTime: stayValues.startTime,
                hours: String(stayValues.hours),
                occupancy: selectedOccupancy?.sharingType ?? '',
                occupancyTitle: selectedOccupancy?.title ?? '',
                acType: selectedOccupancy?.acLabel ?? '',
                selectedRent: selectedOccupancy ? String(selectedOccupancy.rent) : '',
                bookingType: selectedBookingMode,
                layout: selectedOccupancy?.layout ?? '',
                withFood: selectedOccupancy ? String(selectedOccupancy.withFood) : '',
                propertyName: l.name,
              },
            });
          }}
          disabled={l.verified && (l.isUnitProperty ? unitRent <= 0 : !selectedOccupancy)}
          full size="lg"
        />
      </View>

      <WeeklyFoodMenuSheet
        visible={foodSheetOpen}
        onClose={() => setFoodSheetOpen(false)}
        foodMenu={l.foodMenu}
        weeklyMenu={l.weeklyFoodMenu}
        foodIncluded={l.foodIncluded}
        initialDay={selectedWeekDay}
      />

    </View>
  );
}
