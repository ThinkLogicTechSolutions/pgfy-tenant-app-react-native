/** Two-thumb (or single-thumb radius) range slider for numeric filters. */
import { useRef, useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { palette, spacing } from '@/theme';
import { Text } from './Text';

const HIT = 32; // draggable hit-area width
const DOT = 22; // visible thumb diameter

interface Props {
  min: number;
  max: number;
  step: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
  /** Radius mode — only the upper thumb moves, low stays pinned to min. */
  single?: boolean;
  /** Formats the values shown above the track. */
  format?: (v: number) => string;
  /** Label shown for the upper value when it sits at the maximum (e.g. "Any distance"). */
  maxLabel?: string;
}

export function RangeSlider({ min, max, step, low, high, onChange, single, format, maxLabel }: Props) {
  const [trackW, setTrackW] = useState(0);
  const startLow = useRef(low);
  const startHigh = useRef(high);

  const range = Math.max(1, max - min);
  const usable = Math.max(0, trackW - HIT);
  const toX = (v: number) => ((v - min) / range) * usable;
  const fromX = (x: number) => {
    const raw = min + (x / usable) * range;
    const stepped = Math.round(raw / step) * step;
    return Math.min(max, Math.max(min, stepped));
  };

  const lowPan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .onStart(() => {
      startLow.current = low;
    })
    .onUpdate((e) => {
      const next = Math.min(high, fromX(toX(startLow.current) + e.translationX));
      if (next !== low) onChange(next, high);
    })
    .runOnJS(true);

  const highPan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .onStart(() => {
      startHigh.current = high;
    })
    .onUpdate((e) => {
      const next = Math.max(single ? min : low, fromX(toX(startHigh.current) + e.translationX));
      if (next !== high) onChange(single ? min : low, next);
    })
    .runOnJS(true);

  const lowX = toX(single ? min : low);
  const highX = toX(high);

  const fmt = (v: number) => (format ? format(v) : String(v));
  const highLabel = high >= max ? maxLabel ?? `${fmt(max)}+` : fmt(high);

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
        {single ? (
          <Text variant="bodySm" weight="700" color={palette.navy}>
            {high >= max ? maxLabel ?? `Within ${fmt(max)}+` : `Within ${fmt(high)}`}
          </Text>
        ) : (
          <>
            <Text variant="bodySm" weight="700" color={palette.navy}>
              {fmt(low)}
            </Text>
            <Text variant="bodySm" weight="700" color={palette.navy}>
              {highLabel}
            </Text>
          </>
        )}
      </View>

      <View
        onLayout={(e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width)}
        style={{ height: HIT, justifyContent: 'center' }}
      >
        {/* base track */}
        <View
          style={{
            position: 'absolute',
            left: HIT / 2,
            right: HIT / 2,
            height: 4,
            borderRadius: 2,
            backgroundColor: palette.border,
          }}
        />
        {/* active fill */}
        {trackW > 0 ? (
          <View
            style={{
              position: 'absolute',
              left: HIT / 2 + lowX,
              width: Math.max(0, highX - lowX),
              height: 4,
              borderRadius: 2,
              backgroundColor: palette.navy,
            }}
          />
        ) : null}
        {/* thumbs */}
        {trackW > 0 && !single ? (
          <GestureDetector gesture={lowPan}>
            <View style={{ position: 'absolute', left: lowX, width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' }}>
              <Thumb />
            </View>
          </GestureDetector>
        ) : null}
        {trackW > 0 ? (
          <GestureDetector gesture={highPan}>
            <View style={{ position: 'absolute', left: highX, width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' }}>
              <Thumb />
            </View>
          </GestureDetector>
        ) : null}
      </View>
    </View>
  );
}

function Thumb() {
  return (
    <View
      style={{
        width: DOT,
        height: DOT,
        borderRadius: DOT / 2,
        backgroundColor: palette.surface,
        borderWidth: 2,
        borderColor: palette.navy,
        shadowColor: '#000',
        shadowOpacity: 0.16,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
      }}
    />
  );
}
