/** Two-thumb (or single-thumb radius) range slider for numeric filters. */
import { useMemo, useRef, useState } from 'react';
import { View, LayoutChangeEvent, PanResponder } from 'react-native';
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

  // Live props/geometry, read inside the responder callbacks below. The PanResponders are
  // created once (they must be, or a mid-drag re-render would swap the handler out), so they
  // can't close over `low`/`high` directly.
  const latest = useRef({ min, max, low, high, single, onChange, toX, fromX });
  latest.current = { min, max, low, high, single, onChange, toX, fromX };

  // Deliberately RN's responder system rather than gesture-handler's `Gesture.Pan`: these
  // thumbs live inside the sheet's gesture-handler ScrollView, which wins the RNGH arena and
  // leaves a Pan child dead. Granting the responder on touch-down — and refusing to hand it
  // back (`onPanResponderTerminationRequest: false`) — keeps the whole drag here instead.
  const makeResponder = (
    onGrant: () => void,
    onMove: (dx: number) => void,
  ) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: onGrant,
      onPanResponderMove: (_e, g) => onMove(g.dx),
    });

  const lowResponder = useMemo(
    () =>
      makeResponder(
        () => {
          startLow.current = latest.current.low;
        },
        (dx) => {
          const s = latest.current;
          const next = Math.min(s.high, s.fromX(s.toX(startLow.current) + dx));
          if (next !== s.low) s.onChange(next, s.high);
        },
      ),
    [],
  );

  const highResponder = useMemo(
    () =>
      makeResponder(
        () => {
          startHigh.current = latest.current.high;
        },
        (dx) => {
          const s = latest.current;
          const next = Math.max(s.single ? s.min : s.low, s.fromX(s.toX(startHigh.current) + dx));
          if (next !== s.high) s.onChange(s.single ? s.min : s.low, next);
        },
      ),
    [],
  );

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
          <View
            {...lowResponder.panHandlers}
            style={{ position: 'absolute', left: lowX, width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' }}
          >
            <Thumb />
          </View>
        ) : null}
        {trackW > 0 ? (
          <View
            {...highResponder.panHandlers}
            style={{ position: 'absolute', left: highX, width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' }}
          >
            <Thumb />
          </View>
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
