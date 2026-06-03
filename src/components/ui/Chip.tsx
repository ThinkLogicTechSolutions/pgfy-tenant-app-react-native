/** Selectable filter chip with count. */
import { ViewStyle } from 'react-native';
import { palette, radius, spacing } from '@/theme';
import { Text } from './Text';
import { PressableScale } from './PressableScale';

interface Props {
  label: string;
  active?: boolean;
  count?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, active, count, onPress, style }: Props) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.95}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: spacing.base,
        height: 36,
        borderRadius: radius.pill,
        backgroundColor: active ? palette.ink : palette.surface,
        borderWidth: 1,
        borderColor: active ? palette.ink : palette.border,
        ...style,
      }}
    >
      <Text variant="bodySm" weight={active ? '600' : '500'} color={active ? palette.white : palette.inkSecondary}>
        {label}
      </Text>
      {count !== undefined ? (
        <Text
          variant="caption"
          color={active ? palette.white : palette.inkTertiary}
          style={{ opacity: 0.9 }}
        >
          {count}
        </Text>
      ) : null}
    </PressableScale>
  );
}
