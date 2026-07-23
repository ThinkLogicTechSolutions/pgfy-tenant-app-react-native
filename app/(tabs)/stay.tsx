/** T-S20 — Tenant dashboard (post-booking home hub). */
import { useState } from 'react';
import { View, ScrollView, useWindowDimensions, Linking, Alert, Platform, Share } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, spacing, radius } from '@/theme';
import { Text, Card, Button, IconButton, PressableScale, Sheet, EmptyState } from '@/components/ui';
import { StatusPill, WeeklyFoodMenuSheet, TicketRow } from '@/components/domain';
import { EmptyAuth } from '@/components/illustrations';
import { ACTIVE_BOOKINGS, LEASE, TICKETS, getListing } from '@/data';
import type { CheckoutIntent } from '@/lib/billing';
import { inr, formatDate, daysFromNow } from '@/lib/format';
import { useProfile } from '@/store/profile';
import { useAuth } from '@/context/AuthContext';
import { LOGIN_ROUTE } from '@/lib/guestGuard';

const QUICK = [
  { icon: 'receipt-outline', label: 'Invoices', route: '/billing', tint: palette.success },
  { icon: 'restaurant-outline', label: 'Food Menu', route: 'food-menu', tint: palette.coral },
  { icon: 'construct-outline', label: 'Support', route: 'property-support', tint: palette.warning },
  { icon: 'people-outline', label: 'Visitors', route: '/visitors', tint: palette.info },
  { icon: 'swap-horizontal-outline', label: 'Room Swap', route: '/room-swap', tint: palette.navy },
  { icon: 'exit-outline', label: 'Move Out', route: '/move-out', tint: palette.danger },
];

