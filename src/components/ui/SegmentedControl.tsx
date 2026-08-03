/** iOS-style segmented control with an animated sliding pill. */
import { useState } from 'react';
import { View, LayoutChangeEvent, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { palette, radius } from '@/theme';
import { Text } from './Text';
import { PressableScale } from './PressableScale';
import { haptic } from '@/lib/haptics';

export interface Segment {
  key: string;
  label: string;
  count?: number;
}

interface Props {
  segments: Segment[];
  value: string;
  onChange: (key: string) => void;
  style?: ViewStyle;
}

export function SegmentedControl({ segments, value, onChange, style }: Props) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const n = segments.length;
  const segW = w / n;
  const index = Math.max(0, segments.findIndex((s) => s.key === value));

  const pill = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(index * segW, { duration: 200 }) }],
    width: segW > 0 ? segW - 6 : 0,
  }));

  return (
    <View
      onLayout={onLayout}
      style={[
        {
          flexDirection: 'row',
          backgroundColor: palette.surfaceSunken,
          borderRadius: radius.md,
          padding: 3,
          height: 42,
        },
        style,
      ]}
    >
      {w > 0 ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 3,
              left: 3,
              bottom: 3,
              backgroundColor: palette.surface,
              borderRadius: radius.sm,
            },
            pill,
          ]}
        />
      ) : null}
      {segments.map((s) => {
        const active = s.key === value;
        return (
          <PressableScale
            key={s.key}
            scaleTo={0.96}
            haptics={false}
            onPress={() => {
              haptic.select();
              onChange(s.key);
            }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 }}
          >
            <Text variant="bodySm" weight={active ? '600' : '500'} color={active ? palette.ink : palette.inkSecondary}>
              {s.label}
            </Text>
            {s.count !== undefined ? (
              <View
                style={{
                  minWidth: 18,
                  height: 18,
                  paddingHorizontal: 5,
                  borderRadius: 9,
                  backgroundColor: active ? palette.coralTint : palette.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text variant="caption" style={{ fontSize: 10 }} color={active ? palette.coralDark : palette.inkSecondary}>
                  {s.count}
                </Text>
              </View>
            ) : null}
          </PressableScale>
        );
      })}
    </View>
  );
}
