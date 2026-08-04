/** Booking-cancelled confirmation — red animated burst, then the API's refund breakdown.
 *  Reached from the booking detail screen right after a successful cancel-booking call. */
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Card, Button, Divider } from '@/components/ui';
import { AnimatedSuccessTick, useBookingSuccessSound } from '@/components/booking';
import { inr } from '@/lib/format';

export default function BookingCancelled() {
  const { ref, propertyName, amountPaid, chargeAmount, chargeLabel, refundAmount, message } = useLocalSearchParams<{
    ref: string;
    propertyName?: string;
    amountPaid?: string;
    chargeAmount?: string;
    chargeLabel?: string;
    refundAmount?: string;
    message?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useBookingSuccessSound();

  const hasRefund = amountPaid != null && chargeAmount != null && refundAmount != null;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: insets.top + spacing.xl,
          paddingHorizontal: spacing.base,
          paddingBottom: insets.bottom + spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedSuccessTick size={132} color={palette.danger} icon="close" />

        <Text variant="h1" align="center" style={{ marginTop: spacing.xl }}>
          Booking cancelled
        </Text>
        <Text variant="bodyLg" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.sm, maxWidth: 320 }}>
          {message || (propertyName
            ? `Your booking at ${propertyName} has been cancelled.`
            : 'Your booking has been cancelled.')}
        </Text>

        {hasRefund ? (
          <Card style={{ alignSelf: 'stretch', marginTop: spacing.xl }}>
            <Row k="Amount paid" v={inr(Number(amountPaid))} />
            <Row k={chargeLabel || 'Cancellation charge'} v={`− ${inr(Number(chargeAmount))}`} />
            <Row k="Refund amount" v={inr(Number(refundAmount))} bold last />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, backgroundColor: palette.successTint, borderRadius: radius.md, padding: spacing.md }}>
              <Ionicons name="cash-outline" size={18} color={palette.success} />
              <Text variant="bodySm" color={palette.success} style={{ flex: 1 }}>
                {inr(Number(refundAmount))} will be refunded to your original payment method.
              </Text>
            </View>
          </Card>
        ) : null}

        <View style={{ alignSelf: 'stretch', marginTop: spacing.xl, gap: spacing.sm }}>
          <Button label="View booking" full size="lg" onPress={() => router.replace({ pathname: '/booking/[ref]', params: { ref: String(ref ?? '') } })} />
          <Button label="Back to home" variant="outline" full size="lg" onPress={() => router.replace('/(tabs)')} />
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ k, v, bold, last }: { k: string; v: string; bold?: boolean; last?: boolean }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm }}>
        <Text variant="bodySm" color={palette.inkTertiary}>{k}</Text>
        <Text variant="bodySm" weight={bold ? '700' : '600'} color={bold ? palette.ink : undefined}>{v}</Text>
      </View>
      {!last ? <Divider /> : null}
    </View>
  );
}
