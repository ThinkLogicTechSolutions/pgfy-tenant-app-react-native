/** PGfy Owner — Design system barrel. */
export { palette, colors, bedStatus } from './colors';
export type { Palette, BedStatusKey } from './colors';
export { fontFamily, type, familyForWeight } from './typography';
export { spacing, radius, layout } from './spacing';
export { shadows } from './shadows';

import { palette } from './colors';
import { type as typeScale, fontFamily } from './typography';
import { spacing, radius, layout } from './spacing';
import { shadows } from './shadows';

/** Single theme object for convenient destructuring. */
export const theme = {
  colors: palette,
  type: typeScale,
  fontFamily,
  spacing,
  radius,
  layout,
  shadows,
} as const;

export type Theme = typeof theme;
