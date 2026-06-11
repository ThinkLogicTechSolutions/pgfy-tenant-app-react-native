/** T-S17 — Payment success / digital receipt & booking pass. */
import { useEffect } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { palette, spacing, radius } from '@/theme';
import { Text, Card, Button, Divider } from '@/components/ui';
import {
  AnimatedSuccessTick,
  useBookingSuccessSound,
  BOOKING_TICK_INTRO_MS,
} from '@/components/booking';
import { getListing, ACTIVE_BOOKING } from '@/data';
import { inr } from '@/lib/format';
import { releaseHold } from '@/store/hold';
import { grantScratchCard } from '@/store/rewards';

const HERO_BLOCK_HEIGHT = 248;
const TICK_SIZE = 112;

export default function Success() {
  const { id, amount } = useLocalSearchParams<{ id: string; amount: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const listing = getListing(String(id));

  useBookingSuccessSound();

  const heroMarginTop = useSharedValue(
    Math.max(spacing.xl, (screenHeight - HERO_BLOCK_HEIGHT - insets.top - insets.bottom) / 2),
  );
  const tickScale = useSharedValue(1);
  const messageOpacity = useSharedValue(0);
  const detailsOpacity = useSharedValue(0);
  const detailsTranslateY = useSharedValue(36);

  useEffect(() => {
    releaseHold();
    grantScratchCard(ACTIVE_BOOKING.ref, listing?.name ?? 'Your property');
  }, [listing?.name]);

  useEffect(() => {
    messageOpacity.value = withDelay(520, withTiming(1, { duration: 420 }));

    const timer = setTimeout(() => {
      heroMarginTop.value = withTiming(spacing.md, {
        duration: 560,
        easing: Easing.out(Easing.cubic),
      });
      tickScale.value = withTiming(0.58, {
        duration: 560,
        easing: Easing.out(Easing.cubic),
      });
      detailsOpacity.value = withDelay(300, withTiming(1, { duration: 480 }));
      detailsTranslateY.value = withDelay(300, withTiming(0, {
        duration: 520,
        easing: Easing.out(Easing.cubic),
      }));
    }, BOOKING_TICK_INTRO_MS);

    return () => clearTimeout(timer);
  }, [detailsOpacity, detailsTranslateY, heroMarginTop, messageOpacity, tickScale]);

  const heroStyle = useAnimatedStyle(() => ({
    marginTop: heroMarginTop.value,
    alignItems: 'center',
    opacity: messageOpacity.value,
  }));

  const tickWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tickScale.value }],
  }));

  const detailsStyle = useAnimatedStyle(() => ({
    opacity: detailsOpacity.value,
    transform: [{ translateY: detailsTranslateY.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingHorizontal: spacing.base,
          paddingBottom: insets.bottom + spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={heroStyle}>
          <Animated.View style={tickWrapStyle}>
            <AnimatedSuccessTick size={TICK_SIZE} />
          </Animated.View>
          <Text variant="h1" align="center" style={{ marginTop: spacing.lg }}>
            Booking Confirmed!
          </Text>
          <Text
            variant="bodyMd"
            color={palette.inkSecondary}
            align="center"
            style={{ marginTop: spacing.sm, maxWidth: 300 }}
          >
            {listing?.name
              ? `You're all set to move in to ${listing.name}. Your bed is reserved.`
              : 'Your room is reserved.'}
          </Text>
        </Animated.View>

        <Animated.View style={[{ marginTop: spacing.lg, gap: spacing.base }, detailsStyle]}>
          <Card>
            <Row k="Transaction ID" v="TXN-PGFY-558210" copy />
            <Row k="Amount paid" v={inr(Number(amount ?? 39500))} />
            <Row k="Property" v={listing?.name ?? '—'} />
            <Row k="Room / Bed" v={`${ACTIVE_BOOKING.roomNumber} · Bed ${ACTIVE_BOOKING.bedLabel}`} />
            <Row k="Check-in" v="5 June 2026" last />
          </Card>

          <Card
            onPress={() => router.push('/rewards')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.navyTint }}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: palette.coral, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="gift" size={24} color={palette.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMd" weight="700" color={palette.navy}>You won a scratch card!</Text>
              <Text variant="caption" color={palette.inkSecondary}>Scratch to unlock partner brand coupons</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.navy} />
          </Card>

          <Card style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
            <Text variant="overline" color={palette.inkTertiary}>BOOKING PASS</Text>
            <View
              style={{
                width: 150,
                height: 150,
                borderRadius: radius.lg,
                backgroundColor: palette.navy,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: spacing.md,
              }}
            >
              <Ionicons name="qr-code" size={108} color={palette.white} />
            </View>
            <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: spacing.md }}>
              Show this at check-in · Ref {ACTIVE_BOOKING.ref}
            </Text>
          </Card>

          <View style={{ gap: spacing.sm }}>
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
        </Animated.View>
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
