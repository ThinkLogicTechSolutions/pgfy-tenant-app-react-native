/** T-S15 — Booking configuration & billing summary (KYC-gated). */
import { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Input, Divider, Badge, Sheet, PressableScale } from '@/components/ui';
import { StayDateRangeField } from '@/components/search';
import { getListing, resolveCoupon, COUPONS } from '@/data';
import { computeCheckout, type CheckoutIntent } from '@/lib/billing';
import type { BookingMode } from '@/data/types';
import { inr } from '@/lib/format';
import { defaultCheckIn, defaultCheckOut } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { useKyc } from '@/store/kyc';
import { useAuth } from '@/context/AuthContext';
import { requireLogin } from '@/lib/guestGuard';
import { propertyApi } from '@/lib/api';
import { parseApiPropertyId, propertyDetailsToListing } from '@/lib/listingAdapter';
import type { Listing } from '@/data/types';

export default function BookConfig() {
  const { id, room, bed, rent, sharing, appliedCode, checkIn, checkOut, bookingType } = useLocalSearchParams<{
    id: string;
    room: string;
    bed: string;
    rent: string;
    sharing: string;
    appliedCode?: string;
    checkIn?: string;
    checkOut?: string;
    bookingType?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const apiId = parseApiPropertyId(String(id));
  const mockListing = apiId ? null : getListing(String(id));
  const [apiListing, setApiListing] = useState<Listing | null>(null);
  useEffect(() => {
    if (!apiId) return;
    let active = true;
    propertyApi.getPropertyDetails(apiId).then((data) => { if (active) setApiListing(propertyDetailsToListing(data)); }).catch(() => {});
    return () => { active = false; };
  }, [apiId]);
  const listing = apiId ? apiListing : mockListing;
  const monthlyRent = Number(rent ?? 13000);
  const dep = listing?.securityDeposit ?? 26000;
  const [promo, setPromo] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [kycOpen, setKycOpen] = useState(false);
  const [stayDates, setStayDates] = useState(() => {
    const nextCheckIn = checkIn || defaultCheckIn();
    return {
      checkIn: nextCheckIn,
      checkOut: checkOut || defaultCheckOut(nextCheckIn),
    };
  });

  const kyc = useKyc();
  const { isGuest } = useAuth();
  const billingMode: BookingMode = bookingType === 'hourly' ? 'hourly' : bookingType === 'daily' ? 'daily' : 'monthly';
  const rentLabel = billingMode === 'hourly' ? 'Hourly rate' : billingMode === 'daily' ? 'Daily rate' : 'First month rent';
  const depositAmount = billingMode === 'monthly' ? dep : 0;
  const modeLabel = billingMode === 'monthly' ? 'Monthly' : billingMode === 'daily' ? 'Daily' : 'Hourly';
  const intent: CheckoutIntent = {
    kind: billingMode === 'hourly' ? 'booking-hourly' : billingMode === 'daily' ? 'booking-daily' : 'booking-monthly',
    title: `${listing?.name ?? 'Booking'} — ${modeLabel} booking`,
    subtitle: `${room} · Bed ${bed} · ${sharing}`,
    billingMode,
    baseAmount: monthlyRent,
    unitRate: monthlyRent,
    deposit: depositAmount,
    allowAutopay: billingMode === 'monthly',
    listingId: String(id),
  };
  const quote = computeCheckout(intent, appliedCoupon ?? undefined);
  const netPayable = quote.total;
  const kycVerified = kyc.verified;

  useEffect(() => {
    if (!appliedCode) return;
    const coupon = resolveCoupon(appliedCode);
    if (coupon) {
      setPromo(coupon.code);
      setDiscount(coupon.discount);
      setAppliedCoupon(coupon.code);
    }
  }, [appliedCode]);

  const applyPromo = () => {
    const coupon = resolveCoupon(promo);
    if (coupon) {
      setDiscount(coupon.discount);
      setAppliedCoupon(coupon.code);
      setPromo(coupon.code);
      haptic.success();
    } else {
      setDiscount(0);
      setAppliedCoupon(null);
      haptic.error();
    }
  };

  const openAllOffers = () => {
    router.push({
      pathname: `/listing/${id}/offers`,
      params: {
        room: room ?? '',
        bed: bed ?? '',
        rent: rent ?? '',
        sharing: sharing ?? '',
        appliedCode: appliedCoupon ?? '',
        checkIn: stayDates.checkIn,
        checkOut: stayDates.checkOut,
      },
    });
  };

  const proceed = () => {
    if (isGuest) { requireLogin(router, 'Please login to continue with your booking.'); return; }
    if (!kycVerified) { setKycOpen(true); return; }
    router.push({
      pathname: '/checkout',
      params: { intent: JSON.stringify(intent), coupon: appliedCoupon ?? '' },
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

        {/* Selected bed */}
        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>YOUR SELECTION</Text>
          <Row k="Property" v={listing?.name ?? '—'} />
          <Row k="Room / Bed" v={`${room} · Bed ${bed}`} />
          <Row k="Sharing" v={String(sharing)} />
          <Row k="Address" v={`${listing?.locality}, ${listing?.city}`} last />
        </Card>

        {/* Dates */}
        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>STAY DATES</Text>
          <StayDateRangeField
            checkIn={stayDates.checkIn}
            checkOut={stayDates.checkOut}
            onChange={setStayDates}
          />
        </Card>

        {/* Promo */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <Text variant="overline" color={palette.inkTertiary}>OFFERS</Text>
            <PressableScale onPress={openAllOffers} haptics={false} scaleTo={0.98}>
              <Text variant="bodySm" weight="600" color={palette.coralDark}>View all</Text>
            </PressableScale>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Input containerStyle={{ flex: 1 }} placeholder="Promo code" value={promo} onChangeText={setPromo} autoCapitalize="characters" icon="pricetag-outline" />
            <Button label="Apply" variant="subtle" onPress={applyPromo} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginTop: spacing.md }}>
            {COUPONS.slice(0, 5).map((coupon) => {
              const isApplied = appliedCoupon === coupon.code;
              return (
                <PressableScale
                  key={coupon.code}
                  onPress={() => {
                    setPromo(coupon.code);
                    const resolved = resolveCoupon(coupon.code);
                    if (!resolved) return;
                    setDiscount(resolved.discount);
                    setAppliedCoupon(resolved.code);
                    haptic.success();
                  }}
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
                  <Text variant="bodySm" weight="700">{coupon.title}</Text>
                  <Text variant="caption" color={palette.inkSecondary} numberOfLines={2}>{coupon.description}</Text>
                  <Text variant="caption" mono weight="700" color={palette.navy} style={{ marginTop: spacing.xs }}>{coupon.code}</Text>
                </PressableScale>
              );
            })}
          </ScrollView>
          {discount > 0 && appliedCoupon ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm }}>
              <Ionicons name="checkmark-circle" size={16} color={palette.success} />
              <Text variant="caption" color={palette.success}>{appliedCoupon} applied — you saved {inr(discount)}!</Text>
            </View>
          ) : null}
        </Card>

        {/* Bill */}
        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>BILL SUMMARY</Text>
          <Row k={rentLabel} v={inr(quote.base)} />
          {quote.deposit > 0 ? <Row k="Security deposit (refundable)" v={inr(quote.deposit)} /> : null}
          {quote.platformFee > 0 ? <Row k="Platform fee" v={inr(quote.platformFee)} /> : null}
          <Row k={quote.gstRate === 0 ? 'GST (exempt)' : `GST (${quote.gstRate}%)`} v={inr(quote.gst)} />
          {quote.couponDiscount > 0 ? <Row k="Discount" v={`− ${inr(quote.couponDiscount)}`} accent={palette.success} /> : null}
          <Divider style={{ marginVertical: spacing.sm }} />
          <Row k="Net payable now" v={inr(netPayable)} bold last />
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
          <Text variant="h3" mono color={palette.navy}>{inr(netPayable)}</Text>
        </View>
        <Button label="Proceed to Pay" icon="lock-closed" onPress={proceed} full size="lg" style={{ flex: 1 }} />
      </View>

      <Sheet visible={kycOpen} onClose={() => setKycOpen(false)} title="Verify your profile">
        <View style={{ gap: spacing.base }}>
          <Text variant="bodySm" color={palette.inkSecondary}>Booking needs a SnapKYC-verified profile. It only takes a couple of minutes.</Text>
          <Button label="Complete KYC now" icon="shield-checkmark-outline" full size="lg" onPress={() => { setKycOpen(false); router.push('/(auth)/kyc-intro'); }} />
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
