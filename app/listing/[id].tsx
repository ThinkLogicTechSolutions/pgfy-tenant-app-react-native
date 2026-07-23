/** T-S13 — Property details page with verification/trust surfaced. */
import { useEffect, useState } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, spacing, radius, shadows } from '@/theme';
import { Text, Card, IconButton, Divider, Button, EmptyState, Sheet, Input, PressableScale, Skeleton } from '@/components/ui';
import { StayBookingFields, type StayBookingValues } from '@/components/search';
import { PgfyScore, StatusPill, RatingPill, ReviewCard, WeeklyFoodMenuSheet, buildWeeklyMenu, buildWeeklyMenuFromApi, PropertyImageCarousel, PromotedBadge, type WeekDay } from '@/components/domain';
import { listingCarouselImages, listingPhotoCount, PROPERTY_IMAGE_ASPECT } from '@/lib/media';
import { getListing, LISTINGS } from '@/data';
import { inr, formatDate } from '@/lib/format';
import { listingNearLandmarkTitle, isPromotedListing } from '@/lib/listingDisplay';
import { defaultCheckIn, defaultCheckOut } from '@/lib/dates';
import { useSaved } from '@/store/saved';
import { recordView } from '@/store/recentlyViewed';
import { haptic } from '@/lib/haptics';
import type { BookingMode, Listing } from '@/data/types';
import { propertyApi, favoritesApi, errorMessage, type ApiBookingMode } from '@/lib/api';
import { propertyDetailsToListing, parseApiPropertyId } from '@/lib/listingAdapter';
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

