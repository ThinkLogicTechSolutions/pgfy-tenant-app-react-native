/** Typed Text primitive — maps `variant` to the Inter type scale. */
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { type as typeScale, palette, familyForWeight } from '@/theme';

type Variant = keyof typeof typeScale;
type Weight = '400' | '500' | '600' | '700' | '800';

export interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: string;
  weight?: Weight;
  align?: TextStyle['textAlign'];
  /** tabular figures — use for money & percentages */
  mono?: boolean;
}

export function Text({
  variant = 'body',
  color = palette.ink,
  weight,
  align,
  mono,
  style,
  ...rest
}: TextProps) {
  const base = typeScale[variant];
  const fontFamily = weight ? familyForWeight(weight) : base.fontFamily;
  return (
    <RNText
      {...rest}
      style={[
        base,
        { color, fontFamily },
        align ? { textAlign: align } : null,
        mono ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
    />
  );
}
