/** Interactive scratch card — real finger-scratch reveal via `rn-scratch-card` (a native
 * scratch-off view), no tap-to-reveal. Crossing the reveal threshold fires
 * `onThresholdReached` once — the caller uses that to call the real scratch API — and the
 * remaining foil fades away immediately regardless of how much was physically scratched,
 * matching a typical scratch-card app's "partial scratch reveals the rest" behavior.
 * `revealing` shows a lightweight loading state on the card face until the caller has a real
 * coupon code to pass in. */
import { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ScratchCard as RnScratchCard } from 'rn-scratch-card';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/theme';
import { Text } from '@/components/ui';

/** Percent (0–100) of the card's area that must be scratched before it counts as "opened". */
const REVEAL_THRESHOLD = 30;
/** Below this, the "scratch to reveal" hint stays visible over the foil. */
const HINT_HIDE_THRESHOLD = 6;
const BRUSH_WIDTH = 45;
const FOIL_SOURCE = require('../../../assets/images/scratch-foil.png');

type Props = {
  bannerUrl: string;
  vendorLogoUrl?: string;
  offerTitle: string;
  couponCode?: string;
  locked: boolean;
  /** Coupon has been drawn but hasn't come back from the API yet — shows a spinner in place
   * of the code, foil already gone. */
  revealing?: boolean;
  onThresholdReached?: () => void;
};

const CARD_W = 300;
const CARD_H = 188;

export function ScratchCard({ bannerUrl, vendorLogoUrl, offerTitle, couponCode, locked, revealing, onThresholdReached }: Props) {
  // `locked` only ever goes true → false in practice (a scratched card never re-locks), so a
  // one-way "has this ever been scratched past the threshold" flag is enough to drive the fade.
  const [foilVisible, setFoilVisible] = useState(locked);
  const [showHint, setShowHint] = useState(true);
  const revealFired = useRef(false);
  const foilOpacity = useSharedValue(1);

  const hideFoil = useCallback(() => setFoilVisible(false), []);

  const foilStyle = useAnimatedStyle(() => ({ opacity: foilOpacity.value }));

  const handleScratch = useCallback(
    (percent: number) => {
      if (showHint && percent >= HINT_HIDE_THRESHOLD) setShowHint(false);
      if (revealFired.current || percent < REVEAL_THRESHOLD) return;
      revealFired.current = true;
      onThresholdReached?.();
      foilOpacity.value = withTiming(0, { duration: 320 }, (finished) => {
        if (finished) runOnJS(hideFoil)();
      });
    },
    [showHint, onThresholdReached, foilOpacity, hideFoil],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Image source={{ uri: bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={['rgba(1,38,78,0.15)', 'rgba(1,38,78,0.88)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.revealContent}>
          {vendorLogoUrl ? <Image source={{ uri: vendorLogoUrl }} style={styles.vendorLogo} contentFit="cover" /> : null}
          <Text variant="bodyMd" weight="700" color={palette.white} align="center" numberOfLines={2}>
            {offerTitle}
          </Text>
          {couponCode ? (
            <View style={styles.codeBox}>
              <Text variant="caption" color={palette.inkTertiary}>YOUR CODE</Text>
              <Text variant="h3" mono color={palette.navy}>{couponCode}</Text>
            </View>
          ) : revealing ? (
            <View style={[styles.codeBox, { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }]}>
              <ActivityIndicator color={palette.navy} size="small" />
              <Text variant="bodySm" color={palette.navy}>Revealing your code…</Text>
            </View>
          ) : (
            <Text variant="caption" color="rgba(255,255,255,0.85)" align="center">
              Scratch to reveal your coupon
            </Text>
          )}
        </View>

        {foilVisible ? (
          <Animated.View style={[styles.foil, foilStyle]} pointerEvents={locked ? 'auto' : 'none'}>
            <RnScratchCard source={FOIL_SOURCE} brushWidth={BRUSH_WIDTH} onScratch={handleScratch} style={styles.foilCard} />
            {showHint ? (
              <View style={styles.hint} pointerEvents="none">
                <Ionicons name="hand-left-outline" size={26} color={palette.navy} />
                <Text variant="bodySm" weight="700" color={palette.navy} style={{ marginTop: spacing.sm }}>
                  Scratch to reveal
                </Text>
              </View>
            ) : null}
          </Animated.View>
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
  },
  foilCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.lg,
  },
  hint: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
