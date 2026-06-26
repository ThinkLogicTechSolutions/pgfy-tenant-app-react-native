/** Generic post-payment success screen for the unified checkout (T-S16).
 *  Plays the booking-success chime + an animated tick burst with confetti. */
import { View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { palette, spacing } from '@/theme';
import { Text, Button, Confetti } from '@/components/ui';
import { AnimatedSuccessTick, useBookingSuccessSound } from '@/components/booking';
import { inr } from '@/lib/format';

export default function PaymentSuccess() {
  const { amount, method, title, autopay } = useLocalSearchParams<{ amount?: string; method?: string; title?: string; autopay?: string }>();
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  const isAutopay = autopay === '1';
  const total = Number(amount ?? 0);

  useBookingSuccessSound();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Confetti originTop={screenHeight * 0.3} count={32} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <AnimatedSuccessTick size={132} />
        <Text variant="h1" align="center" style={{ marginTop: spacing.xl }}>
          {isAutopay ? 'Autopay set up!' : 'Payment successful'}
        </Text>
        <Text variant="bodyLg" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.sm, maxWidth: 320 }}>
          {isAutopay
            ? `${inr(total)} was debited and UPI Autopay is now active for ${title ?? 'your stay'}. Future dues will auto-debit.`
            : `${inr(total)} paid via ${method ?? 'Razorpay'}${title ? ` for ${title}` : ''}. A receipt has been sent to you.`}
        </Text>
        <View style={{ alignSelf: 'stretch', marginTop: spacing.xl, gap: spacing.sm }}>
          <Button label="View my stay" full size="lg" onPress={() => router.replace('/(tabs)/stay')} />
          <Button label="Done" variant="outline" full size="lg" onPress={() => router.replace('/(tabs)')} />
        </View>
      </View>
    </View>
  );
}
