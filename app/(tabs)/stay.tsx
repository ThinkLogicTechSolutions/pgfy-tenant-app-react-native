/** T-S20 — Tenant dashboard (post-booking home hub). Driven by the tenant's real confirmed/
 *  checked-in bookings (`GET /tenant/booking`); the selected booking's full property details
 *  are fetched separately (cached) to power food menu / directions / share. */
import { useEffect, useState } from 'react';
import { View, ScrollView, useWindowDimensions, Linking, Alert, Platform, Share, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, spacing, radius } from '@/theme';
import { Text, Card, Button, IconButton, PressableScale, Sheet, EmptyState, Badge } from '@/components/ui';
import { WeeklyFoodMenuSheet } from '@/components/domain';
import { EmptyAuth, EmptyBookings } from '@/components/illustrations';
import { bookingApi, propertyApi, errorMessage, type ApiBooking } from '@/lib/api';
import { bookingCoverImage, bookingModeLabel, bookingStatusLabel, bookingStatusTone, isCheckedIn } from '@/lib/bookingDisplay';
import { propertyDetailsToListing } from '@/lib/listingAdapter';
import { getCachedPropertyDetails, cachePropertyDetails } from '@/store/propertyDetailsCache';
import { inr, formatDate } from '@/lib/format';
import { useProfile } from '@/store/profile';
import { useAuth } from '@/context/AuthContext';
import { LOGIN_ROUTE } from '@/lib/guestGuard';
import type { Listing } from '@/data/types';

const QUICK = [
  { icon: 'receipt-outline', label: 'Invoices', route: '/billing', tint: palette.success },
  { icon: 'restaurant-outline', label: 'Food Menu', route: 'food-menu', tint: palette.coral },
  { icon: 'construct-outline', label: 'Support', route: 'property-support', tint: palette.warning },
  { icon: 'people-outline', label: 'Visitors', route: '/visitors', tint: palette.info },
  { icon: 'swap-horizontal-outline', label: 'Room Swap', route: '/room-swap', tint: palette.navy },
  { icon: 'exit-outline', label: 'Move Out', route: '/move-out', tint: palette.danger },
];

/** A confirmed hold or an ongoing checked-in stay — the two states "My Stay" shows. */
const MY_STAY_STATUSES = ['CONFIRMED', 'CHECKED_IN'];