export default function Stay() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isGuest } = useAuth();
  const [selectedRef, setSelectedRef] = useState(ACTIVE_BOOKINGS[0].ref);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const b = ACTIVE_BOOKINGS.find((stay) => stay.ref === selectedRef) ?? ACTIVE_BOOKINGS[0];
  const listing = getListing(b.listingId);
  const dueDays = daysFromNow(b.nextRentDue);
  const openPropertyTickets = TICKETS.filter((t) => t.supportKind === 'property' && t.status !== 'Resolved');
  const [foodMenuOpen, setFoodMenuOpen] = useState(false);
  const profile = useProfile();
  const { width } = useWindowDimensions();
  // Floor the tile width so 3 columns + 2 gaps never overflow & wrap unevenly.
  const tileW = Math.floor((width - spacing.base * 2 - spacing.md * 2) / 3);

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

  const payPendingInvoice = () => {
    if (!b.pendingInvoice) return;
    const intent: CheckoutIntent = {
      kind: 'invoice',
      title: b.pendingInvoice.label,
      subtitle: `${b.propertyName} · ${b.ref}`,
      billingMode: 'monthly',
      baseAmount: b.pendingInvoice.amount,
      unitRate: b.pendingInvoice.amount,
      allowAutopay: true,
    };
    router.push({ pathname: '/checkout', params: { intent: JSON.stringify(intent) } });
  };

  const shareProperty = async () => {
    const link = `https://pgfy.in/p/${b.listingId}`;
    try {
      await Share.share({
        message: `Check out ${b.propertyName} on PGfy${listing?.locality ? ` in ${listing.locality}` : ''} — find your next stay here: ${link}`,
      });
    } catch {
      // user dismissed the share sheet
    }
  };

  const openDirections = async () => {
    if (!listing) return;
    const label = encodeURIComponent(`${b.propertyName}, ${listing.locality}, ${listing.city}`);
    const appleUrl = `http://maps.apple.com/?ll=${listing.lat},${listing.lng}&q=${label}`;
    const googleUrl = `https://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`;
    const url = Platform.OS === 'ios' ? appleUrl : googleUrl;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open maps', 'Please try again in a moment.');
    }
  };

  const callManager = async () => {
    const phone = listing?.manager.phone;
    if (!phone) return;
    try {
      await Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);
    } catch {
      Alert.alert('Unable to place call', `Please dial ${phone} manually.`);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing['3xl'] }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View>
          <Image source={{ uri: b.propertyImage }} style={{ width: '100%', height: 200 + insets.top }} contentFit="cover" />
          <LinearGradient colors={['rgba(1,38,78,0.5)', 'rgba(1,38,78,0.2)', 'rgba(1,38,78,0.85)']} style={{ position: 'absolute', inset: 0 }} />
          <View style={{ position: 'absolute', top: insets.top + spacing.xs, left: spacing.base, right: spacing.base, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <PressableScale onPress={() => setSwitcherOpen(true)} disabled={ACTIVE_BOOKINGS.length <= 1}>
              <Text variant="bodySm" weight="700" color="rgba(255,255,255,0.92)">YOUR STAY</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Text variant="bodyMd" weight="700" color={palette.white}>{b.ref}</Text>
                {ACTIVE_BOOKINGS.length > 1 ? (
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
              <Text variant="h1" color={palette.white} style={{ flex: 1 }} numberOfLines={1}>{b.propertyName}</Text>
              <StatusPill status={b.stayStatus} small />
            </View>
            <Text variant="bodySm" color="rgba(255,255,255,0.85)" style={{ marginTop: 2 }}>
              {listing?.addressLine ? `${listing.addressLine}, ${listing.locality}` : b.locality} · Since {formatDate(b.checkInDate)}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.base, gap: spacing.base }}>
          {/* Rent / rate card — adapts to the selected stay's billing mode */}
          <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
            {b.bookingMode === 'monthly' ? (
              <>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" color={palette.inkTertiary}>NEXT RENT DUE</Text>
                  <Text variant="numLg" mono color={dueDays <= 3 ? palette.danger : palette.ink} style={{ marginTop: 2 }}>{inr(b.nextRentAmount)}</Text>
                  <Text variant="caption" color={dueDays <= 3 ? palette.danger : palette.inkSecondary}>
                    Due {formatDate(b.nextRentDue)} · in {dueDays} days
                  </Text>
                </View>
                <Button label="Pay now" icon="flash" onPress={() => router.push('/billing')} />
              </>
            ) : (
              <View style={{ flex: 1 }}>
                <Text variant="caption" color={palette.inkTertiary}>{b.bookingMode === 'hourly' ? 'HOURLY RATE' : 'DAILY RATE'}</Text>
                <Text variant="numLg" mono color={palette.ink} style={{ marginTop: 2 }}>
                  {inr(b.bookingMode === 'hourly' ? b.ratePerHour ?? 0 : b.ratePerDay ?? 0)}{b.bookingMode === 'hourly' ? '/hr' : '/day'}
                </Text>
                <Text variant="caption" color={palette.inkSecondary}>
                  {b.bookingMode === 'hourly' && b.startTime && b.endTime
                    ? `Today · ${fmtTime(b.startTime)}–${fmtTime(b.endTime)}`
                    : b.checkOutDate ? `Until ${formatDate(b.checkOutDate)}` : 'Active stay'}
                </Text>
              </View>
            )}
          </Card>

          {/* Pending invoice raised by the owner (offline-onboarded tenants) */}
          {b.pendingInvoice ? (
            <PressableScale onPress={payPendingInvoice} scaleTo={0.99} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.dangerTint, borderRadius: radius.lg, padding: spacing.base }}>
              <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: palette.danger, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="receipt" size={22} color={palette.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMd" weight="700" color={palette.danger}>Pending invoice · {inr(b.pendingInvoice.amount)}</Text>
                <Text variant="caption" color={palette.danger}>{b.pendingInvoice.label} · due {formatDate(b.pendingInvoice.dueDate)} · tap to pay</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={palette.danger} />
            </PressableScale>
          ) : null}

          {/* Announcements */}
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
              <Ionicons name="megaphone-outline" size={18} color={palette.info} />
              <Text variant="h3" style={{ flex: 1 }}>Announcements</Text>
            </View>
            <Text variant="bodySm" color={palette.inkSecondary}>🚰 Water supply maintenance on 1 Jun, 10 AM–12 PM. Please store water in advance.</Text>
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
              <InfoTile label="Room" value={b.roomNumber} />
              <DividerVertical />
              <InfoTile label="Bed" value={b.bedLabel} />
              <DividerVertical />
              <InfoTile label="Sharing" value={b.sharingType} />
            </View>
          </Card>

          {/* Property manager — appointed on-site contact the tenant can call */}
          {listing?.manager ? (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: palette.navyTint, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="person" size={20} color={palette.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" color={palette.inkTertiary}>PROPERTY MANAGER</Text>
                  <Text variant="bodyMd" weight="700" numberOfLines={1}>{listing.manager.name}</Text>
                  <Text variant="caption" color={palette.inkSecondary}>{listing.manager.phone}</Text>
                </View>
                <PressableScale
                  onPress={callManager}
                  scaleTo={0.94}
                  style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: palette.success, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="call" size={20} color={palette.white} />
                </PressableScale>
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

          {/* Extend stay — hourly/daily stays only (monthly cannot extend) */}
          {b.bookingMode !== 'monthly' ? (
            <PressableScale onPress={() => router.push({ pathname: '/booking/extend', params: { ref: b.ref } })} scaleTo={0.99} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.coralTint, borderRadius: radius.lg, padding: spacing.base }}>
              <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: palette.coral, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="time" size={22} color={palette.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMd" weight="700" color={palette.coralDark}>Extend your stay</Text>
                <Text variant="caption" color={palette.coralDark}>Add more {b.bookingMode === 'hourly' ? 'hours' : 'days'} to your booking</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={palette.coralDark} />
            </PressableScale>
          ) : null}

          {/* Lease alert */}
          {LEASE.status !== 'Signed' ? (
            <PressableScale onPress={() => router.push('/lease')} scaleTo={0.99} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.warningTint, borderRadius: radius.lg, padding: spacing.base }}>
              <Ionicons name="document-text" size={22} color={palette.warning} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyMd" weight="600" color="#B26A00">Sign your lease agreement</Text>
                <Text variant="caption" color="#B26A00">Pending your signature</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={palette.warning} />
            </PressableScale>
          ) : null}

          {/* QR pass */}
          <PressableScale onPress={() => router.push('/pass')} scaleTo={0.99} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.navy, borderRadius: radius.lg, padding: spacing.base }}>
            <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="qr-code" size={24} color={palette.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMd" weight="700" color={palette.white}>Your check-in pass</Text>
              <Text variant="caption" color="rgba(255,255,255,0.8)">Tap to show your QR</Text>
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
                    onPress={() => router.push({ pathname: `/listing/${b.listingId}`, params: { openReview: '1' } })}
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

          {openPropertyTickets.length > 0 ? (
            <View>
              <Text variant="h3" style={{ marginBottom: spacing.md }}>
                {openPropertyTickets.length === 1 ? '1 open property support ticket' : `${openPropertyTickets.length} open property support tickets`}
              </Text>
              <View style={{ gap: spacing.md }}>
                {openPropertyTickets.map((ticket) => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    onPress={() => router.push({ pathname: '/support', params: { kind: 'property' } })}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {listing ? (
        <WeeklyFoodMenuSheet
          visible={foodMenuOpen}
          onClose={() => setFoodMenuOpen(false)}
          foodMenu={listing.foodMenu}
          foodIncluded={listing.foodIncluded}
        />
      ) : null}

      <Sheet visible={switcherOpen} onClose={() => setSwitcherOpen(false)} title="Switch stay" scroll>
        <View style={{ gap: spacing.sm }}>
          {ACTIVE_BOOKINGS.map((stay) => {
            const active = stay.ref === selectedRef;
            const modeLabel = stay.bookingMode === 'hourly' ? 'Hourly' : stay.bookingMode === 'daily' ? 'Daily' : 'Monthly';
            return (
              <PressableScale
                key={stay.ref}
                onPress={() => { setSelectedRef(stay.ref); setSwitcherOpen(false); }}
                scaleTo={0.98}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.sm, borderRadius: radius.lg, borderWidth: 1.5, borderColor: active ? palette.coral : palette.border, backgroundColor: active ? palette.coralTint : palette.surface }}
              >
                <Image source={{ uri: stay.propertyImage }} style={{ width: 56, height: 56, borderRadius: radius.md }} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMd" weight="700" numberOfLines={1}>{stay.propertyName}</Text>
                  <Text variant="caption" color={palette.inkSecondary} numberOfLines={1}>
                    {stay.ref} · Room {stay.roomNumber} · Bed {stay.bedLabel}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 }}>
                    <StatusPill status={stay.stayStatus} small />
                    <Text variant="caption" color={palette.inkTertiary}>{modeLabel}</Text>
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

function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${suffix}`;
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
