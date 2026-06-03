/** Shimmer placeholder block. */
import { useEffect } from 'react';
import { ViewStyle, DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { palette, radius } from '@/theme';

interface Props {
  width?: DimensionValue;
  height?: number;
  rounded?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, rounded = radius.sm, style }: Props) {
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{ width, height, borderRadius: rounded, backgroundColor: palette.surfaceSunken }, animated, style]}
    />
  );
}
