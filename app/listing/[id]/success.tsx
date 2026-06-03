/** T-S17 — Payment success / digital receipt & booking pass. */
import { useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { palette, spacing, radius } from '@/theme';
import { Text, Card, Button, Divider } from '@/components/ui';
import { SuccessBurst } from '@/components/illustrations';
import { getListing, ACTIVE_BOOKING } from '@/data';
import { inr } from '@/lib/format';
import { releaseHold } from '@/store/hold';

export default function Success() {
  const { id, amount } = useLocalSearchParams<{ id: string; amount: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listing = getListing(String(id));

  // Booking completed — release the held bed.
  useEffect(() => { releaseHold(); }, []);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.xl, paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing.xl }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={ZoomIn.duration(500)} style={{ alignItems: 'center' }}>
          <SuccessBurst size={150} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ alignItems: 'center', marginTop: spacing.md }}>
          <Text variant="h1" align="center">Booking Confirmed!</Text>
          <Text variant="bodyMd" color={palette.inkSecondary} align="center" style={{ marginTop: 6, maxWidth: 300 }}>
            You're all set to move in to {listing?.name}. Your bed is reserved.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).duration(500)}>
          <Card style={{ marginTop: spacing.xl }}>
            <Row k="Transaction ID" v="TXN-PGFY-558210" copy />
            <Row k="Amount paid" v={inr(Number(amount ?? 39500))} />
            <Row k="Property" v={listing?.name ?? '—'} />
            <Row k="Room / Bed" v={`${ACTIVE_BOOKING.roomNumber} · Bed ${ACTIVE_BOOKING.bedLabel}`} />
            <Row k="Check-in" v="5 June 2026" last />
          </Card>
        </Animated.View>

        {/* QR pass preview */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <Card style={{ marginTop: spacing.base, alignItems: 'center', paddingVertical: spacing.lg }}>
            <Text variant="overline" color={palette.inkTertiary}>BOOKING PASS</Text>
            <View style={{ width: 150, height: 150, borderRadius: radius.lg, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md }}>
              <Ionicons name="qr-code" size={108} color={palette.white} />
            </View>
            <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: spacing.md }}>Show this at check-in · Ref {ACTIVE_BOOKING.ref}</Text>
          </Card>
        </Animated.View>

        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          <Button
            label="View booking"
            icon="receipt-outline"
            onPress={() => router.replace({
              pathname: `/booking/${ACTIVE_BOOKING.ref}`,
              params: { amount: amount ?? '' },
            })}
            full
            size="lg"
          />
          <Button label="Go to dashboard" variant="outline" onPress={() => router.replace('/(tabs)/stay')} full />
          <Button label="Download receipt" variant="ghost" icon="download-outline" full />
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ k, v, last, copy }: { k: string; v: string; last?: boolean; copy?: boolean }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm }}>
        <Text variant="bodySm" color={palette.inkTertiary}>{k}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text variant="bodySm" weight="600">{v}</Text>
          {copy ? <Ionicons name="copy-outline" size={14} color={palette.coralDark} /> : null}
        </View>
      </View>
      {!last ? <Divider /> : null}
    </View>
  );
}