export default function Stay() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isGuest } = useAuth();

  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [foodMenuOpen, setFoodMenuOpen] = useState(false);
  const [propertyListing, setPropertyListing] = useState<Listing | null>(null);
  const profile = useProfile();
  const { width } = useWindowDimensions();
  // Floor the tile width so 3 columns + 2 gaps never overflow & wrap unevenly.
  const tileW = Math.floor((width - spacing.base * 2 - spacing.md * 2) / 3);

  const load = () => {
    setLoading(true);
    setError(null);
    bookingApi.listBookings({ limit: 50 })
      .then((page) => {
        const stays = page.data.filter((b) => MY_STAY_STATUSES.includes(b.status));
        setBookings(stays);
        setSelectedId((prev) => (prev && stays.some((s) => s.id === prev) ? prev : stays[0]?.id ?? null));
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isGuest) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest]);

  const b = bookings.find((s) => s.id === selectedId) ?? null;

  // Full property details (food menu, coordinates, amenities) for the selected stay —
  // reuses the listing-detail cache so re-visiting a property doesn't re-fetch it.
  useEffect(() => {
    if (!b) { setPropertyListing(null); return; }
    const cached = getCachedPropertyDetails(b.property.id);
    if (cached) { setPropertyListing(cached); return; }
    let active = true;
    propertyApi.getPropertyDetails(b.property.id).then((data) => {
      if (!active) return;
      const mapped = propertyDetailsToListing(data);
      setPropertyListing(mapped);
      cachePropertyDetails(b.property.id, mapped);
    }).catch(() => {});
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b?.property.id]);

  if (isGuest) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', paddingTop: insets.top, paddingHorizontal: spacing.base }}>
        <EmptyState
          illustration={<EmptyAuth />}
          title="You haven't logged in"
          message="Login to continue and view your stay."
          actionLabel="Log in"
          onAction={() => router.push(LOGIN_ROUTE)}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }}>
        <ActivityIndicator color={palette.coral} />
      </View>
    );
  }

  if (error || !b) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', paddingTop: insets.top, paddingHorizontal: spacing.base }}>
        <EmptyState
          illustration={<EmptyBookings />}
          title={error ? "Couldn't load your stay" : 'No active stay yet'}
          message={error ?? 'Once a booking is confirmed, it shows up here.'}
          actionLabel={error ? 'Retry' : 'Browse properties'}
          onAction={error ? load : () => router.push('/(tabs)')}
        />
      </View>
    );
  }

  const checkedIn = isCheckedIn(b);
  const rateSuffix = b.booking_mode === 'HOURLY' ? '/hr' : b.booking_mode === 'DAILY' ? '/day' : '/mo';

  const shareProperty = async () => {
    const link = `https://pgfy.in/p/api-${b.property.id}`;
    try {
      await Share.share({
        message: `Check out ${b.property.name} on PGfy in ${b.property.locality} — find your next stay here: ${link}`,
      });
    } catch {
      // user dismissed the share sheet
    }
  };

  const openDirections = async () => {
    if (!propertyListing || (!propertyListing.lat && !propertyListing.lng)) {
      Alert.alert('Directions unavailable', 'This property has no location on file yet.');
      return;
    }
    const label = encodeURIComponent(`${b.property.name}, ${b.property.locality}, ${b.property.city}`);
    const appleUrl = `http://maps.apple.com/?ll=${propertyListing.lat},${propertyListing.lng}&q=${label}`;
    const googleUrl = `https://www.google.com/maps/search/?api=1&query=${propertyListing.lat},${propertyListing.lng}`;
    const url = Platform.OS === 'ios' ? appleUrl : googleUrl;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open maps', 'Please try again in a moment.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing['3xl'] }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View>
          <Image source={{ uri: bookingCoverImage(b.property) }} style={{ width: '100%', height: 200 + insets.top }} contentFit="cover" />
          <LinearGradient colors={['rgba(1,38,78,0.5)', 'rgba(1,38,78,0.2)', 'rgba(1,38,78,0.85)']} style={{ position: 'absolute', inset: 0 }} />
          <View style={{ position: 'absolute', top: insets.top + spacing.xs, left: spacing.base, right: spacing.base, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <PressableScale onPress={() => setSwitcherOpen(true)} disabled={bookings.length <= 1}>
              <Text variant="bodySm" weight="700" color="rgba(255,255,255,0.92)">YOUR STAY</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Text variant="bodyMd" weight="700" color={palette.white}>{b.code}</Text>
                {bookings.length > 1 ? (
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="chevron-down" size={13} color={palette.white} />
                  </View>
                ) : null}
              </View>
            </PressableScale>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <IconButton icon="share-social-outline" color={palette.white} bg="rgba(255,255,255,0.18)" style={{ borderColor: 'transparent' }} onPress={shareProperty} />
              <IconButton icon="navigate-outline" color={palette.white} bg="rgba(255,255,255,0.18)" style={{ borderColor: 'transparent' }} onPress={openDirections} />
            </View>
          </View>
          <View style={{ position: 'absolute', bottom: spacing.base, left: spacing.base, right: spacing.base }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text variant="h1" color={palette.white} style={{ flex: 1 }} numberOfLines={1}>{b.property.name}</Text>
              <Badge label={bookingStatusLabel(b.status)} tone={bookingStatusTone(b.status)} small />
            </View>
            <Text variant="bodySm" color="rgba(255,255,255,0.85)" style={{ marginTop: 2 }}>
              {propertyListing?.addressLine ? `${propertyListing.addressLine}, ` : ''}{b.property.locality} · Since {formatDate(b.check_in_date)}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.base, gap: spacing.base }}>
          {/* Rent / rate card — adapts to the booking mode */}
          <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color={palette.inkTertiary}>
                {b.booking_mode === 'MONTHLY' ? 'MONTHLY RENT' : b.booking_mode === 'HOURLY' ? 'HOURLY RATE' : 'DAILY RATE'}
              </Text>
              <Text variant="numLg" mono color={palette.ink} style={{ marginTop: 2 }}>{inr(b.base_rent)}{rateSuffix}</Text>
              <Text variant="caption" color={palette.inkSecondary}>
                {b.booking_mode === 'MONTHLY' && b.next_rent_due
                  ? `Next due ${formatDate(b.next_rent_due)}`
                  : b.check_out_date ? `Until ${formatDate(b.check_out_date)}` : 'Active stay'}
              </Text>
            </View>
            {b.booking_mode === 'MONTHLY' ? <Button label="Pay now" icon="flash" onPress={() => router.push('/billing')} /> : null}
          </Card>

          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
              <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: palette.navyTint, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="bed-outline" size={20} color={palette.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="h3">Room, bed information</Text>
                <Text variant="caption" color={palette.inkTertiary}>Your current hostel allocation</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <InfoTile label="Room" value={b.room_number} />
              <DividerVertical />
              <InfoTile label="Bed" value={b.bed_number} />
              <DividerVertical />
              <InfoTile label="Layout" value={bookingModeLabel(b.room_layout)} />
            </View>
          </Card>

          {/* Roommate preferences — prompt to complete if skipped after booking */}
          {!profile.preferencesFilled ? (
            <PressableScale onPress={() => router.push('/roommate-preferences')} scaleTo={0.99} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.base }}>
              <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: palette.navyTint, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="people-circle-outline" size={22} color={palette.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMd" weight="700">Complete your roommate preferences</Text>
                <Text variant="caption" color={palette.inkTertiary}>Help us match you with compatible roommates</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={palette.inkTertiary} />
            </PressableScale>
          ) : null}

          {/* QR pass — pre-arrival check-in pass, or the ongoing PG pass once checked in */}
          <PressableScale onPress={() => router.push({ pathname: '/pass', params: { id: String(b.id) } })} scaleTo={0.99} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.navy, borderRadius: radius.lg, padding: spacing.base }}>
            <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="qr-code" size={24} color={palette.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMd" weight="700" color={palette.white}>{checkedIn ? 'Your PG pass' : 'Your check-in pass'}</Text>
              <Text variant="caption" color="rgba(255,255,255,0.8)">{checkedIn ? 'Tap to show your pass' : 'Tap to show your QR to check in'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.white} />
          </PressableScale>

          {/* Quick actions grid — space-between guarantees even 3-col alignment */}
          <View>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>Quick actions</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md }}>
              {QUICK.map((q) => (
                <PressableScale
                  key={q.label}
                  onPress={() => {
                    if (q.route === 'food-menu') {
                      setFoodMenuOpen(true);
                      return;
                    }
                    if (q.route === 'property-support') {
                      router.push({ pathname: '/support', params: { kind: 'property' } });
                      return;
                    }
                    router.push(q.route as any);
                  }}
                  scaleTo={0.95}
                  style={{ width: tileW, height: tileW, backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: q.tint + '1A', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={q.icon as any} size={22} color={q.tint} />
                  </View>
                  <Text variant="caption" weight="600" align="center">{q.label}</Text>
                </PressableScale>
              ))}
            </View>
          </View>

          {/* Write review */}
          <Card style={{ marginBottom: spacing.md }}>
            <View style={{ alignItems: 'center', gap: spacing.sm }}>
              <Text variant="bodyMd" weight="600">Stayed here? Rate this property</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <PressableScale
                    key={n}
                    haptics
                    onPress={() => router.push({ pathname: `/listing/api-${b.property.id}`, params: { openReview: '1' } })}
                    scaleTo={0.85}
                    style={{ padding: 2 }}
                  >
                    <Ionicons name="star-outline" size={32} color={palette.borderStrong} />
                  </PressableScale>
                ))}
              </View>
              <Text variant="caption" color={palette.inkTertiary}>Tap a star to share your experience</Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      <WeeklyFoodMenuSheet
        visible={foodMenuOpen}
        onClose={() => setFoodMenuOpen(false)}
        foodMenu={propertyListing?.foodMenu ?? []}
        weeklyMenu={propertyListing?.weeklyFoodMenu}
        foodIncluded={propertyListing?.foodIncluded ?? false}
      />

      <Sheet visible={switcherOpen} onClose={() => setSwitcherOpen(false)} title="Switch stay" scroll>
        <View style={{ gap: spacing.sm }}>
          {bookings.map((stay) => {
            const active = stay.id === selectedId;
            return (
              <PressableScale
                key={stay.id}
                onPress={() => { setSelectedId(stay.id); setSwitcherOpen(false); }}
                scaleTo={0.98}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.sm, borderRadius: radius.lg, borderWidth: 1.5, borderColor: active ? palette.coral : palette.border, backgroundColor: active ? palette.coralTint : palette.surface }}
              >
                <Image source={{ uri: bookingCoverImage(stay.property) }} style={{ width: 56, height: 56, borderRadius: radius.md }} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMd" weight="700" numberOfLines={1}>{stay.property.name}</Text>
                  <Text variant="caption" color={palette.inkSecondary} numberOfLines={1}>
                    {stay.code} · Room {stay.room_number} · Bed {stay.bed_number}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 }}>
                    <Badge label={bookingStatusLabel(stay.status)} tone={bookingStatusTone(stay.status)} small />
                    <Text variant="caption" color={palette.inkTertiary}>{bookingModeLabel(stay.booking_mode)}</Text>
                  </View>
                </View>
                {active
                  ? <Ionicons name="checkmark-circle" size={22} color={palette.coral} />
                  : <Ionicons name="chevron-forward" size={18} color={palette.inkTertiary} />}
              </PressableScale>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}

function DividerVertical() {
  return <View style={{ width: 1, backgroundColor: palette.border, marginHorizontal: spacing.sm }} />;
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text variant="caption" color={palette.inkTertiary}>{label}</Text>
      <Text variant="bodyMd" weight="700" style={{ marginTop: 4 }}>
        {value}
      </Text>
    </View>
  );
}
