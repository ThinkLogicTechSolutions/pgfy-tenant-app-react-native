/**
 * PGfy Owner — Typography (Inter)
 * Weights map to distinct loaded families because RN doesn't synthesize
 * weights reliably for custom fonts.
 */
import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

type TypeToken = Pick<
  TextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing'
>;

export const type: Record<
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyLg'
  | 'body'
  | 'bodyMd'
  | 'bodySm'
  | 'caption'
  | 'overline'
  | 'button'
  | 'numLg',
  TypeToken
> = {
  display: { fontFamily: fontFamily.extrabold, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  h1: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  h2: { fontFamily: fontFamily.bold, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  h3: { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.1 },
  bodyLg: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 23 },
  body: { fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 22 },
  bodyMd: { fontFamily: fontFamily.medium, fontSize: 15, lineHeight: 22 },
  bodySm: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: fontFamily.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 0.6 },
  button: { fontFamily: fontFamily.semibold, fontSize: 15, lineHeight: 20, letterSpacing: 0.1 },
  numLg: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 32, letterSpacing: -0.5 },
};

/** Map a font-weight string to an Inter family (for ad-hoc styling). */
export function familyForWeight(weight: '400' | '500' | '600' | '700' | '800'): string {
  return {
    '400': fontFamily.regular,
    '500': fontFamily.medium,
    '600': fontFamily.semibold,
    '700': fontFamily.bold,
    '800': fontFamily.extrabold,
  }[weight];
}
