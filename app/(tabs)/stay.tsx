/** T-S20 — Tenant dashboard (post-booking home hub). Driven by the tenant's active beds
 *  (`GET /tenant/beds`); the selected bed's full stay detail (`GET /tenant/my-stay`) fills in
 *  billing/owner/pass info, and the property's own details are fetched separately (cached) to
 *  power food menu / directions / share. The last-viewed bed is remembered in `session` across
 *  app restarts (cleared on logout) so re-opening the tab lands back on the same stay. */
import { useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, useWindowDimensions, Linking, Alert, Platform, Share } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, spacing, radius } from '@/theme';
import { Text, Card, Button, IconButton, PressableScale, Sheet, EmptyState, Badge, Skeleton, CardCarousel, Divider } from '@/components/ui';
import type { Tone } from '@/components/ui';
import { WeeklyFoodMenuSheet, PropertyRatingSection } from '@/components/domain';
import { EmptyAuth, EmptyBookings } from '@/components/illustrations';
import { stayApi, propertyApi, errorMessage, type ApiBedStay, type ApiMyStayResponse, type ApiAnnouncement, type ApiMaintenanceTicket, type ApiChangeBedRequest, type MaintenanceStatus } from '@/lib/api';
import { bookingCoverImage, bookingModeLabel, bookingStatusLabel, bookingStatusTone, latestConfirmedExtension, extensionBannerMessage } from '@/lib/bookingDisplay';
import { propertyDetailsToListing, formatLayoutFallback, isUnitPropertyType } from '@/lib/listingAdapter';
import { getCachedPropertyDetails, cachePropertyDetails } from '@/store/propertyDetailsCache';
import { inr, formatDate, titleCaseFromSnake } from '@/lib/format';
import { platformFeeFromMasterConfig, type CheckoutIntent } from '@/lib/billing';
import { useProfile } from '@/store/profile';
import { useAuth } from '@/context/AuthContext';
import { useMasterData } from '@/context/MasterDataContext';
import { LOGIN_ROUTE } from '@/lib/guestGuard';
import { session } from '@/lib/session';
import type { Listing } from '@/data/types';

const QUICK = [
  { icon: 'receipt-outline', label: 'Invoices', route: '/billing', tint: palette.success },
  { icon: 'restaurant-outline', label: 'Food Menu', route: 'food-menu', tint: palette.coral },
  { icon: 'construct-outline', label: 'Support', route: 'property-support', tint: palette.warning },
  { icon: 'people-outline', label: 'Visitors', route: '/visitors', tint: palette.info },
  { icon: 'swap-horizontal-outline', label: 'Room Swap', route: '/room-swap', tint: palette.navy },
  { icon: 'exit-outline', label: 'Move Out', route: '/move-out', tint: palette.danger },
];

const EXTEND_ACTION = { icon: 'time-outline', label: 'Extend Booking', route: 'extend-stay', tint: palette.coral };

