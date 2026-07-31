/** Universal Link / Android App Link landing route for
 *  `https://share.pgfy.in/property/<property_id>` — a native iOS Universal Link / Android
 *  App Link (not a Firebase Dynamic Link), resolved straight to this file route by
 *  expo-router once the domain is verified (see `app.json`'s `ios.associatedDomains` /
 *  `android.intentFilters`). Immediately redirects to the existing property details screen,
 *  which itself calls `GET /tenant/properties/:id` with this property id. */
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { Text, ScreenHeader, Button } from '@/components/ui';

export default function PropertyLink() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const propertyId = Number(id);
  const valid = Number.isFinite(propertyId) && propertyId > 0;

  useEffect(() => {
    // `replace` (not `push`) — the link landing shouldn't leave a dead entry in history.
    if (valid) router.replace(`/listing/api-${propertyId}`);
  }, [valid, propertyId, router]);

  if (!valid) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + spacing.sm }}>
        <ScreenHeader title="Property link" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl }}>
          <Text variant="h3" align="center">This link isn&apos;t valid</Text>
          <Text variant="body" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.sm }}>
            We couldn&apos;t find a property for this link.
          </Text>
          <Button label="Browse properties" onPress={() => router.replace('/(tabs)')} style={{ marginTop: spacing.xl }} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={palette.coral} />
    </View>
  );
}
