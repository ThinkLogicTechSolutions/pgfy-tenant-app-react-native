/** T-S1 — Boot splash. Navy brand frame, then routes by session. */
import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { palette } from '@/theme';
import { Text } from '@/components/ui';
import { PgfyMark } from '@/components/illustrations';
import { session } from '@/lib/session';

export default function Boot() {
  const router = useRouter();
  const scale = useSharedValue(0.82);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    scale.value = withDelay(80, withTiming(1, { duration: 750, easing: Easing.out(Easing.back(1.4)) }));

    let active = true;
    const t = setTimeout(async () => {
      if (!active) return;
      const onboarded = await session.isOnboarded();
      const loggedIn = await session.isLoggedIn();
       if (!onboarded) router.replace('/intro');
      else if (loggedIn) router.replace('/(tabs)');
      else router.replace('/landing');
    }, 1850);
    return () => {
      active = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[palette.navy, palette.navyDark]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={markStyle}>
          <PgfyMark size={120} variant="white" />
        </Animated.View>
        <Animated.View entering={FadeIn.delay(450).duration(600)} style={{ alignItems: 'center', marginTop: 18 }}>
          <Text variant="bodyMd" color="rgba(255,255,255,0.85)">Smart Living, Simplified</Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(900).duration(600)} style={{ position: 'absolute', bottom: 56, alignItems: 'center' }}>
          <Text variant="caption" color="rgba(255,255,255,0.75)">FIND · BOOK · LIVE</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
