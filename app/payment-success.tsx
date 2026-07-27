/** Generic post-payment success screen for the unified checkout (T-S16).
 *  Plays the booking-success chime + an animated tick burst with confetti. */
import { View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { palette, spacing } from '@/theme';
import { Text, Button, Confetti } from '@/components/ui';
import { AnimatedSuccessTick, useBookingSuccessSound } from '@/components/booking';
import { inr } from '@/lib/format';

export default function PaymentSuccess() {
  const { amount, method, title, autopay, bookingId, bookingCode, note } = useLocalSearchParams<{
    amount?: string;
    method?: string;
    title?: string;
    autopay?: string;
    bookingId?: string;
    bookingCode?: string;
    /** Backend `payment_hint.note` — e.g. explains the CASH offline-verification flow. */
    note?: string;
  }>();
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  const isAutopay = autopay === '1';
  const isCash = method === 'CASH';
  const total = Number(amount ?? 0);

  useBookingSuccessSound();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Confetti originTop={screenHeight * 0.3} count={32} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <AnimatedSuccessTick size={132} />
        <Text variant="h1" align="center" style={{ marginTop: spacing.xl }}>
          {isAutopay ? 'Autopay set up!' : isCash ? 'Payment requested' : 'Payment successful'}
        </Text>
        <Text variant="bodyLg" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.sm, maxWidth: 320 }}>
          {isAutopay
            ? `${inr(total)} was debited and UPI Autopay is now active for ${title ?? 'your stay'}. Future dues will auto-debit.`
            : isCash
              ? `Your ${inr(total)} cash payment${title ? ` for ${title}` : ''} is pending verification at the property.`
              : `${inr(total)} paid via ${method ?? 'Razorpay'}${title ? ` for ${title}` : ''}. A receipt has been sent to you.`}
        </Text>
        {note ? (
          <Text variant="bodySm" color={palette.inkTertiary} align="center" style={{ marginTop: spacing.sm, maxWidth: 300 }}>{note}</Text>
        ) : null}
        {bookingCode ? (
          <Text variant="bodySm" color={palette.inkTertiary} style={{ marginTop: spacing.xs }}>Booking {bookingCode}</Text>
        ) : null}
        <View style={{ alignSelf: 'stretch', marginTop: spacing.xl, gap: spacing.sm }}>
          {bookingId ? (
            <Button label="View booking" full size="lg" onPress={() => router.replace({ pathname: '/booking/[ref]', params: { ref: bookingId } })} />
          ) : (
            <Button label="View my stay" full size="lg" onPress={() => router.replace('/(tabs)/stay')} />
          )}
          <Button label="Done" variant="outline" full size="lg" onPress={() => router.replace('/(tabs)')} />
        </View>
      </View>
    </View>
  );
}
