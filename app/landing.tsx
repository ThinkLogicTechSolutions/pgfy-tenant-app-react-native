/** T-S3 — Landing / discovery entry. */
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { palette, spacing } from '@/theme';
import { Text, Button } from '@/components/ui';
import { PgfyMark } from '@/components/illustrations';
import { coverImages } from '@/data';

const VALUE_PROPS = [
  { icon: 'shield-checkmark', label: 'PGfy Verified properties' },
  { icon: 'pricetag', label: 'Zero brokerage, ever' },
  { icon: 'qr-code', label: 'Instant QR check-in' },
];

export default function Landing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: palette.navy }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '62%' }}>
        <Image source={{ uri: coverImages[0] }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        <LinearGradient colors={['rgba(1,38,78,0.35)', 'rgba(1,38,78,0.85)', palette.navy]} style={{ position: 'absolute', inset: 0 }} />
      </View>

      <View style={{ flex: 1, paddingHorizontal: spacing.xl, paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl, justifyContent: 'space-between' }}>
        <Animated.View entering={FadeInDown.duration(600)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <PgfyMark size={40} variant="white" />
          <Text variant="h2" color={palette.white}>PGfy</Text>
        </Animated.View>

        <View>
          <Animated.View entering={FadeInDown.delay(150).duration(600)}>
            <Text variant="display" color={palette.white} style={{ fontSize: 34, lineHeight: 40 }}>
              Find your next{'\n'}home, the smart way
            </Text>
            <Text variant="bodyLg" color="rgba(255,255,255,0.82)" style={{ marginTop: spacing.md }}>
              Verified PGs, hostels & co-livings across the city — with real photos, honest prices and no brokerage.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={{ marginTop: spacing.xl, gap: spacing.md }}>
            {VALUE_PROPS.map((v) => (
              <View key={v.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={v.icon as any} size={17} color={palette.white} />
                </View>
                <Text variant="bodyMd" color={palette.white}>{v.label}</Text>
              </View>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(450).duration(600)} style={{ marginTop: spacing['2xl'] }}>
            <Button label="Explore PGs near you" icon="search" onPress={() => router.push('/(auth)/login')} full size="lg" />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
