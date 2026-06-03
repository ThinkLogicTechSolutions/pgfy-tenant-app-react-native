/** Primary action button. Coral filled / outline / ghost / danger variants. */
import { ActivityIndicator, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/theme';
import { Text } from './Text';
import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  style?: ViewStyle;
}

const HEIGHT: Record<Size, number> = { sm: 38, md: 48, lg: 54 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  full,
  style,
}: Props) {
  const palettes: Record<Variant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: palette.coral, fg: palette.white },
    danger: { bg: palette.danger, fg: palette.white },
    subtle: { bg: palette.coralTint, fg: palette.coralDark },
    outline: { bg: 'transparent', fg: palette.ink, border: palette.borderStrong },
    ghost: { bg: 'transparent', fg: palette.coralDark },
  };
  const p = palettes[variant];
  const isDisabled = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      style={{
        height: HEIGHT[size],
        backgroundColor: p.bg,
        borderRadius: radius.md,
        borderWidth: p.border ? 1.5 : 0,
        borderColor: p.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        alignSelf: full ? 'stretch' : 'flex-start',
        opacity: isDisabled ? 0.55 : 1,
        ...style,
      }}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={p.fg} /> : null}
          <Text variant="button" color={p.fg} style={size === 'sm' ? { fontSize: 13 } : undefined}>
            {label}
          </Text>
          {iconRight ? <Ionicons name={iconRight} size={size === 'sm' ? 16 : 18} color={p.fg} /> : null}
        </>
      )}
    </PressableScale>
  );
}
