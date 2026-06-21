/** Wraps a list row in a staggered fade-up entrance. Pass the row `index` for the stagger. */
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Props {
  index?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Per-item stagger delay in ms (capped so long lists don't wait too long). */
  delayStep?: number;
  duration?: number;
}

export function AnimatedListItem({ index = 0, children, style, delayStep = 55, duration = 360 }: Props) {
  const delay = Math.min(index, 8) * delayStep;
  return (
    <Animated.View entering={FadeInDown.duration(duration).delay(delay)} style={style}>
      {children}
    </Animated.View>
  );
}
