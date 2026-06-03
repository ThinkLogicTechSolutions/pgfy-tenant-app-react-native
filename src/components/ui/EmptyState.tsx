/** Centered empty / error state with an illustration + optional CTA. */
import { View } from 'react-native';
import { palette, spacing } from '@/theme';
import { Text } from './Text';
import { Button } from './Button';

interface Props {
  illustration?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({ illustration, title, message, actionLabel, onAction, compact }: Props) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: compact ? spacing.xl : spacing['4xl'], paddingHorizontal: spacing.xl }}>
      {illustration ? <View style={{ marginBottom: spacing.lg }}>{illustration}</View> : null}
      <Text variant="h3" align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="body" color={palette.inkSecondary} align="center" style={{ marginTop: 6, maxWidth: 280 }}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="subtle" style={{ marginTop: spacing.lg }} />
      ) : null}
    </View>
  );
}