export default function Stay() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isGuest } = useAuth();

  const [beds, setBeds] = useState<ApiBedStay[] | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<number | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [stayDetail, setStayDetail] = useState<ApiMyStayResponse | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [foodMenuOpen, setFoodMenuOpen] = useState(false);
  const [propertyListing, setPropertyListing] = useState<Listing | null>(null);
  const profile = useProfile();
  const { config: masterConfig } = useMasterData();
  const { width } = useWindowDimensions();
  // Floor the tile width so 3 columns + 2 gaps never overflow & wrap unevenly.
  const tileW = Math.floor((width - spacing.base * 2 - spacing.md * 2) / 3);

  const loadBeds = (isRefresh = false) => {
    (isRefresh ? setRefreshing : setListLoading)(true);
    setListError(null);
    stayApi.listBeds()
      .then(async (list) => {
        setBeds(list);
        const preferred = await session.getSelectedBed();
        const match = preferred != null && list.some((s) => s.bed.id === preferred)
          ? preferred
          : list[0]?.bed.id ?? null;
        setSelectedBedId(match);
        // The bed-selection effect below only re-fetches stay detail when the id itself
        // changes — on a pull-to-refresh it usually doesn't, so refetch it here too.
        if (match != null) {
          stayApi.getMyStay(match).then(setStayDetail).catch(() => {});
        }
      })
      .catch((e) => setListError(errorMessage(e)))
      .finally(() => (isRefresh ? setRefreshing : setListLoading)(false));
  };

  useEffect(() => {
    if (!isGuest) loadBeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest]);

  const selectBed = (bedId: number) => {
    setSelectedBedId(bedId);
    session.saveSelectedBed(bedId);
    setSwitcherOpen(false);
  };

  const selectedBed = beds?.find((s) => s.bed.id === selectedBedId) ?? null;

  // Stay detail (owner contact, billing due, check-in pass) for the selected bed — kept in
  // full so the pass screen can reuse it instead of re-fetching `getMyStay` on its own.
  useEffect(() => {
    if (selectedBedId == null) { setStayDetail(null); return; }
    let active = true;
    stayApi.getMyStay(selectedBedId)
      .then((data) => { if (active) setStayDetail(data); })
      .catch(() => { if (active) setStayDetail(null); });
    return () => { active = false; };
  }, [selectedBedId]);

  // Full property details (food menu, coordinates, amenities) for the selected stay —
  // reuses the listing-detail cache so re-visiting a property doesn't re-fetch it.
  useEffect(() => {
    if (!selectedBed) { setPropertyListing(null); return; }
    const propertyId = selectedBed.property.id;
    const cached = getCachedPropertyDetails(propertyId);
    if (cached) { setPropertyListing(cached); return; }
    let active = true;
    propertyApi.getPropertyDetails(propertyId).then((data) => {
      if (!active) return;
      const mapped = propertyDetailsToListing(data);
      setPropertyListing(mapped);
      cachePropertyDetails(propertyId, mapped);
    }).catch(() => {});
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBed?.property.id]);

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

  if (listLoading && !beds) {
    return <StaySkeleton insetTop={insets.top} />;
  }

  if (listError && !beds) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', paddingTop: insets.top, paddingHorizontal: spacing.base }}>
        <EmptyState
          illustration={<EmptyBookings />}
          title="Couldn't load your stay"
          message={listError}
          actionLabel="Retry"
          onAction={loadBeds}
        />
      </View>
    );
  }

  if (!selectedBed) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', paddingTop: insets.top, paddingHorizontal: spacing.base }}>
        <EmptyState
          illustration={<EmptyBookings />}
          title="No active stay yet"
          message="Once a booking is confirmed, it shows up here."
          actionLabel="Browse properties"
          onAction={() => router.push('/(tabs)')}
        />
      </View>
    );
  }

  const b = selectedBed;
  const checkedIn = b.booking.status === 'CHECKED_IN';
  const rateSuffix = b.booking.booking_mode === 'HOURLY' ? '/hr' : b.booking.booking_mode === 'DAILY' ? '/day' : '/mo';
  // Only trust `stayDetail` once it actually matches the selected bed — it lags one
  // fetch behind while switching stays.
  const detailForSelected = stayDetail?.booking.bed.id === b.bed.id ? stayDetail : null;
  const dueDate = detailForSelected?.billing.next_due_date ?? b.billing.next_rent_due;
  // A due invoice only exists once the detail fetch (not the lighter beds list) resolves —
  // `due_invoice_id` gates the "Pay now" button, and the matching row in `invoices` carries
  // the real amount/paid split the checkout intent below is priced from.
  const dueInvoiceId = detailForSelected?.billing.due_invoice_id ?? null;
  const dueInvoice = dueInvoiceId != null
    ? detailForSelected?.billing.invoices.find((inv) => inv.id === dueInvoiceId) ?? null
    : null;
  // Urgency color for the due date — red inside 3 days, orange inside 5, default otherwise.
  const dueDateColor = (() => {
    if (!dueDate) return palette.inkSecondary;
    const daysLeft = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000);
    if (daysLeft <= 3) return palette.danger;
    if (daysLeft <= 5) return palette.warning;
    return palette.inkSecondary;
  })();
  // Move-out approved — the backend starts returning a check-out OTP/QR alongside the
  // check-in ones once the tenant is cleared to check out.
  const readyForCheckout = !!(detailForSelected?.booking.check_out_otp || detailForSelected?.booking.check_out_qr);
  const extension = latestConfirmedExtension(detailForSelected?.booking.extensions);
  const announcements = detailForSelected?.announcements ?? [];
  const maintenanceTickets = detailForSelected?.maintenance ?? [];
  // A SCHEDULED bed change is an owner-approved upcoming move the tenant hasn't been
  // switched into yet — surfaced as "Your next bed" below Quick actions.
  const scheduledBedChange = detailForSelected?.bed_changes?.find((c) => c.status === 'SCHEDULED') ?? null;
  const isMonthly = b.booking.booking_mode === 'MONTHLY';
  // Bed change only applies to Monthly Hostel stays — Flat/Homestay books the whole unit, so
  // there's no other room/bed within the same property to swap into. Daily/Hourly stays
  // extend instead of changing beds or moving out — one Extend Booking tile replaces both.
  const isHostel = !isUnitPropertyType(b.property);
  const quickActions = isMonthly
    ? (isHostel ? QUICK : QUICK.filter((q) => q.route !== '/room-swap'))
    : QUICK.filter((q) => q.route !== '/room-swap').map((q) => (q.route === '/move-out' ? EXTEND_ACTION : q));
  // When the last row isn't a full 3, stretch its tiles to fill the row instead of leaving
  // empty space (e.g. Room Swap hidden leaves Visitors + Extend Booking as a 2-tile row).
  const lastRowCount = quickActions.length % 3;
  const contentWidth = width - spacing.base * 2;
  const lastRowTileW = lastRowCount === 2
    ? Math.floor((contentWidth - spacing.md) / 2)
    : lastRowCount === 1
      ? contentWidth
      : tileW;

  const shareProperty = async () => {
    const link = `https://share.pgfy.in/property/${b.property.id}`;
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

  // Routes the due invoice into the unified checkout, which calls `POST /tenant/pay-rent`
  // for real (billing_api.md). Unlike the regular Billing screen's invoice-pay flow, this one
  // is priced with the platform fee shown — matches what was asked for this entry point.
  const payDueInvoice = () => {
    if (!dueInvoice) return;
    const outstanding = Math.max(0, dueInvoice.amount - dueInvoice.paid);
    const title = dueInvoice.billing_month ? `Rent · ${dueInvoice.billing_month}` : titleCaseFromSnake(dueInvoice.type);
    const intent: CheckoutIntent = {
      kind: 'invoice',
      title,
      subtitle: `${b.property.name} · ${dueInvoice.invoice_number}`,
      billingMode: 'monthly',
      baseAmount: outstanding,
      unitRate: outstanding,
      allowAutopay: true,
      applyPlatformFee: true,
      platformFeeOverride: platformFeeFromMasterConfig(outstanding, masterConfig),
      invoicePayment: { invoiceId: dueInvoice.id },
    };
    router.push({ pathname: '/checkout', params: { intent: JSON.stringify(intent) } });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing['3xl'] }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBeds(true)} tintColor={palette.coral} colors={[palette.coral]} />}
      >
        {/* Hero */}
        <View>
          <Image source={{ uri: bookingCoverImage(b.property) }} style={{ width: '100%', height: 200 + insets.top }} contentFit="cover" />
          <LinearGradient colors={['rgba(1,38,78,0.5)', 'rgba(1,38,78,0.2)', 'rgba(1,38,78,0.85)']} style={{ position: 'absolute', inset: 0 }} />
          <View style={{ position: 'absolute', top: insets.top + spacing.xs, left: spacing.base, right: spacing.base, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <PressableScale onPress={() => setSwitcherOpen(true)} disabled={(beds?.length ?? 0) <= 1}>
              <Text variant="bodySm" weight="700" color="rgba(255,255,255,0.92)">YOUR STAY</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Text variant="bodyMd" weight="700" color={palette.white}>{b.booking.code}</Text>
                {(beds?.length ?? 0) > 1 ? (
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
              <Badge label={bookingStatusLabel(b.booking.status)} tone={bookingStatusTone(b.booking.status)} small />
            </View>
            <Text variant="bodySm" color="rgba(255,255,255,0.85)" style={{ marginTop: 2 }}>
              {propertyListing?.addressLine ? `${propertyListing.addressLine}, ` : ''}{b.property.locality} · Since {formatDate(b.booking.check_in_date)}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.base, gap: spacing.base }}>
          {/* Extension confirmation — info banner once a paid stay-extension is confirmed */}
          {extension ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.infoTint, borderRadius: radius.lg, padding: spacing.base }}>
              <Ionicons name="information-circle" size={20} color={palette.info} />
              <Text variant="bodySm" weight="600" color={palette.info} style={{ flex: 1 }}>
                {extensionBannerMessage(extension)}
              </Text>
            </View>
          ) : null}

          {/* Rent card — Daily/Hourly stays don't show their per-unit rate here */}
          {b.booking.booking_mode === 'MONTHLY' ? (
            <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text variant="caption" color={palette.inkTertiary}>MONTHLY RENT</Text>
                <Text variant="numLg" mono color={palette.ink} style={{ marginTop: 2 }}>{inr(b.billing.base_rent)}{rateSuffix}</Text>
                <Text variant="caption" color={dueDate ? dueDateColor : palette.inkSecondary} weight={dueDate && dueDateColor !== palette.inkSecondary ? '700' : '400'}>
                  {dueDate ? `Next due ${formatDate(dueDate)}` : 'Active stay'}
                </Text>
              </View>
              {dueInvoiceId != null ? (
                <Button label="Pay now" icon="flash" onPress={payDueInvoice} disabled={!dueInvoice} />
              ) : null}
            </Card>
          ) : null}

          {/* Room/bed allocation — Flat/Homestay bookings have no room/bed/floor tier, just
              the whole unit, so this card doesn't apply to them. */}
          {!isUnitPropertyType(b.property) ? (
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
                <InfoTile label="Room" value={b.room.room_number} />
                <DividerVertical />
                <InfoTile label="Bed" value={b.bed.bed_number} />
                <DividerVertical />
                <InfoTile label="Layout" value={formatLayoutFallback(b.room.layout)} />
              </View>
            </Card>
          ) : null}

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
          <PressableScale
            onPress={() => router.push({
              pathname: '/pass',
              params: {
                bedId: String(b.bed.id),
                ...(detailForSelected ? { stay: JSON.stringify(detailForSelected) } : {}),
              },
            })}
            scaleTo={0.99}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: readyForCheckout ? palette.warning : palette.navy, borderRadius: radius.lg, padding: spacing.base }}
          >
            <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={readyForCheckout ? 'exit-outline' : 'qr-code'} size={24} color={palette.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMd" weight="700" color={palette.white}>
                {readyForCheckout ? 'Ready to check out' : checkedIn ? 'Your PG pass' : 'Your check-in pass'}
              </Text>
              <Text variant="caption" color="rgba(255,255,255,0.8)">
                {readyForCheckout ? 'Tap to show your check-out QR' : checkedIn ? 'Tap to show your pass' : 'Tap to show your QR to check in'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.white} />
          </PressableScale>

          {/* Announcements — property-wide notices from the owner */}
          {announcements.length > 0 ? (
            <View>
              <Text variant="h3" style={{ marginBottom: spacing.md }}>Announcements</Text>
              <CardCarousel
                data={announcements}
                keyExtractor={(a) => String(a.id)}
                renderItem={(a) => <AnnouncementCard announcement={a} />}
              />
            </View>
          ) : null}

          {/* Maintenance — this tenant's own open/recent tickets */}
          {maintenanceTickets.length > 0 ? (
            <View>
              <Text variant="h3" style={{ marginBottom: spacing.md }}>Maintenance</Text>
              <CardCarousel
                data={maintenanceTickets}
                keyExtractor={(t) => String(t.id)}
                renderItem={(t) => <MaintenanceCard ticket={t} onPress={() => router.push({ pathname: '/support', params: { kind: 'property' } })} />}
              />
            </View>
          ) : null}

          {/* Quick actions grid — space-between guarantees even 3-col alignment */}
          <View>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>Quick actions</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', columnGap: spacing.md, rowGap: spacing.md }}>
              {quickActions.map((q, i) => {
                const inLastRow = lastRowCount !== 0 && i >= quickActions.length - lastRowCount;
                return (
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
                      if (q.route === 'extend-stay') {
                        router.push({ pathname: '/booking/extend', params: { bookingId: String(b.booking.id) } });
                        return;
                      }
                      if (q.route === '/room-swap') {
                        router.push({
                          pathname: '/room-swap',
                          params: {
                            bookingId: String(b.booking.id),
                            roomNumber: b.room.room_number,
                            bedNumber: b.bed.bed_number,
                            currentRent: String(b.billing.base_rent),
                          },
                        });
                        return;
                      }
                      router.push(q.route as any);
                    }}
                    scaleTo={0.95}
                    style={{ width: inLastRow ? lastRowTileW : tileW, height: tileW, backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: q.tint + '1A', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={q.icon as any} size={22} color={q.tint} />
                    </View>
                    <Text variant="caption" weight="600" align="center">{q.label}</Text>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          {/* Your next bed — a SCHEDULED bed-change request awaiting the effective date */}
          {scheduledBedChange ? <NextBedCard change={scheduledBedChange} /> : null}

          {/* Rate this property — real `/tenant/ratings`, shared with the property details page.
              Deliberately no `initialMyRating`/`canRate` here: `propertyListing` is a separate,
              async-fetched state that lags behind switching stays, so trusting it caused the
              rating shown to stay stuck on the previously selected property. Always self-fetch,
              scoped by the `key` remount below, so it's authoritative for whichever property is
              actually selected. */}
          <View style={{ marginBottom: spacing.md }}>
            <PropertyRatingSection
              key={b.property.id}
              propertyId={b.property.id}
              propertyName={b.property.name}
            />
          </View>
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
          {(beds ?? []).map((stay) => {
            const active = stay.bed.id === selectedBedId;
            return (
              <PressableScale
                key={stay.bed.id}
                onPress={() => selectBed(stay.bed.id)}
                scaleTo={0.98}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.sm, borderRadius: radius.lg, borderWidth: 1.5, borderColor: active ? palette.coral : palette.border, backgroundColor: active ? palette.coralTint : palette.surface }}
              >
                <Image source={{ uri: bookingCoverImage(stay.property) }} style={{ width: 56, height: 56, borderRadius: radius.md }} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMd" weight="700" numberOfLines={1}>{stay.property.name}</Text>
                  <Text variant="caption" color={palette.inkSecondary} numberOfLines={1}>
                    {isUnitPropertyType(stay.property)
                      ? stay.booking.code
                      : `${stay.booking.code} · Room ${stay.room.room_number} · Bed ${stay.bed.bed_number}`}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 }}>
                    <Badge label={bookingStatusLabel(stay.booking.status)} tone={bookingStatusTone(stay.booking.status)} small />
                    <Text variant="caption" color={palette.inkTertiary}>{bookingModeLabel(stay.booking.booking_mode)}</Text>
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

function AnnouncementCard({ announcement: a }: { announcement: ApiAnnouncement }) {
  return (
    <Card style={{ gap: spacing.sm, marginRight: spacing.base }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.infoTint, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="megaphone-outline" size={18} color={palette.info} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyMd" weight="700" numberOfLines={2}>{a.title}</Text>
          <Text variant="caption" color={palette.inkTertiary}>{formatDate(a.created_at)} · {a.created_by_name}</Text>
        </View>
      </View>
      <Text variant="bodySm" color={palette.inkSecondary} numberOfLines={4} style={{ lineHeight: 20 }}>{a.description}</Text>
    </Card>
  );
}

const MAINTENANCE_STATUS_TONE: Record<string, Tone> = {
  NEW: 'warning',
  ASSIGNED: 'info',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  DISMISSED: 'neutral',
  CANCELLED: 'danger',
};

function maintenanceStatusTone(status: MaintenanceStatus): Tone {
  return MAINTENANCE_STATUS_TONE[status] ?? 'neutral';
}

function MaintenanceCard({ ticket: t, onPress }: { ticket: ApiMaintenanceTicket; onPress?: () => void }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.99} style={{ marginRight: spacing.base }}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <Badge label={titleCaseFromSnake(t.status)} tone={maintenanceStatusTone(t.status)} small />
          <Text variant="caption" color={palette.inkTertiary}>{formatDate(t.created_at)}</Text>
        </View>
        <Text variant="bodyMd" weight="700" numberOfLines={1}>{t.category_name}</Text>
        <Text variant="bodySm" color={palette.inkSecondary} numberOfLines={2} style={{ marginTop: 4 }}>{t.description}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }}>
          <Text variant="caption" color={palette.inkTertiary}>{t.code ?? `#${t.id}`}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="bodySm" color={palette.info} weight="600">View details</Text>
            <Ionicons name="chevron-forward" size={16} color={palette.info} />
          </View>
        </View>
      </Card>
    </PressableScale>
  );
}

function NextBedCard({ change }: { change: ApiChangeBedRequest }) {
  const netChange = change.rent.net_change;
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: palette.navyTint, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="swap-horizontal" size={20} color={palette.navy} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="h3">Your next bed</Text>
          <Text variant="caption" color={palette.inkTertiary}>Effective {formatDate(change.effective_on)}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
        <View style={{ alignItems: 'center' }}>
          <Text variant="caption" color={palette.inkTertiary}>From</Text>
          <Text variant="bodyMd" weight="700" color={palette.navy} style={{ marginTop: 2 }}>
            {change.from.room?.room_number ?? '—'} · {change.from.bed?.bed_number ?? '—'}
          </Text>
        </View>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: palette.coralTint, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-forward" size={16} color={palette.coralDark} />
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text variant="caption" color={palette.inkTertiary}>To</Text>
          <Text variant="bodyMd" weight="700" color={palette.coralDark} style={{ marginTop: 2 }}>
            {change.to.room?.room_number ?? '—'} · {change.to.bed?.bed_number ?? '—'}
          </Text>
        </View>
      </View>

      <Divider />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="bodySm" color={palette.inkSecondary}>Rent impact</Text>
        <Text variant="bodySm" weight="700" color={netChange > 0 ? palette.danger : palette.success} mono>
          {inr(change.rent.old_rent)} → {inr(change.rent.new_rent)} ({netChange > 0 ? '+' : ''}{inr(netChange)})
        </Text>
      </View>

      {change.reason ? (
        <Text variant="caption" color={palette.inkTertiary} style={{ fontStyle: 'italic' }}>"{change.reason}"</Text>
      ) : null}
    </Card>
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

function StaySkeleton({ insetTop }: { insetTop: number }) {
  return (
    <View style={{ flex: 1 }}>
      <Skeleton width="100%" height={200 + insetTop} rounded={0} />
      <View style={{ padding: spacing.base, gap: spacing.base }}>
        <Skeleton width="100%" height={84} rounded={radius.lg} />
        <Skeleton width="100%" height={110} rounded={radius.lg} />
        <Skeleton width="100%" height={68} rounded={radius.lg} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} width={100} height={100} rounded={radius.lg} />
          ))}
        </View>
      </View>
    </View>
  );
}
