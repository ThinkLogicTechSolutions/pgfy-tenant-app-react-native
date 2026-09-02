/** Small status pill. */
import { View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/theme';
import { Text } from './Text';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'coral';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: palette.successTint, fg: palette.success },
  warning: { bg: palette.warningTint, fg: '#B26A00' },
  danger: { bg: palette.dangerTint, fg: palette.danger },
  info: { bg: palette.infoTint, fg: palette.info },
  neutral: { bg: palette.surfaceRaised, fg: palette.inkSecondary },
  coral: { bg: palette.coralTint, fg: palette.coralDark },
};

interface Props {
  label: string;
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
  dot?: boolean;
  style?: ViewStyle;
  small?: boolean;
}

export function Badge({ label, tone = 'neutral', icon, dot, style, small }: Props) {
  const t = TONES[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        backgroundColor: t.bg,
        borderRadius: radius.pill,
        paddingHorizontal: small ? 8 : 10,
        paddingVertical: small ? 3 : 4,
        ...style,
      }}
    >
      {dot ? (
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.fg }} />
      ) : null}
      {icon ? <Ionicons name={icon} size={small ? 11 : 13} color={t.fg} /> : null}
      <Text variant="overline" color={t.fg} style={{ fontSize: small ? 10 : 11 }}>
        {label}
      </Text>
    </View>
  );
}
