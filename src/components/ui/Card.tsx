/** Surface card with hairline border (flat fintech look). */
import { View, ViewStyle, StyleProp } from 'react-native';
import { palette, radius, layout, shadows } from '@/theme';
import { PressableScale } from './PressableScale';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
  onPress?: () => void;
}

export function Card({ children, style, padded = true, elevated = false, onPress }: Props) {
  const base: ViewStyle = {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: layout.hairline,
    borderColor: palette.border,
    padding: padded ? layout.cardPadding : 0,
    ...(elevated ? shadows.raised : null),
  };

  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={[base, style]}>
        {children}
      </PressableScale>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
