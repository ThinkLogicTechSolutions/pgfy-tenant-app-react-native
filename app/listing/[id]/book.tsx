/** T-S15 — Booking configuration & billing summary (KYC-gated). */
import { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Input, Divider, Badge, Sheet, PressableScale, Skeleton } from '@/components/ui';
import { StayBookingFields, type StayBookingValues } from '@/components/search';
import { getListing } from '@/data';
import { computeCheckout, platformFeeFromMasterConfig, isCouponUsable, couponDiscountAmount, referralDiscountAmount, type CheckoutIntent, type AppliedCoupon } from '@/lib/billing';
import { computeMonthlyProration } from '@/lib/proration';
import type { BookingMode } from '@/data/types';
import { inr } from '@/lib/format';
import { defaultCheckOut, clampCheckInToFuture, daysBetween } from '@/lib/dates';
import { useCheckInFreshness } from '@/lib/useCheckInFreshness';
import { haptic } from '@/lib/haptics';
import { useAuth } from '@/context/AuthContext';
import { useMasterData } from '@/context/MasterDataContext';
import { requireLogin } from '@/lib/guestGuard';
import { propertyApi, couponsApi, type ApiCoupon } from '@/lib/api';
import { parseApiPropertyId, propertyDetailsToListing } from '@/lib/listingAdapter';
import { getCachedPropertyDetails, cachePropertyDetails } from '@/store/propertyDetailsCache';
import type { Listing } from '@/data/types';

/** Matches the gender values written by the guest-details step (`app/listing/[id]/guests.tsx`). */
const GUEST_GENDER_LABEL: Record<string, string> = { MALE: 'Male', FEMALE: 'Female', UNISEX: 'Other' };