const REVIEW_CATEGORIES = [
  { key: 'cleanliness', label: 'Cleanliness', hint: 'How clean were the room and common areas?' },
  { key: 'food', label: 'Food', hint: 'How was the quality and consistency of meals?' },
  { key: 'safety', label: 'Safety', hint: 'Did you feel safe and secure at the property?' },
  { key: 'staff', label: 'Staff', hint: 'How helpful and responsive were the staff?' },
  { key: 'price', label: 'Price', hint: 'How fair was the pricing for what you received?' },
] as const;
type ReviewCategoryKey = (typeof REVIEW_CATEGORIES)[number]['key'];

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
    id, checkIn, checkOut, openReview, openFoodMenu,
    bookingType: routeBookingType, startTime: routeStartTime, hours: routeHours,
  } = useLocalSearchParams<{
    id: string;
    checkIn?: string;
    checkOut?: string;
    openReview?: string;
    openFoodMenu?: string;
    bookingType?: string;
    startTime?: string;
    hours?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const saved = useSaved();

  const apiId = parseApiPropertyId(String(id));
  const mockListing = apiId ? null : getListing(String(id));
  const [apiListing, setApiListing] = useState<Listing | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(!!apiId);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [favorite, setFavorite] = useState<{ isFavorite: boolean; favoriteId: number | null }>({ isFavorite: false, favoriteId: null });
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [foodSheetOpen, setFoodSheetOpen] = useState(false);
  const [selectedWeekDay, setSelectedWeekDay] = useState<WeekDay>('Mon');
  const [expandedOccupancy, setExpandedOccupancy] = useState<string | null>(null);
  const selectedBookingMode: BookingMode = ['hourly', 'daily', 'monthly'].includes(routeBookingType ?? '')
    ? (routeBookingType as BookingMode)
    : 'monthly';
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
    const nextCheckIn = checkIn || defaultCheckIn();
    return {
      checkIn: nextCheckIn,
      checkOut: checkOut || defaultCheckOut(nextCheckIn),
      startTime: routeStartTime || '10:00',
      hours: routeHours ? Number(routeHours) : 4,
    };
  });
  const [reviewRatings, setReviewRatings] = useState<Record<ReviewCategoryKey, number>>({
    cleanliness: 0,
    food: 0,
    safety: 0,
    staff: 0,
    price: 0,
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (listing) recordView(listing.id);
  }, [listing?.id]);

  useEffect(() => {
    if (openReview === '1') setReviewOpen(true);
  }, [openReview]);

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
  const averageReviewRating = Math.round((Object.values(reviewRatings).reduce((sum, rating) => sum + rating, 0) / REVIEW_CATEGORIES.length) * 10) / 10;
  const hasCompletedReview = REVIEW_CATEGORIES.every((category) => reviewRatings[category.key] > 0);
  const weeklyMenu = l.weeklyFoodMenu ? buildWeeklyMenuFromApi(l.weeklyFoodMenu) : buildWeeklyMenu(l.foodMenu);
  const todayMenu = weeklyMenu.find((menu) => menu.day === selectedWeekDay) ?? weeklyMenu[0];

  const promoted = !apiId && isPromotedListing(l.id, LISTINGS);

  const occupancyPriceSuffix = selectedBookingMode === 'hourly' ? '/hr' : selectedBookingMode === 'daily' ? '/day' : '/mo';
  type OccupancyOption = { key: string; title: string; hasAc: boolean; acLabel: 'AC' | 'Non-AC'; withFood: boolean; rent: number };
  type OccupancyTier = { sharingType: string; layout?: string; available: number; rent: number; options: OccupancyOption[] };
  const occupancyTiers: OccupancyTier[] = l.pricingVariants
    ? l.pricingVariants.map((v): OccupancyTier => ({
        sharingType: v.sharingType,
        layout: v.layout,
        available: v.available,
        rent: Math.min(v.acWithFood, v.acNoFood, v.nonAcWithFood, v.nonAcNoFood),
        options: [
          { key: `${v.layout}-ac-with-food`, title: `${v.sharingType} room with food`, hasAc: true, acLabel: 'AC', withFood: true, rent: v.acWithFood },
          { key: `${v.layout}-ac-without-food`, title: `${v.sharingType} room without food`, hasAc: true, acLabel: 'AC', withFood: false, rent: v.acNoFood },
          { key: `${v.layout}-nonac-with-food`, title: `${v.sharingType} room with food`, hasAc: false, acLabel: 'Non-AC', withFood: true, rent: v.nonAcWithFood },
          { key: `${v.layout}-nonac-without-food`, title: `${v.sharingType} room without food`, hasAc: false, acLabel: 'Non-AC', withFood: false, rent: v.nonAcNoFood },
        ],
      }))
    : (selectedBookingMode === 'hourly'
        ? l.hourlyPricing.map((h) => ({ sharingType: h.sharingType, rent: h.rentPerHour, available: h.available }))
        : selectedBookingMode === 'daily'
          ? l.dailyPricing.map((d) => ({ sharingType: d.sharingType, rent: d.rentPerDay, available: d.available }))
          : l.pricing
      ).map((tier): OccupancyTier => {
        const plans = monthlyPlansForTier(tier.rent, l.amenities.includes('AC'), l.foodIncluded);
        return {
          sharingType: tier.sharingType,
          available: tier.available,
          rent: tier.rent,
          options: [
            { key: `${tier.sharingType}-ac-with-food`, title: `${tier.sharingType} room with food`, hasAc: true, acLabel: 'AC', withFood: true, rent: plans.find((p) => p.key === occupancyPlanKey(true, true))?.amount ?? tier.rent },
            { key: `${tier.sharingType}-ac-without-food`, title: `${tier.sharingType} room without food`, hasAc: true, acLabel: 'AC', withFood: false, rent: plans.find((p) => p.key === occupancyPlanKey(true, false))?.amount ?? tier.rent },
            { key: `${tier.sharingType}-nonac-with-food`, title: `${tier.sharingType} room with food`, hasAc: false, acLabel: 'Non-AC', withFood: true, rent: plans.find((p) => p.key === occupancyPlanKey(false, true))?.amount ?? tier.rent },
            { key: `${tier.sharingType}-nonac-without-food`, title: `${tier.sharingType} room without food`, hasAc: false, acLabel: 'Non-AC', withFood: false, rent: plans.find((p) => p.key === occupancyPlanKey(false, false))?.amount ?? tier.rent },
          ],
        };
      });

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
            <StayBookingFields
              mode={selectedBookingMode}
              values={stayValues}
              onChange={setStayValues}
              showModeLabel
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

          {/* Occupancy */}
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
            <Divider style={{ marginTop: spacing.md, marginBottom: spacing.md }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text variant="bodyMd" weight="600">Safety deposit</Text>
                <Text variant="caption" color={palette.inkTertiary}>One-time refundable · same for all room types</Text>
              </View>
              <Text variant="bodyMd" weight="700" mono color={palette.navy}>{inr(l.securityDeposit)}</Text>
            </View>
          </Card>

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

          {/* Food menu */}
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
              <Text variant="h3">Food menu</Text>
              {l.foodIncluded ? (
                <PressableScale onPress={() => setFoodSheetOpen(true)} haptics={false}>
                  <Text variant="bodySm" weight="600" color={palette.coralDark}>More</Text>
                </PressableScale>
              ) : null}
            </View>
            {l.foodIncluded ? (
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
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Ionicons name="close-circle-outline" size={18} color={palette.inkTertiary} />
                <Text variant="bodySm" color={palette.inkSecondary}>
                  Food is not available at this property.
                </Text>
              </View>
            )}
          </Card>

          {/* Ratings & reviews */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
              <Text variant="h3">Ratings & reviews</Text>
              {canRate ? (
                <PressableScale onPress={() => setReviewOpen(true)} haptics={false} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="create-outline" size={15} color={palette.coralDark} />
                  <Text variant="bodySm" weight="600" color={palette.coralDark}>Write a review</Text>
                </PressableScale>
              ) : null}
            </View>

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

            {canRate ? (
              <Card style={{ marginBottom: spacing.md }}>
                {submitted ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <Ionicons name="checkmark-circle" size={26} color={palette.success} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMd" weight="700">Thanks for rating!</Text>
                      <Text variant="caption" color={palette.inkSecondary}>You rated this property {averageReviewRating.toFixed(1)} ★</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', gap: spacing.sm }}>
                    <Text variant="bodyMd" weight="600">Stayed here? Rate this property</Text>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <PressableScale key={n} haptics onPress={() => setReviewOpen(true)} scaleTo={0.85} style={{ padding: 2 }}>
                          <Ionicons name={n <= Math.round(averageReviewRating) ? 'star' : 'star-outline'} size={32} color={n <= Math.round(averageReviewRating) ? palette.star : palette.borderStrong} />
                        </PressableScale>
                      ))}
                    </View>
                    <Text variant="caption" color={palette.inkTertiary}>Rate category-wise to share your experience</Text>
                  </View>
                )}
              </Card>
            ) : null}

            {l.reviews.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }} style={{ marginHorizontal: -spacing.base, paddingHorizontal: spacing.base }}>
                {l.reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
              </ScrollView>
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
          label={l.verified ? 'Choose Room/Bed' : 'Request This Property'}
          icon={l.verified ? 'bed-outline' : 'paper-plane-outline'}
          onPress={() => l.verified ? router.push({
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
          }) : router.push(`/listing/${l.id}/request`)}
          disabled={l.verified && !selectedOccupancy}
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

      {/* Write-a-review sheet */}
      <Sheet visible={reviewOpen} onClose={() => setReviewOpen(false)} title="Rate this property" scroll>
        <View style={{ gap: spacing.base }}>
          <Text variant="bodySm" color={palette.inkSecondary}>Share your experience at {l.name} to help other tenants.</Text>
          {REVIEW_CATEGORIES.map((category) => (
            <Card key={category.key} style={{ backgroundColor: palette.surfaceRaised }}>
              <Text variant="bodyMd" weight="700">{category.label}</Text>
              <Text variant="caption" color={palette.inkSecondary} style={{ marginTop: 4 }}>
                {category.hint}
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <PressableScale
                    key={`${category.key}-${n}`}
                    haptics
                    onPress={() => setReviewRatings((prev) => ({ ...prev, [category.key]: n }))}
                    scaleTo={0.85}
                    style={{ padding: 2 }}
                  >
                    <Ionicons
                      name={n <= reviewRatings[category.key] ? 'star' : 'star-outline'}
                      size={28}
                      color={n <= reviewRatings[category.key] ? palette.star : palette.borderStrong}
                    />
                  </PressableScale>
                ))}
              </View>
              <Text variant="caption" color={reviewRatings[category.key] ? palette.inkSecondary : palette.inkTertiary} style={{ marginTop: spacing.sm }}>
                {reviewRatings[category.key]
                  ? ['Poor', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][reviewRatings[category.key]]
                  : 'Tap a star to rate'}
              </Text>
            </Card>
          ))}
          <Input label="Your review (optional)" placeholder="What did you like or dislike?" multiline maxLength={500} style={{ height: 100 }} />
          <Button
            label="Submit review"
            icon="checkmark"
            disabled={!hasCompletedReview}
            onPress={() => { haptic.success(); setSubmitted(true); setReviewOpen(false); }}
            full size="lg"
          />
        </View>
      </Sheet>
    </View>
  );
}
