/** Renders whatever `src/lib/toast.ts` broadcasts. Mount exactly once, in the root layout. */
import { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing, shadows } from '@/theme';
import { Text } from './Text';
import { subscribeToast, type ToastState, type ToastTone } from '@/lib/toast';

const TONE: Record<ToastTone, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { icon: 'checkmark-circle', color: palette.success },
  error: { icon: 'close-circle', color: palette.danger },
  info: { icon: 'information-circle', color: palette.info },
};

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => subscribeToast(setState), []);

  useEffect(() => {
    if (!state) return;
    opacity.setValue(0);
    translateY.setValue(12);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
    const fadeOutDelay = Math.max(0, state.durationMs - 200);
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }, fadeOutDelay);
    return () => clearTimeout(t);
  }, [state, opacity, translateY]);

  if (!state) return null;
  const tone = TONE[state.tone];

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + spacing.xl, alignItems: 'center', paddingHorizontal: spacing.lg }}>
      <Animated.View
        style={{
          opacity,
          transform: [{ translateY }],
          maxWidth: 420,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: palette.navy,
          borderRadius: radius.pill,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.base,
          ...shadows.floating,
        }}
      >
        <Ionicons name={tone.icon} size={18} color={tone.color} />
        <Text variant="bodySm" weight="600" color={palette.white} style={{ flexShrink: 1 }}>
          {state.message}
        </Text>
      </Animated.View>
    </View>
  );
}
