/** T-S20 — Tenant dashboard (post-booking home hub). */
import { useState } from 'react';
import { View, ScrollView, useWindowDimensions, Linking, Alert, Platform, Share } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, spacing, radius } from '@/theme';
import { Text, Card, Button, IconButton, PressableScale } from '@/components/ui';
import { StatusPill, WeeklyFoodMenuSheet, TicketRow } from '@/components/domain';
import { ACTIVE_BOOKING, LEASE, TICKETS, getListing } from '@/data';
import { inr, formatDate, daysFromNow } from '@/lib/format';

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
  const b = ACTIVE_BOOKING;
  const listing = getListing(b.listingId);
  const dueDays = daysFromNow(b.nextRentDue);
  const openPropertyTickets = TICKETS.filter((t) => t.supportKind === 'property' && t.status !== 'Resolved');
  const [foodMenuOpen, setFoodMenuOpen] = useState(false);
  const { width } = useWindowDimensions();
  // Floor the tile width so 3 columns + 2 gaps never overflow & wrap unevenly.
  const tileW = Math.floor((width - spacing.base * 2 - spacing.md * 2) / 3);

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

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing['3xl'] }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View>
          <Image source={{ uri: b.propertyImage }} style={{ width: '100%', height: 200 + insets.top }} contentFit="cover" />
          <LinearGradient colors={['rgba(1,38,78,0.5)', 'rgba(1,38,78,0.2)', 'rgba(1,38,78,0.85)']} style={{ position: 'absolute', inset: 0 }} />
          <View style={{ position: 'absolute', top: insets.top + spacing.xs, left: spacing.base, right: spacing.base, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text variant="bodySm" weight="700" color="rgba(255,255,255,0.92)">YOUR STAY</Text>
              <Text variant="bodyMd" weight="700" color="rgba(255,255,255,0.92)" style={{ marginTop: 2 }}>{b.ref}</Text>
            </View>
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
          {/* Rent due card */}
          <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color={palette.inkTertiary}>NEXT RENT DUE</Text>
              <Text variant="numLg" mono color={dueDays <= 3 ? palette.danger : palette.ink} style={{ marginTop: 2 }}>{inr(b.nextRentAmount)}</Text>
              <Text variant="caption" color={dueDays <= 3 ? palette.danger : palette.inkSecondary}>
                Due {formatDate(b.nextRentDue)} · in {dueDays} days
              </Text>
            </View>
            <Button label="Pay now" icon="flash" onPress={() => router.push('/billing')} />
          </Card>

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
