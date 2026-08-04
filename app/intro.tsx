/** Intro carousel after splash — top 3 tenant features (owner-app intro pattern). */
import { useRef, useState } from 'react';
import { View, useWindowDimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing } from '@/theme';
import { Text, Button, PressableScale } from '@/components/ui';
import { session } from '@/lib/session';

const SLIDES = [
  {
    key: 'find',
    icon: 'search-outline' as const,
    title: 'Find your perfect home',
    desc: 'Browse verified PGs, hostels and co-livings near you — with real photos, ratings and transparent prices.',
    color: palette.coral,
    bgColor: palette.coralTint,
  },
  {
    key: 'book',
    icon: 'bed-outline' as const,
    title: 'Book in minutes',
    desc: 'Pick your bed, pay securely and get a QR pass for instant check-in. Zero brokerage, always.',
    color: palette.navy,
    bgColor: palette.navyTint,
  },
  {
    key: 'manage',
    icon: 'home-outline' as const,
    title: 'Manage your entire stay',
    desc: 'Pay rent, raise tickets, invite visitors and track everything — all in one app.',
    color: palette.success,
    bgColor: palette.successTint,
  },
];

export default function Intro() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  const isLast = activeIndex === SLIDES.length - 1;

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: false,
    listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
    },
  });

  const finish = async () => {
    await session.setOnboarded();
    router.replace('/(auth)/login');
  };

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    } else {
      finish();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {!isLast ? (
        <View style={{ alignItems: 'flex-end', paddingHorizontal: spacing.base, paddingBottom: spacing.sm }}>
          <PressableScale onPress={finish} haptics={false} style={{ padding: spacing.sm }}>
            <Text variant="bodyMd" weight="600" color={palette.inkSecondary}>
              Skip
            </Text>
          </PressableScale>
        </View>
      ) : (
        <View style={{ height: spacing.xl + spacing.sm }} />
      )}

      <View
        style={{
          position: 'absolute',
          top: -height * 0.12,
          right: -width * 0.2,
          width: width * 0.7,
          height: width * 0.7,
          borderRadius: width * 0.35,
          backgroundColor: 'rgba(255, 75, 62, 0.1)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -height * 0.1,
          left: -width * 0.25,
          width: width * 0.6,
          height: width * 0.6,
          borderRadius: width * 0.3,
          backgroundColor: palette.navyTint,
        }}
      />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide) => (
          <View key={slide.key} style={{ width, flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing['2xl'] }}>
            <View
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: slide.bgColor,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: spacing['3xl'],
              }}
            >
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: slide.color,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: palette.border,
                }}
              >
                <Ionicons name={slide.icon} size={40} color={palette.white} />
              </View>
              <View
                style={{
                  position: 'absolute',
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  borderWidth: 1.5,
                  borderColor: `${slide.color}33`,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  width: 240,
                  height: 240,
                  borderRadius: 120,
                  borderWidth: 1.5,
                  borderColor: `${slide.color}1A`,
                }}
              />
            </View>
            <Text variant="h1" align="center">
              {slide.title}
            </Text>
            <Text variant="bodyLg" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.md, lineHeight: 24, paddingHorizontal: spacing.lg }}>
              {slide.desc}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
        {SLIDES.map((_, i) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [8, 28, 8],
            extrapolate: 'clamp',
          });
          const dotOpacity = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={i}
              style={{ height: 6, borderRadius: 3, backgroundColor: palette.coral, width: dotWidth, opacity: dotOpacity }}
            />
          );
        })}
      </View>

      <View style={{ paddingHorizontal: spacing['2xl'], paddingBottom: spacing.lg }}>
        <Button label={isLast ? 'Get started' : 'Next'} onPress={goNext} full size="lg" iconRight={isLast ? 'arrow-forward' : undefined} />
      </View>
    </View>
  );
}
