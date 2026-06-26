/** Booking-cancelled confirmation — red animated burst + the booking chime, then a
 *  refund breakdown. Reached from the booking detail screen after a tenant cancels. */
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Card, Button, Divider } from '@/components/ui';
import { AnimatedSuccessTick, useBookingSuccessSound } from '@/components/booking';
import { useBookingCancellations } from '@/store/bookingCancellations';
import { getBookingByRef } from '@/data';
import { inr } from '@/lib/format';

export default function BookingCancelled() {
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cancelStore = useBookingCancellations();

  useBookingSuccessSound();

  const c = cancelStore.get(String(ref ?? ''));
  const record = getBookingByRef(String(ref ?? ''));
  const propertyName = record?.booking.propertyName ?? record?.booking.ref;

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
          {propertyName
            ? `Your booking at ${propertyName} has been cancelled.`
            : 'Your booking has been cancelled.'}
        </Text>

        {c ? (
          <Card style={{ alignSelf: 'stretch', marginTop: spacing.xl }}>
            <Row k="Amount paid" v={inr(c.amountPaid)} />
            <Row k="Cancellation charge" v={`− ${inr(c.chargeAmount)}`} />
            <Row k="Refund amount" v={inr(c.refundAmount)} bold last />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, backgroundColor: palette.successTint, borderRadius: radius.md, padding: spacing.md }}>
              <Ionicons name="cash-outline" size={18} color={palette.success} />
              <Text variant="bodySm" color={palette.success} style={{ flex: 1 }}>
                {inr(c.refundAmount)} will be refunded to your original payment method within {c.refundEta}.
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
