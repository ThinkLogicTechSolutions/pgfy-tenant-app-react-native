/** Rewards — scratch card grid (PhonePe / GPay style). Real `GET /tenant/rewards`,
 *  paginated, pull-to-refresh, shimmer on first load. */
import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { Text, ScreenHeader, Skeleton } from '@/components/ui';
import { ScratchCardTile, ScratchDialog, RewardSheet } from '@/components/rewards';
import { rewardsApi, errorMessage, type ApiReward, type ApiRewardDetail } from '@/lib/api';

const PAGE_SIZE = 20;

export default function RewardsHub() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [items, setItems] = useState<ApiReward[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [scratchingId, setScratchingId] = useState<number | null>(null);
  const [justRevealed, setJustRevealed] = useState<ApiRewardDetail | null>(null);

  const selected = selectedId != null ? items.find((r) => r.id === selectedId) ?? null : null;
  const scratching = scratchingId != null ? items.find((r) => r.id === scratchingId) ?? null : null;

  const loadPage = (skip: number, isRefresh = false) => {
    const setBusy = isRefresh ? setRefreshing : skip === 0 ? setLoading : setLoadingMore;
    setBusy(true);
    setError(null);
    rewardsApi.listRewards({ limit: PAGE_SIZE, skip })
      .then((page) => {
        setItems((prev) => (skip === 0 ? page.data : [...prev, ...page.data]));
        setTotal(page.total);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setBusy(false));
  };

  useEffect(() => {
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdated = (updated: ApiRewardDetail) => {
    setItems((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
  };

  const openTile = (item: ApiReward) => {
    if (item.is_expired) return;
    if (item.status === 'LOCKED') {
      setScratchingId(item.id);
    } else {
      setJustRevealed(null);
      setSelectedId(item.id);
    }
  };

  const handleRevealed = (detail: ApiRewardDetail) => {
    handleUpdated(detail);
    setScratchingId(null);
    setJustRevealed(detail);
    setSelectedId(detail.id);
  };

  const gap = spacing.md;
  const pad = spacing.base;
  const tileWidth = (width - pad * 2 - gap) / 2;

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader
        title="Rewards"
        subtitle={loading ? undefined : `${total} scratch card${total === 1 ? '' : 's'}`}
      />

      {loading ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, paddingHorizontal: pad, paddingTop: spacing.sm }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width={tileWidth} height={tileWidth * 1.2} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(r) => String(r.id)}
          numColumns={2}
          columnWrapperStyle={{ gap, paddingHorizontal: pad }}
          contentContainerStyle={{
            paddingBottom: insets.bottom + spacing.xl,
            paddingTop: spacing.sm,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPage(0, true)} tintColor={palette.coral} colors={[palette.coral]} />}
          renderItem={({ item }) => (
            <ScratchCardTile
              reward={item}
              width={tileWidth}
              onPress={item.is_expired ? undefined : () => openTile(item)}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: spacing['3xl'], paddingHorizontal: pad }}>
              <Text variant="bodyMd" weight="600">{error ? "Couldn't load rewards" : 'No scratch cards yet'}</Text>
              <Text variant="bodySm" color={palette.inkTertiary} align="center" style={{ marginTop: spacing.sm }}>
                {error ?? 'Complete a PG booking to earn scratch cards from partner brands.'}
              </Text>
            </View>
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!loadingMore && !refreshing && !error && items.length < total) loadPage(items.length);
          }}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
                <ActivityIndicator color={palette.coral} />
              </View>
            ) : null
          }
        />
      )}

      <ScratchDialog
        reward={scratching}
        visible={!!scratchingId}
        onClose={() => setScratchingId(null)}
        onRevealed={handleRevealed}
      />

      <RewardSheet
        reward={selected}
        visible={!!selectedId}
        initialDetail={justRevealed}
        onClose={() => { setSelectedId(null); setJustRevealed(null); }}
        onUpdated={handleUpdated}
      />
    </View>
  );
}
