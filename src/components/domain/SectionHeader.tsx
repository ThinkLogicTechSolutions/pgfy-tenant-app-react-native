import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing } from '@/theme';
import { Text, PressableScale } from '@/components/ui';

export function SectionHeader({
  title, subtitle, actionLabel, onAction, style,
}: {
  title: string; subtitle?: string; actionLabel?: string; onAction?: () => void; style?: object;
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }, style]}>
      <View style={{ flex: 1 }}>
        <Text variant="h3">{title}</Text>
        {subtitle ? <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: 1 }}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <PressableScale onPress={onAction} haptics={false} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text variant="bodySm" weight="600" color={palette.coralDark}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={palette.coralDark} />
        </PressableScale>
      ) : null}
    </View>
  );
}
