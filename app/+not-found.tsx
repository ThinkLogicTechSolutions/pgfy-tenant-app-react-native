import { View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { palette, spacing } from '@/theme';
import { Text } from '@/components/ui';
import { EmptyGeneric } from '@/components/illustrations';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: palette.bg }}>
        <EmptyGeneric />
        <Text variant="h2" style={{ marginTop: spacing.lg }}>Page not found</Text>
        <Link href="/(tabs)" style={{ marginTop: spacing.base }}>
          <Text variant="bodyMd" weight="600" color={palette.coralDark}>Go home</Text>
        </Link>
      </View>
    </>
  );
}