export default function BookConfig() {
  const {
    id, room, bed, rent, sharing, appliedCode, checkIn, checkOut, startTime, hours, bookingType,
    propertyId, roomId, bedId, floorId, layout, isAc, withFood, guests, securityDeposit,
  } = useLocalSearchParams<{
    id: string;
    room: string;
    bed: string;
    rent: string;
    sharing: string;
    appliedCode?: string;
    checkIn?: string;
    checkOut?: string;
    startTime?: string;
    hours?: string;
    bookingType?: string;
    propertyId?: string;
    roomId?: string;
    bedId?: string;
    floorId?: string;
    layout?: string;
    isAc?: string;
    withFood?: string;
    /** Flat/Home stay only — JSON-encoded `{name,gender,age}[]`, set by the guest-details step. */
    guests?: string;
    /** Hostel only — the exact selected layout's MONTHLY deposit (set by the room/bed picker),
     *  more precise than `listing.securityDeposit` since deposits can differ per layout. */
    securityDeposit?: string;
  }>();
  /** Flat/Home stay: whole-property booking with named guests instead of a room/bed pick. */
  const guestList: { name: string; gender: string; age: number }[] = guests ? JSON.parse(guests) : [];
  const isUnitBooking = guestList.length > 0;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const apiId = parseApiPropertyId(String(id));
  const mockListing = apiId ? null : getListing(String(id));
  const [apiListing, setApiListing] = useState<Listing | null>(() => (apiId ? getCachedPropertyDetails(apiId) ?? null : null));
  useEffect(() => {
    if (!apiId) return;
    // Already fetched on the listing-detail screen — skip the redundant round trip.
    const cached = getCachedPropertyDetails(apiId);
    if (cached) { setApiListing(cached); return; }
    let active = true;
    propertyApi.getPropertyDetails(apiId).then((data) => {
      if (!active) return;
      const mapped = propertyDetailsToListing(data);
      setApiListing(mapped);
      cachePropertyDetails(apiId, mapped);
    }).catch(() => {});
    return () => { active = false; };
  }, [apiId]);
  const listing = apiId ? apiListing : mockListing;
  const monthlyRent = Number(rent ?? 13000);
  const dep = (securityDeposit != null ? Number(securityDeposit) : undefined) ?? listing?.securityDeposit ?? 26000;
  const [promo, setPromo] = useState('');
  const [promoError, setPromoError] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [coupons, setCoupons] = useState<ApiCoupon[]>([]);
  const [kycOpen, setKycOpen] = useState(false);
  const [guestsSheetOpen, setGuestsSheetOpen] = useState(false);

  // Real coupons (billing_api.md) are property-scoped — nothing to fetch for a mock listing.
  useEffect(() => {
    if (!apiId) { setCoupons([]); return; }
    let active = true;
    couponsApi.listCoupons({ propertyId: apiId })
      .then((list) => { if (active) setCoupons(list.filter(isCouponUsable)); })
      .catch(() => { if (active) setCoupons([]); });
    return () => { active = false; };
  }, [apiId]);
  const billingMode: BookingMode = bookingType === 'hourly' ? 'hourly' : bookingType === 'daily' ? 'daily' : 'monthly';

  // Monthly bookings starting mid-cycle prorate against the property's own DAILY price for
  // this occupancy when it has one configured — fetched fresh (scoped to DAILY) since the
  // listing above was fetched scoped to MONTHLY and doesn't carry DAILY tiers.
  const [dailyRateOverride, setDailyRateOverride] = useState<number | null>(null);
  // Tracks the DAILY-pricing lookup below so the bill summary can hold off rendering numbers
  // that are about to change — otherwise the tenant briefly sees a `monthlyRent/daysInMonth`
  // estimate that then jumps to the property's real configured daily rate a moment later.
  const [dailyRateLoading, setDailyRateLoading] = useState(false);
  useEffect(() => {
    if (!apiId || billingMode !== 'monthly' || !listing?.bookingConfig.dailyEnabled) {
      setDailyRateOverride(null);
      setDailyRateLoading(false);
      return;
    }
    let active = true;
    setDailyRateLoading(true);
    propertyApi.getPropertyDetails(apiId, { bookingMode: 'DAILY' })
      .then((data) => {
        if (!active) return;
        const tier = isUnitBooking
          ? data.pricing.find((t) => t.rent != null)
          : data.pricing.find((t) => t.layout === layout);
        const rate = isUnitBooking
          ? tier?.rent
          : isAc === 'true'
            ? (withFood === 'true' ? tier?.ac_with_food : tier?.ac_no_food)
            : (withFood === 'true' ? tier?.non_ac_with_food : tier?.non_ac_no_food);
        setDailyRateOverride(rate ?? null);
      })
      .catch(() => { if (active) setDailyRateOverride(null); })
      .finally(() => { if (active) setDailyRateLoading(false); });
    return () => { active = false; };
  }, [apiId, billingMode, listing?.bookingConfig.dailyEnabled, isUnitBooking, layout, isAc, withFood]);
  const [stayDates, setStayDates] = useState<StayBookingValues>(() => {
    const nextCheckIn = clampCheckInToFuture(checkIn);
    return {
      checkIn: nextCheckIn,
      checkOut: checkOut || defaultCheckOut(nextCheckIn),
      startTime: startTime || '10:00',
      hours: hours ? Number(hours) : 4,
    };
  });
  // See `useCheckInFreshness` — this screen can sit open (or merely backgrounded) for a
  // while before the tenant actually pays, so re-clamp forward on focus and on app resume
  // rather than trusting the one-time mount computation above.
  useCheckInFreshness(setStayDates);

  // Mid-month check-in (day 8+) only charges from check-in through month-end — an estimate
  // of the real server-side proration (`computeBookingBill.ts`), shown so "Payable now"
  // doesn't overstate the actual first-month charge.
  const proration = billingMode === 'monthly' ? computeMonthlyProration(monthlyRent, stayDates.checkIn, dailyRateOverride) : null;
  const firstMonthRent = proration ? proration.moveInRent : monthlyRent;
  // Only a mid-month check-in's rent actually depends on `dailyRateOverride` — a day-1–7
  // check-in charges the full month regardless, so there's nothing to wait on in that case.
  const billPending = !!proration?.isProrated && dailyRateLoading;

  // Daily/hourly bill for the FULL stay, not just one unit — `monthlyRent` here is really
  // "the per-unit rate for whatever billingMode is active" (per-day or per-hour, despite the
  // name), carried in via the `rent` route param from the occupancy/room picker.
  const stayNights = billingMode === 'daily' ? daysBetween(stayDates.checkIn, stayDates.checkOut) : 0;
  const totalBaseAmount = billingMode === 'monthly'
    ? firstMonthRent
    : billingMode === 'daily'
      ? monthlyRent * stayNights
      : monthlyRent * stayDates.hours;

  const { isGuest, user } = useAuth();
  const { config: masterConfig } = useMasterData();
  const kycVerified = user?.kyc_status === 'VERIFIED';
  const rentLabel = billingMode === 'hourly'
    ? `Hourly rate (${stayDates.hours} hr${stayDates.hours === 1 ? '' : 's'})`
    : billingMode === 'daily'
      ? `Daily rate (${stayNights} night${stayNights === 1 ? '' : 's'})`
      : proration?.isProrated
        ? `First month rent (${proration.proratedDays} days)`
        : 'First month rent';
  const depositAmount = billingMode === 'monthly' ? dep : 0;
  const modeLabel = billingMode === 'monthly' ? 'Monthly' : billingMode === 'daily' ? 'Daily' : 'Hourly';
  const apiBookingMode = billingMode === 'hourly' ? 'HOURLY' : billingMode === 'daily' ? 'DAILY' : 'MONTHLY';
  const canCreateBooking = !!(apiId && propertyId && (isUnitBooking || (roomId && bedId && layout)));
  // Hourly bookings send the date and start time as two separate fields (`check_in_date` is
  // date-only, the start time rides on `hourly_start_slot` as minutes-since-midnight) — not a
  // combined ISO datetime like daily/monthly. Sending the start time embedded in
  // `check_in_date` (as an ISO datetime, UTC-tagged or not) doesn't match this contract at
  // all, which is how a pick that's clearly inside the property's window (e.g. 8:00 AM within
  // an 8:00–18:00 window) could still get rejected as outside it.
  const bookingCheckInDate = billingMode === 'hourly' ? stayDates.checkIn : `${stayDates.checkIn}T00:00:00.000Z`;
  const hourlyStartSlot = (() => {
    const [h, m] = stayDates.startTime.split(':').map(Number);
    return h * 60 + m;
  })();
  const intent: CheckoutIntent = {
    kind: billingMode === 'hourly' ? 'booking-hourly' : billingMode === 'daily' ? 'booking-daily' : 'booking-monthly',
    title: `${listing?.name ?? 'Booking'} — ${modeLabel} booking`,
    subtitle: isUnitBooking ? `${guestList.length} guest${guestList.length > 1 ? 's' : ''}` : `${room} · Bed ${bed} · ${sharing}`,
    billingMode,
    baseAmount: totalBaseAmount,
    // GST classification uses the full monthly rate (matches the backend, which resolves the
    // GST rate from the property's config independent of proration).
    unitRate: monthlyRent,
    deposit: depositAmount,
    allowAutopay: billingMode === 'monthly',
    listingId: String(id),
    platformFeeOverride: platformFeeFromMasterConfig(monthlyRent, masterConfig),
    ...(canCreateBooking ? {
      booking: {
        propertyId: Number(propertyId),
        bookingMode: apiBookingMode,
        checkInDate: bookingCheckInDate,
        ...(billingMode === 'daily' ? { checkOutDate: `${stayDates.checkOut}T00:00:00.000Z` } : {}),
        ...(billingMode === 'hourly' ? { durationHours: stayDates.hours, hourlyStartSlot } : {}),
        ...(isUnitBooking
          ? { guests: guestList, guestCount: guestList.length }
          : {
              roomId: Number(roomId),
              bedId: Number(bedId),
              floorId: floorId ? Number(floorId) : undefined,
              isAc: isAc === 'true',
              hasFood: withFood === 'true',
              roomLayout: layout!,
            }),
      },
    } : {}),
  };
  // A referral signup discount applies automatically (`applicable: true`) unless the tenant
  // picks a manual coupon instead — the manual choice always wins.
  const referralDiscount = listing?.referralDiscount;
  const referralAppliedCoupon: AppliedCoupon | null = referralDiscount?.applicable
    ? { code: 'REFERRAL', label: 'Referral discount', amount: referralDiscountAmount(referralDiscount.type, referralDiscount.value, monthlyRent) }
    : null;
  const effectiveCoupon = appliedCoupon ?? referralAppliedCoupon ?? undefined;

  const quote = computeCheckout(intent, effectiveCoupon);
  const netPayable = quote.total;

  const findCoupon = (code: string) => coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());

  const applyCouponCode = (code: string) => {
    const coupon = findCoupon(code);
    if (coupon) {
      setAppliedCoupon({ code: coupon.code, amount: couponDiscountAmount(coupon, monthlyRent) });
      setPromo(coupon.code);
      setPromoError(false);
      haptic.success();
    } else {
      setAppliedCoupon(null);
      setPromoError(true);
      haptic.error();
    }
  };

  // The offers screen (or a deep link) hands back a code via this param — re-resolve it
  // against the real coupon list once that's loaded.
  useEffect(() => {
    if (!appliedCode || coupons.length === 0) return;
    applyCouponCode(appliedCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedCode, coupons]);

  const applyPromo = () => applyCouponCode(promo);

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setPromo('');
    setPromoError(false);
  };

  const openAllOffers = () => {
    router.push({
      pathname: `/listing/${id}/offers`,
      params: {
        room: room ?? '',
        bed: bed ?? '',
        rent: rent ?? '',
        sharing: sharing ?? '',
        appliedCode: appliedCoupon?.code ?? '',
        checkIn: stayDates.checkIn,
        checkOut: stayDates.checkOut,
        propertyId: propertyId ?? '',
      },
    });
  };

  const proceed = () => {
    if (isGuest) { requireLogin(router, 'Please login to continue with your booking.'); return; }
    if (!kycVerified) { setKycOpen(true); return; }
    router.push({
      pathname: '/checkout',
      params: { intent: JSON.stringify(intent), coupon: effectiveCoupon ? JSON.stringify(effectiveCoupon) : '' },
    });
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Review booking" subtitle={listing?.name} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: 130, gap: spacing.base }} showsVerticalScrollIndicator={false}>
        {/* Booking type */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Badge label="Instant Confirmation" tone="success" icon="flash" />
          <Badge label="Secure payment" tone="info" icon="lock-closed" />
        </View>

        {/* Selected bed / guests */}
        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>YOUR SELECTION</Text>
          <Row k="Property" v={listing?.name ?? '—'} />
          {isUnitBooking ? (
            <>
              {/* <Row k="Booking" v="Whole property" /> */}
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm }}>
                  <Text variant="bodySm" color={palette.inkSecondary}>Guests</Text>
                  <PressableScale onPress={() => setGuestsSheetOpen(true)} haptics={false} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text variant="bodySm" weight="600">{guestList.length} guest{guestList.length === 1 ? '' : 's'}</Text>
                    <Text variant="bodySm" weight="600" color={palette.coralDark}>View all</Text>
                  </PressableScale>
                </View>
                <Divider />
              </View>
            </>
          ) : (
            <>
              <Row k="Room / Bed" v={`${room} · Bed ${bed}`} />
              <Row k="Sharing" v={String(sharing)} />
            </>
          )}
          <Row k="Address" v={`${listing?.locality}, ${listing?.city}`} last />
        </Card>

        {/* Dates */}
        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>STAY DATES</Text>
          <StayBookingFields
            mode={billingMode}
            values={stayDates}
            onChange={setStayDates}
          />
        </Card>

        {/* Promo — real coupons (billing_api.md) are property-scoped, so there's nothing to
            offer on a mock listing, and no card at all once we know there's nothing on offer
            for this property. A referral discount (if any) still applies and shows in the
            payment summary below regardless of whether this card renders. */}
        {apiId && coupons.length > 0 ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text variant="overline" color={palette.inkTertiary}>OFFERS</Text>
              <PressableScale onPress={openAllOffers} haptics={false} scaleTo={0.98}>
                <Text variant="bodySm" weight="600" color={palette.coralDark}>View all</Text>
              </PressableScale>
            </View>
            {!appliedCoupon && referralAppliedCoupon ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: palette.successTint, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm }}>
                <Ionicons name="gift-outline" size={16} color={palette.success} />
                <Text variant="caption" color={palette.success} style={{ flex: 1 }}>
                  Referral discount applied — you saved {inr(referralAppliedCoupon.amount)}!
                </Text>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Input containerStyle={{ flex: 1 }} placeholder="Promo code" value={promo} onChangeText={(v) => { setPromo(v); setPromoError(false); }} autoCapitalize="characters" icon="pricetag-outline" />
              <Button label="Apply" variant="subtle" onPress={applyPromo} />
            </View>
            {promoError ? (
              <Text variant="caption" color={palette.danger} style={{ marginTop: spacing.sm }}>That coupon code isn't valid.</Text>
            ) : null}
            {coupons.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginTop: spacing.md }}>
                {coupons.slice(0, 5).map((coupon) => {
                  const isApplied = appliedCoupon?.code === coupon.code;
                  return (
                    <PressableScale
                      key={coupon.id}
                      onPress={() => applyCouponCode(coupon.code)}
                      haptics={false}
                      style={{
                        width: 200,
                        backgroundColor: isApplied ? palette.coralTint : palette.surfaceRaised,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: isApplied ? palette.coral : palette.border,
                        padding: spacing.md,
                        gap: 4,
                      }}
                    >
                      <Text variant="bodySm" weight="700">
                        {coupon.discount_type === 'PERCENTAGE' ? `${coupon.discount_amount}% off` : `${inr(coupon.discount_amount)} off`}
                      </Text>
                      {coupon.description ? <Text variant="caption" color={palette.inkSecondary} numberOfLines={2}>{coupon.description}</Text> : null}
                      <Text variant="caption" mono weight="700" color={palette.navy} style={{ marginTop: spacing.xs }}>{coupon.code}</Text>
                    </PressableScale>
                  );
                })}
              </ScrollView>
            ) : null}
            {appliedCoupon ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginTop: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Ionicons name="checkmark-circle" size={16} color={palette.success} />
                  <Text variant="caption" color={palette.success} style={{ flex: 1 }}>{appliedCoupon.code} applied — you saved {inr(appliedCoupon.amount)}!</Text>
                </View>
                <PressableScale onPress={removeCoupon} haptics={false}>
                  <Text variant="caption" weight="600" color={palette.danger}>Remove</Text>
                </PressableScale>
              </View>
            ) : null}
          </Card>
        ) : null}

        {/* Bill */}
        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>BILL SUMMARY</Text>
          {billPending ? (
            <View style={{ gap: spacing.md, paddingVertical: spacing.xs }}>
              <Skeleton width="100%" height={16} />
              <Skeleton width="70%" height={16} />
              <Skeleton width="55%" height={16} />
              <Skeleton width="80%" height={20} />
            </View>
          ) : (
            <>
              {proration?.isProrated ? (
                <Text variant="caption" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>
                  Charged only for {proration.proratedDays} days this month (check-in to month-end) — full {inr(monthlyRent)}/mo from next month.
                </Text>
              ) : null}
              <Row k={rentLabel} v={inr(quote.base)} />
              {quote.deposit > 0 ? <Row k="Security deposit (refundable)" v={inr(quote.deposit)} /> : null}
              {quote.platformFee > 0 ? <Row k="Platform fee" v={inr(quote.platformFee)} /> : null}
              <Row k={quote.gstRate === 0 ? 'GST (exempt)' : `GST (${quote.gstRate}%)`} v={inr(quote.gst)} />
              {quote.couponDiscount > 0 ? (
                <Row
                  k={appliedCoupon ? `Coupon discount (${quote.couponCode})` : 'Referral discount'}
                  v={`− ${inr(quote.couponDiscount)}`}
                  accent={palette.success}
                />
              ) : null}
              <Divider style={{ marginVertical: spacing.sm }} />
              <Row k="Net payable now" v={inr(netPayable)} bold last />
            </>
          )}
        </Card>

        {/* Confidence */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Badge label="Verified property" tone="success" icon="shield-checkmark" small />
          <Badge label="Refundable deposit" tone="info" icon="cash-outline" small />
        </View>

        {!kycVerified ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', backgroundColor: palette.warningTint, padding: spacing.md, borderRadius: radius.md }}>
            <Ionicons name="alert-circle" size={18} color={palette.warning} />
            <Text variant="caption" color="#B26A00" style={{ flex: 1 }}>Complete your SnapKYC profile to confirm this booking.</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
        <View>
          <Text variant="caption" color={palette.inkTertiary}>Payable</Text>
          {billPending ? <Skeleton width={90} height={22} /> : <Text variant="h3" mono color={palette.navy}>{inr(netPayable)}</Text>}
        </View>
        <Button label="Proceed to Pay" icon="lock-closed" onPress={proceed} full size="lg" style={{ flex: 1 }} disabled={billPending} />
      </View>

      <Sheet visible={kycOpen} onClose={() => setKycOpen(false)} title="Verify your profile">
        <View style={{ gap: spacing.base }}>
          <Text variant="bodySm" color={palette.inkSecondary}>Booking needs a SnapKYC-verified profile. It only takes a couple of minutes.</Text>
          <Button label="Complete KYC now" icon="shield-checkmark-outline" full size="lg" onPress={() => { setKycOpen(false); router.push('/(auth)/kyc-intro'); }} />
        </View>
      </Sheet>

      <Sheet visible={guestsSheetOpen} onClose={() => setGuestsSheetOpen(false)} title="Guest details" scroll>
        <View style={{ gap: spacing.sm }}>
          {guestList.map((g, i) => (
            <View key={i} style={{ backgroundColor: palette.surfaceRaised, borderRadius: radius.md, padding: spacing.base }}>
              <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: 4 }}>GUEST {i + 1}</Text>
              <Text variant="bodyMd" weight="700">{g.name}</Text>
              <Text variant="caption" color={palette.inkTertiary}>{g.age} years · {GUEST_GENDER_LABEL[g.gender] ?? g.gender}</Text>
            </View>
          ))}
        </View>
      </Sheet>
    </View>
  );
}

function Row({ k, v, bold, last, accent }: { k: string; v: string; bold?: boolean; last?: boolean; accent?: string }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm }}>
        <Text variant={bold ? 'bodyMd' : 'bodySm'} weight={bold ? '700' : '400'} color={bold ? palette.ink : palette.inkSecondary} style={{ flex: 1 }}>{k}</Text>
        <Text variant={bold ? 'bodyMd' : 'bodySm'} weight={bold ? '700' : '600'} mono color={accent ?? (bold ? palette.navy : palette.ink)}>{v}</Text>
      </View>
      {!last && !bold ? <Divider /> : null}
    </View>
  );
}
