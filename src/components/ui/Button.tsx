/** Primary action button. Coral filled / outline / ghost / danger variants. */
import { ActivityIndicator, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { palette, radius, spacing } from '@/theme';
import { Text } from './Text';
import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  /** Optional text shown next to the spinner while `loading` (e.g. "Sending OTP…"). */
  loadingLabel?: string;
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
  loadingLabel,
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
  const labelStyle = size === 'sm' ? { fontSize: 13 } : undefined;
  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      scaleTo={0.96}
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
        overflow: 'hidden',
        ...style,
      }}
    >
      {loading ? (
        <Animated.View
          key="loading"
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
        >
          <ActivityIndicator color={p.fg} size="small" />
          {loadingLabel ? (
            <Text variant="button" color={p.fg} style={labelStyle} numberOfLines={1}>
              {loadingLabel}
            </Text>
          ) : null}
        </Animated.View>
      ) : (
        // No `exiting` here — unlike the loading spinner (an intra-button swap), this branch
        // is what's on screen for every ordinary, never-loading button, so it unmounts
        // constantly as part of unrelated screen transitions (e.g. a parent flipping from an
        // empty state to real content). Reanimated keeps an `exiting` view rendered as a
        // ghost overlay for its animation's duration even after React unmounts it — on
        // Android that overlay can paint behind the freshly-mounted screen instead of on top,
        // showing up as a stray label bleeding through new content. `entering` alone doesn't
        // have this failure mode (it only affects how a view animates in, not what lingers
        // after removal), so it's kept for the nice fade back from the loading state.
        <Animated.View
          key="content"
          entering={FadeIn.duration(160)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
        >
          {icon ? <Ionicons name={icon} size={iconSize} color={p.fg} /> : null}
          <Text variant="button" color={p.fg} style={labelStyle} numberOfLines={1}>
            {label}
          </Text>
          {iconRight ? <Ionicons name={iconRight} size={iconSize} color={p.fg} /> : null}
        </Animated.View>
      )}
    </PressableScale>
  );
}
