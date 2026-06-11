/** Interactive scratch card — swipe to reveal brand reward. */
import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/theme';
import { Text } from '@/components/ui';
import type { BrandOffer, BrandVendor } from '@/data/brandRewards';

type Props = {
  vendor: BrandVendor;
  offer: BrandOffer;
  couponCode?: string;
  locked: boolean;
  onRevealed?: () => void;
};

const CARD_W = 300;
const CARD_H = 188;

export function ScratchCard({ vendor, offer, couponCode, locked, onRevealed }: Props) {
  const scratchProgress = useSharedValue(0);
  const revealed = useSharedValue(locked ? 0 : 1);

  const finishReveal = useCallback(() => {
    onRevealed?.();
  }, [onRevealed]);

  const pan = Gesture.Pan()
    .enabled(locked)
    .onUpdate((e) => {
      const delta = Math.sqrt(e.velocityX ** 2 + e.velocityY ** 2) / 1200;
      scratchProgress.value = Math.min(1, scratchProgress.value + delta);
      if (scratchProgress.value > 0.55 && revealed.value === 0) {
        revealed.value = 1;
        scratchProgress.value = withTiming(1, { duration: 280 });
        runOnJS(finishReveal)();
      }
    });

  const tap = Gesture.Tap()
    .enabled(locked)
    .onEnd(() => {
      if (revealed.value === 0) {
        scratchProgress.value = withTiming(1, { duration: 400 });
        revealed.value = withSpring(1, { damping: 14 }, () => {
          runOnJS(finishReveal)();
        });
      }
    });

  const gesture = Gesture.Simultaneous(pan, tap);

  const foilStyle = useAnimatedStyle(() => ({
    opacity: 1 - revealed.value,
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: revealed.value < 0.5 ? 1 : 0,
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Image source={{ uri: offer.bannerImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={['rgba(1,38,78,0.15)', 'rgba(1,38,78,0.88)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.revealContent}>
          <Image source={{ uri: vendor.logo }} style={styles.vendorLogo} contentFit="cover" />
          <Text variant="bodyMd" weight="700" color={palette.white} align="center" numberOfLines={2}>
            {offer.title}
          </Text>
          {couponCode ? (
            <View style={styles.codeBox}>
              <Text variant="caption" color={palette.inkTertiary}>YOUR CODE</Text>
              <Text variant="h3" mono color={palette.navy}>{couponCode}</Text>
            </View>
          ) : (
            <Text variant="caption" color="rgba(255,255,255,0.85)" align="center">
              Scratch to reveal your coupon
            </Text>
          )}
        </View>

        {locked ? (
          <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.foil, foilStyle]}>
              <LinearGradient
                colors={['#C0C5CE', '#E8ECF2', '#A8B0BC', '#DDE2E8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Animated.View style={[styles.hint, hintStyle]}>
                <Ionicons name="hand-left-outline" size={28} color={palette.navy} />
                <Text variant="bodySm" weight="700" color={palette.navy} style={{ marginTop: spacing.sm }}>
                  Scratch or tap to reveal
                </Text>
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: palette.navyTintStrong,
  },
  revealContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
    gap: spacing.sm,
  },
  vendorLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: palette.white,
  },
  codeBox: {
    backgroundColor: palette.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  foil: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    alignItems: 'center',
    padding: spacing.base,
  },
});
