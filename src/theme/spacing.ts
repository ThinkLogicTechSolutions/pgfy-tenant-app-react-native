/** PGfy Owner — Spacing, radius & layout tokens (4dp base grid). */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
  sheet: 24,
  bed: 10,
} as const;

export const layout = {
  screenPadding: 16,
  cardPadding: 16,
  cardGap: 12,
  sectionGap: 24,
  hairline: 1,
  tabBarHeight: 60,
  fabSize: 58,
  avatar: { sm: 32, md: 44, lg: 56 },
} as const;
