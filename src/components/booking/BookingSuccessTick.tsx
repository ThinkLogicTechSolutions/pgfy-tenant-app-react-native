import { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '@/theme';

export const BOOKING_TICK_INTRO_MS = 2200;

export function useBookingSuccessSound() {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          require('../../../assets/sounds/booking_success.mp3'),
          { shouldPlay: true, volume: 1 },
        );
        if (cancelled) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
      } catch {
        // Sound is optional; the tick animation still completes.
      }
    })();

    return () => {
      cancelled = true;
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);
}

type TickProps = {
  size?: number;
};

/** Animated checkmark burst — entrance runs once on mount. */
export function AnimatedSuccessTick({ size = 112 }: TickProps) {
  const circleScale = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.55);
  const ringOpacity = useSharedValue(0);

  const ringSize = size * 1.18;
  const iconSize = Math.round(size * 0.5);

  useEffect(() => {
    circleScale.value = withSpring(1, { damping: 13, stiffness: 210 });
    checkScale.value = withDelay(320, withSpring(1, { damping: 11, stiffness: 260 }));
    checkOpacity.value = withDelay(320, withTiming(1, { duration: 220 }));
    ringOpacity.value = withDelay(120, withSequence(
      withTiming(0.5, { duration: 220 }),
      withTiming(0, { duration: 780, easing: Easing.out(Easing.quad) }),
    ));
    ringScale.value = withDelay(120, withTiming(1.85, { duration: 1000, easing: Easing.out(Easing.cubic) }));
  }, [checkOpacity, checkScale, circleScale, ringOpacity, ringScale]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={[styles.hero, { width: size, height: size }]}>
      <Animated.View style={[styles.ring, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }, ringStyle]} />
      <Animated.View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }, circleStyle]}>
        <Animated.View style={checkStyle}>
          <Ionicons name="checkmark" size={iconSize} color={palette.white} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: palette.success,
  },
  circle: {
    backgroundColor: palette.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.success,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
});
