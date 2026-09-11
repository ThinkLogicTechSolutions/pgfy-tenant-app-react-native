import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing } from '@/theme';
import { Text } from './Text';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: palette.dangerTint, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
        <Ionicons name="alert-circle-outline" size={32} color={palette.danger} />
      </View>
      <Text variant="h3" align="center">{title}</Text>
      <Text variant="bodyMd" color={palette.inkSecondary} align="center">{message}</Text>
      {onRetry ? (
        <View style={{ marginTop: spacing.md }}>
          <Button label="Try Again" variant="outline" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}
