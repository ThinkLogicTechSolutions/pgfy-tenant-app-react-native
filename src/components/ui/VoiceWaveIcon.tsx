/** Animated waveform icon — a small idle-pulsing version sits in the search bar as the voice
 *  search trigger; a larger version reacts live to microphone volume inside VoiceSearchSheet. */
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  cancelAnimation,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { palette } from '@/theme';

const BAR_CONFIG = [
  { duration: 560, delay: 0 },
  { duration: 460, delay: 90 },
  { duration: 640, delay: 30 },
  { duration: 500, delay: 140 },
  { duration: 600, delay: 60 },
];

interface Props {
  /** Bar count driven by BAR_CONFIG; pass a shorter array for a compact icon. */
  size?: 'sm' | 'lg';
  /** Whether the idle wave loop should run — always true for the icon button, tied to
   *  "listening" state inside the sheet. */
  active?: boolean;
  /** Live input volume (0..1, smoothed) — amplifies the idle wave when provided. */
  volume?: SharedValue<number>;
  color?: string;
}

export function VoiceWaveIcon({ size = 'sm', active = true, volume, color = palette.navy }: Props) {
  const bars = size === 'sm' ? BAR_CONFIG.slice(0, 4) : BAR_CONFIG;
  const barWidth = size === 'sm' ? 2.5 : 5;
  const gap = size === 'sm' ? 3 : 6;
  const maxHeight = size === 'sm' ? 16 : 44;
  const minHeight = size === 'sm' ? 4 : 8;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap, height: maxHeight }}>
      {bars.map((cfg, i) => (
        <WaveBar
          key={i}
          active={active}
          volume={volume}
          duration={cfg.duration}
          delay={cfg.delay}
          width={barWidth}
          minHeight={minHeight}
          maxHeight={maxHeight}
          color={color}
        />
      ))}
    </View>
  );
}

function WaveBar({
  active,
  volume,
  duration,
  delay,
  width,
  minHeight,
  maxHeight,
  color,
}: {
  active: boolean;
  volume?: SharedValue<number>;
  duration: number;
  delay: number;
  width: number;
  minHeight: number;
  maxHeight: number;
  color: string;
}) {
  const idle = useSharedValue(0.35);

  useEffect(() => {
    if (active) {
      idle.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.3, { duration, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        ),
      );
    } else {
      cancelAnimation(idle);
      idle.value = withTiming(0.3, { duration: 200 });
    }
    return () => cancelAnimation(idle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const style = useAnimatedStyle(() => {
    const boost = volume ? 1 + volume.value * 1.6 : 1;
    const range = maxHeight - minHeight;
    const height = Math.min(maxHeight, minHeight + idle.value * range * boost);
    return { height };
  });

  return (
    <Animated.View
      style={[
        { width, borderRadius: width / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}
