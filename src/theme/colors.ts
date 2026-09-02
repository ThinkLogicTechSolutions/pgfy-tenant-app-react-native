/**
 * PGfy Tenant — Color tokens.
 * Brand identity (from logo-mark.png): deep navy #01264E + white, with coral
 * #FF4B3E as the energetic accent/CTA. A booking-marketplace palette: navy for
 * brand surfaces (splash, hero, headers, active nav, trust), coral for action.
 */

export const palette = {
  // Accent / primary action — PGfy coral
  coral: '#FF4B3E',
  coralDark: '#E03A2E',
  coralPressed: '#C8311F',
  coralTint: '#FFEDEB',
  coralTintStrong: '#FFD9D5',

  // Brand / deep — navy (from tenant logo)
  navy: '#01264E',
  navyDark: '#011C3C',
  navyPressed: '#01142B',
  navyTint: '#E7ECF3',
  navyTintStrong: '#CCD7E6',
  onNavy: '#FFFFFF',

  // Cool neutral surfaces (marketplace clean)
  bg: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceRaised: '#F1F3F6',
  surfaceSunken: '#ECEFF3',
  border: '#E7EAEF',
  borderStrong: '#D7DCE3',

  // Text
  ink: '#15243B',
  inkSecondary: '#5B6678',
  inkTertiary: '#97A0AE',
  inkInverse: '#FFFFFF',

  // Semantic
  success: '#1FB573',
  successTint: '#E7F6EF',
  warning: '#F5A623',
  warningTint: '#FFF4E0',
  info: '#3B82F6',
  infoTint: '#E8F0FE',
  danger: '#E5484D',
  dangerTint: '#FDECEC',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(15,42,73,0.5)',
  shadow: '#0F2A49',
  star: '#F5A623',
} as const;

/** Bed / room status legend (PRD §2.5). */
export const bedStatus = {
  available: { solid: '#1FB573', tint: '#E7F6EF', ink: '#0E7A4B', label: 'Available' },
  pending: { solid: '#3B82F6', tint: '#E8F0FE', ink: '#1D5FD8', label: 'Selected' },
  occupied: { solid: '#E5484D', tint: '#FDECEC', ink: '#B42318', label: 'Occupied' },
  reserved: { solid: '#F5A623', tint: '#FFF4E0', ink: '#B26A00', label: 'Reserved' },
  blocked: { solid: '#B5B2AC', tint: '#F0EEEA', ink: '#6E6B66', label: 'Blocked' },
} as const;

export type BedStatusKey = keyof typeof bedStatus;

export const colors = palette;
export type Palette = typeof palette;
