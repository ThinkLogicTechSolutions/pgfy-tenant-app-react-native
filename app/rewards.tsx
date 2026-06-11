/** Rewards — scratch card grid (PhonePe / GPay style). */
import { useState } from 'react';
import { View, FlatList, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { Text, ScreenHeader } from '@/components/ui';
import { ScratchCardTile, RewardDetailSheet } from '@/components/rewards';
import { useRewards } from '@/store/rewards';

export default function RewardsHub() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { rewards } = useRewards();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? rewards.find((r) => r.id === selectedId) ?? null : null;

  const gap = spacing.md;
  const pad = spacing.base;
  const tileWidth = (width - pad * 2 - gap) / 2;

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader
        title="Rewards"
        subtitle={`${rewards.length} scratch card${rewards.length === 1 ? '' : 's'}`}
      />

      <FlatList
        data={rewards}
        keyExtractor={(r) => r.id}
        numColumns={2}
        columnWrapperStyle={{ gap, paddingHorizontal: pad }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xl,
          paddingTop: spacing.sm,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ScratchCardTile
            reward={item}
            width={tileWidth}
            onPress={() => setSelectedId(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: spacing['3xl'], paddingHorizontal: pad }}>
            <Text variant="bodyMd" weight="600">No scratch cards yet</Text>
            <Text variant="bodySm" color={palette.inkTertiary} align="center" style={{ marginTop: spacing.sm }}>
              Complete a PG booking to earn scratch cards from partner brands.
            </Text>
          </View>
        }
      />

      <RewardDetailSheet
        reward={selected}
        visible={!!selectedId}
        onClose={() => setSelectedId(null)}
      />
    </View>
  );
}
