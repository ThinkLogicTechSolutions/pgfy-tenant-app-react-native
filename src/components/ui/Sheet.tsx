/** Bottom sheet with slide-up animation, backdrop tap + drag-to-dismiss. */
import { useEffect, useState } from 'react';
import { Modal, View, useWindowDimensions } from 'react-native';
// gesture-handler's ScrollView (not RN's) — it shares the same gesture-responder system as
// GestureDetector, so nested gestures (e.g. the calendar's horizontal month swipe) can win
// the arena instead of being eaten by a plain RN ScrollView's separate PanResponder.
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radius, spacing } from '@/theme';
import { Text } from './Text';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Optional node rendered on the right side of the title (e.g. a share button). */
  titleRight?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
}

export function Sheet({ visible, onClose, title, titleRight, children, scroll }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(height);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
      backdrop.value = withTiming(1, { duration: 220 });
    } else if (mounted) {
      backdrop.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(height, { duration: 240 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Constrained so it only claims clear downward drags — otherwise it wins the gesture
  // arena over any horizontal swipe in the sheet's content (e.g. the calendar's month swipe)
  // on the very first frame of movement, before that gesture's own offset threshold fires.
  const pan = Gesture.Pan()
    .activeOffsetY([10, 1000])
    .failOffsetX([-15, 15])
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 800) {
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, { duration: 180 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  if (!mounted) return null;

  return (
    <Modal visible transparent statusBarTranslucent onRequestClose={onClose} animationType="none">
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={[{ position: 'absolute', inset: 0, backgroundColor: palette.overlay }, backdropStyle]}>
          <Animated.View style={{ flex: 1 }} onTouchEnd={onClose} />
        </Animated.View>
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              {
                backgroundColor: palette.surface,
                borderTopLeftRadius: radius.sheet,
                borderTopRightRadius: radius.sheet,
                paddingBottom: insets.bottom + spacing.base,
                maxHeight: height * 0.86,
              },
              sheetStyle,
            ]}
          >
            <View style={{ alignItems: 'center', paddingTop: spacing.md }}>
              <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: palette.borderStrong }} />
            </View>
            {title ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.base }}>
                <Text variant="h3" style={{ flex: 1 }} numberOfLines={1}>
                  {title}
                </Text>
                {titleRight}
              </View>
            ) : null}
            {scroll ? (
              <ScrollView
                contentContainerStyle={{ padding: spacing.lg }}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={{ padding: spacing.lg }}>{children}</View>
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}
