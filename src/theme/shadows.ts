/**
 * PGfy Owner — Elevation tokens.
 * Flat fintech look: cards use hairline borders, not shadows. Soft shadow is
 * reserved for floating surfaces (FAB, bottom sheets, sticky bars).
 */
import { Platform, ViewStyle } from 'react-native';
import { palette } from './colors';

function shadow(y: number, blur: number, opacity: number, elevation: number): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: y },
      shadowOpacity: opacity,
      shadowRadius: blur / 2,
    },
    android: { elevation },
    default: {},
  }) as ViewStyle;
}

export const shadows = {
  none: {} as ViewStyle,
  card: shadow(2, 8, 0.04, 1),
  raised: shadow(6, 18, 0.07, 4),
  floating: shadow(10, 28, 0.1, 10),
  fab: shadow(8, 20, 0.22, 12),
} as const;
