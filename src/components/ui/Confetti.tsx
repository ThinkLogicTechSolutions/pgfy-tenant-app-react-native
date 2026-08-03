/** Playful confetti burst — plays once on mount (or whenever `play` flips true). */
import { useEffect, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { palette } from '@/theme';

const DEFAULT_COLORS = [palette.coral, palette.navy, palette.success, palette.star, palette.info];

interface Piece {
  dx: number;
  dy: number;
  gravity: number;
  rot: number;
  size: number;
  color: string;
  startTop: number;
  round: boolean;
}

function buildPieces(count: number, colors: string[], spread: number, originTop: number): Piece[] {
  const pieces: Piece[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.random;
    pieces.push({
      dx: (r() - 0.5) * spread * 2,
      dy: -(120 + r() * 230),
      gravity: 540 + r() * 360,
      rot: (r() - 0.5) * 1080,
      size: 7 + r() * 7,
      color: colors[i % colors.length],
      startTop: originTop + r() * 24,
      round: r() > 0.5,
    });
  }
  return pieces;
}

function ConfettiPiece({ piece, progress }: { piece: Piece; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const fadeIn = p < 0.08 ? p / 0.08 : 1;
    const fadeOut = p > 0.75 ? 1 - (p - 0.75) / 0.25 : 1;
    return {
      opacity: fadeIn * fadeOut,
      transform: [
        { translateX: piece.dx * p },
        { translateY: piece.dy * p + piece.gravity * p * p },
        { rotate: `${piece.rot * p}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: '50%',
          top: piece.startTop,
          width: piece.size,
          height: piece.round ? piece.size : piece.size * 0.5,
          marginLeft: -piece.size / 2,
          borderRadius: piece.round ? piece.size / 2 : 2,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}

interface Props {
  count?: number;
  play?: boolean;
  colors?: string[];
  /** Vertical origin (px from the top of the overlay) the pieces launch from. */
  originTop?: number;
  duration?: number;
}

export function Confetti({ count = 28, play = true, colors = DEFAULT_COLORS, originTop = 0, duration = 1700 }: Props) {
  const { width } = useWindowDimensions();
  const progress = useSharedValue(0);
  const pieces = useMemo(() => buildPieces(count, colors, width * 0.55, originTop), [count, colors, width, originTop]);

  useEffect(() => {
    if (play) {
      progress.value = 0;
      progress.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
    }
  }, [play, duration, progress]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} progress={progress} />
      ))}
    </View>
  );
}
