/** T-S1 — Boot splash. Orange brand frame (matches the app icon's background), then routes
 *  by session. */
import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { Text } from '@/components/ui';
import { PgfyMark } from '@/components/illustrations';
import { session } from '@/lib/session';
import { useAuth } from '@/context/AuthContext';

export default function Boot() {
  const router = useRouter();
  const { status } = useAuth();
  const scale = useSharedValue(0.82);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    scale.value = withDelay(80, withTiming(1, { duration: 750, easing: Easing.out(Easing.back(1.4)) }));
  }, []);

  // Wait for the minimum splash duration AND for AuthContext to resolve the cached session
  // (avoids a flash-then-redirect from `landing`/`(tabs)` when a real token is still restoring).
  useEffect(() => {
    if (status === 'loading') return;
    let active = true;
    const t = setTimeout(async () => {
      if (!active) return;
      const onboarded = await session.isOnboarded();
      if (!onboarded) router.replace('/intro');
      else if (status === 'authenticated') router.replace('/(tabs)');
      else router.replace('/landing');
    }, 1850);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [status, router]);

  const markStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  return (
    <View style={{ flex: 1 }}>
      {/* #F9483E is the app icon's exact background color (assets/images/icon.png) — flat,
          not a gradient, so this matches the native splash screen (app.json) with no color
          shift when the JS bundle takes over. */}
      <LinearGradient colors={['#F9483E', '#F9483E']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
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
