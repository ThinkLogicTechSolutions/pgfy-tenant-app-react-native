/** Bottom sheet with slide-up animation, backdrop tap + drag-to-dismiss. */
import { useEffect, useState } from 'react';
import { Modal, View, useWindowDimensions, Keyboard, Platform, type KeyboardEvent } from 'react-native';
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

/**
 * `KeyboardAvoidingView` doesn't reliably resize `Modal` content — on Android the Modal opens
 * its own window that ignores the activity's `adjustResize`, and on iOS it can fight the sheet's
 * own slide-up animation. Tracking the keyboard height directly and pushing the sheet up by that
 * amount works the same way on both platforms.
 */
function useKeyboardOffset() {
  const offset = useSharedValue(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      offset.value = withTiming(e.endCoordinates.height, { duration: e.duration || 220 });
    };
    const onHide = (e: KeyboardEvent) => {
      offset.value = withTiming(0, { duration: e.duration || 200 });
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return offset;
}

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
  const keyboardOffset = useKeyboardOffset();

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

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value - keyboardOffset.value }],
    maxHeight: Math.max(height * 0.4, height * 0.86 - keyboardOffset.value),
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  if (!mounted) return null;

  return (
    <Modal visible transparent statusBarTranslucent onRequestClose={onClose} animationType="none">
      {/* Keyboard offset is tracked manually (see `useKeyboardOffset`) and folded into
          `sheetStyle` above — `KeyboardAvoidingView` doesn't reliably resize `Modal` content
          on either platform. */}
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
                // Cover the nav-bar inset OR the base padding, not both stacked — stacking is
                // what produced the oversized dead band under sheets on Android.
                paddingBottom: Math.max(insets.bottom, spacing.base),
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
