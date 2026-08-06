/** Full paginated FAQ list — "View all" from the Support & FAQs screen. */
import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, PressableScale, EmptyState, Skeleton } from '@/components/ui';
import { supportApi, errorMessage, type ApiFaq } from '@/lib/api';

const PAGE_SIZE = 20;

export default function Faqs() {
  const insets = useSafeAreaInsets();
  const [faqs, setFaqs] = useState<ApiFaq[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  const loadPage = (skip: number, isRefresh = false) => {
    const setBusy = isRefresh ? setRefreshing : skip === 0 ? setLoading : setLoadingMore;
    setBusy(true);
    if (!isRefresh) setError(null);
    supportApi.listFaqs({ panel: 'TENANT', limit: PAGE_SIZE, skip })
      .then((page) => {
        setFaqs((prev) => (skip === 0 ? page.data : [...prev, ...page.data]));
        setTotal(page.total);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setBusy(false));
  };

  useEffect(() => {
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="FAQs" subtitle="Frequently asked questions" />
      {loading ? (
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm, gap: spacing.sm }}>
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} width="100%" height={56} rounded={radius.lg} />)}
        </View>
      ) : (
        <FlatList
          data={faqs}
          keyExtractor={(f) => String(f.id)}
          contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'], paddingTop: spacing.sm, gap: spacing.sm }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPage(0, true)} tintColor={palette.coral} colors={[palette.coral]} />}
          renderItem={({ item }) => {
            const open = openId === item.id;
            return (
              <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border }}>
                <PressableScale
                  onPress={() => setOpenId(open ? null : item.id)}
                  scaleTo={0.99}
                  haptics={false}
                  style={{ paddingHorizontal: spacing.base, paddingVertical: spacing.base }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <Text variant="bodyMd" weight="600" style={{ flex: 1 }}>{item.question}</Text>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={palette.inkTertiary} />
                  </View>
                </PressableScale>
                {open ? (
                  <View style={{ paddingHorizontal: spacing.base, paddingBottom: spacing.base }}>
                    <Text variant="bodySm" color={palette.inkSecondary} style={{ lineHeight: 21 }}>{item.answer}</Text>
                  </View>
                ) : null}
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title={error ? "Couldn't load FAQs" : 'No FAQs yet'}
              message={error ?? 'Check back later.'}
              actionLabel={error ? 'Retry' : undefined}
              onAction={error ? () => loadPage(0) : undefined}
            />
          }
          ListFooterComponent={loadingMore ? (
            <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
              <ActivityIndicator color={palette.coral} />
            </View>
          ) : null}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!loadingMore && !error && faqs.length < total) loadPage(faqs.length);
          }}
        />
      )}
    </View>
  );
}
