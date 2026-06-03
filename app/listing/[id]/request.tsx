/** T-S (2.3) — "Request This Property" lead workflow for unverified listings. */
import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { Text, ScreenHeader, Card, Input, Button, EmptyState } from '@/components/ui';
import { SuccessBurst } from '@/components/illustrations';
import { getListing } from '@/data';
import { haptic } from '@/lib/haptics';

export default function RequestProperty() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listing = getListing(String(id));
  const [done, setDone] = useState(false);

  if (!listing) return <View style={{ flex: 1, paddingTop: insets.top + 60 }}><EmptyState title="Not found" /></View>;

  if (done) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <SuccessBurst size={170} />
        <Text variant="h1" align="center" style={{ marginTop: spacing.lg }}>Request sent!</Text>
        <Text variant="bodyLg" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.sm, maxWidth: 300 }}>
          Our team will onboard & verify {listing.name} and notify you when it's bookable.
        </Text>
        <Button label="Back to listing" onPress={() => router.back()} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Request this property" subtitle={listing.name} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing.xl, gap: spacing.base }} showsVerticalScrollIndicator={false}>
        <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
          <Text variant="h3">🔎</Text>
          <Text variant="bodySm" color={palette.inkSecondary} style={{ flex: 1, lineHeight: 20 }}>
            This property isn't on PGfy yet. Tell us you're interested — we'll reach out to the owner, verify the property and let you book it.
          </Text>
        </Card>
        <Input label="Your name" icon="person-outline" value="Aarav Sharma" />
        <Input label="Mobile number" icon="call-outline" value="+91 98765 43210" keyboardType="number-pad" />
        <Input label="Preferred sharing" icon="bed-outline" placeholder="e.g. Single / Double" />
        <Input label="Message (optional)" placeholder="Anything specific you're looking for?" multiline style={{ height: 90, textAlignVertical: 'top' }} />
        <Button label="Send request" icon="paper-plane-outline" onPress={() => { haptic.success(); setDone(true); }} full size="lg" style={{ marginTop: spacing.sm }} />
      </ScrollView>
    </View>
  );
}
