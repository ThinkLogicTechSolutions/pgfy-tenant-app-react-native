/** T-S26 — Notifications centre. Real `GET/PATCH /notification-management/tenant-notification`. */
import { useEffect, useState } from 'react';
import { View, SectionList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, EmptyState, PressableScale, Skeleton } from '@/components/ui';
import { NotificationRow } from '@/components/domain';
import { EmptyNotifications } from '@/components/illustrations';
import { notificationsApi, errorMessage, type ApiTenantNotification } from '@/lib/api';
import { resolveNotificationRoute } from '@/lib/notificationDisplay';

const PAGE_SIZE = 20;

export default function Notifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<ApiTenantNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadPage = (skip: number, isRefresh = false) => {
    const setBusy = isRefresh ? setRefreshing : skip === 0 ? setLoading : setLoadingMore;
    setBusy(true);
    if (!isRefresh) setError(null);
    notificationsApi.listNotifications({ limit: PAGE_SIZE, skip })
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

  const unread = items.filter((n) => n.status === 'UNSEEN').length;

  const markAllRead = () => {
    if (markingAll || !unread) return;
    setMarkingAll(true);
    const prev = items;
    setItems((p) => p.map((n) => (n.status === 'UNSEEN' ? { ...n, status: 'SEEN' } : n)));
    notificationsApi.markAllNotificationsSeen()
      .catch(() => setItems(prev))
      .finally(() => setMarkingAll(false));
  };

  const open = (item: ApiTenantNotification) => {
    if (item.status === 'UNSEEN') {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, status: 'SEEN' } : n)));
      notificationsApi.markNotificationSeen(item.id).catch(() => {});
    }
    const route = resolveNotificationRoute(item);
    if (route) router.push(route as never);
  };

  const now = Date.now();
  const today: ApiTenantNotification[] = [];
  const thisWeek: ApiTenantNotification[] = [];
  const earlier: ApiTenantNotification[] = [];
  items.forEach((n) => {
    const ts = new Date(n.created_at);
    const diffDays = Math.floor((now - ts.getTime()) / 86400000);
    if (ts.toDateString() === new Date(now).toDateString()) today.push(n);
    else if (diffDays <= 7) thisWeek.push(n);
    else earlier.push(n);
  });
  const sections = [
    { title: 'Today', data: today },
    { title: 'This week', data: thisWeek },
    { title: 'Earlier', data: earlier },
  ].filter((s) => s.data.length);

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader
        title="Notifications"
        subtitle={loading ? undefined : unread ? `${unread} unread` : 'All caught up'}
        right={unread ? (
          <PressableScale onPress={markAllRead} haptics={false} style={{ padding: spacing.sm }}>
            <Text variant="bodySm" weight="600" color={palette.coralDark}>Mark all read</Text>
          </PressableScale>
        ) : undefined}
      />
      {loading ? (
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm, gap: spacing.md }}>
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={64} rounded={radius.lg} />)}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(n) => String(n.id)}
          contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPage(0, true)} tintColor={palette.coral} colors={[palette.coral]} />}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text variant="overline" color={palette.inkTertiary} style={{ marginTop: spacing.base, marginBottom: spacing.xs, marginLeft: 4 }}>{section.title.toUpperCase()}</Text>
          )}
          renderItem={({ item }) => (
            <NotificationRow item={item} onPress={() => open(item)} />
          )}
          ListEmptyComponent={
            <EmptyState
              illustration={<EmptyNotifications />}
              title={error ? "Couldn't load notifications" : 'No notifications'}
              message={error ?? "You're all caught up."}
              actionLabel={error ? 'Retry' : undefined}
              onAction={error ? () => loadPage(0) : undefined}
            />
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
    </View>
  );
}
