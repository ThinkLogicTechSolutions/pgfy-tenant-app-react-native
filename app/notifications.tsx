/** T-S26 — Notifications centre. */
import { useState } from 'react';
import { View, SectionList, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { Text, ScreenHeader, EmptyState, PressableScale, Chip } from '@/components/ui';
import { NotificationRow } from '@/components/domain';
import { EmptyNotifications } from '@/components/illustrations';
import { NOTIFICATIONS, type NotificationItem, type NotificationType } from '@/data';
import { NOW } from '@/lib/format';

const ROUTE_FOR: Record<NotificationType, string> = {
  'Rent Reminder': '/billing',
  'Booking Update': '/(tabs)/stay',
  Announcement: '/(tabs)/stay',
  'Lease Expiry': '/lease',
  'Ticket Update': '/support',
  'Visitor Alert': '/visitors',
};

const FILTERS: Array<'All' | NotificationType> = [
  'All',
  'Rent Reminder',
  'Booking Update',
  'Announcement',
  'Lease Expiry',
  'Ticket Update',
  'Visitor Alert',
];

export default function Notifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState<'All' | NotificationType>('All');

  const markAllRead = () => setItems((p) => p.map((n) => ({ ...n, read: true })));
  const open = (item: NotificationItem) => {
    setItems((p) => p.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    const route = ROUTE_FOR[item.type];
    if (route) router.push(route as any);
  };

  const filteredItems = filter === 'All' ? items : items.filter((n) => n.type === filter);
  const today: NotificationItem[] = [];
  const thisWeek: NotificationItem[] = [];
  const earlier: NotificationItem[] = [];
  filteredItems.forEach((n) => {
    const ts = new Date(n.timestamp);
    const diffDays = Math.floor((NOW.getTime() - ts.getTime()) / 86400000);
    if (ts.toDateString() === NOW.toDateString()) today.push(n);
    else if (diffDays <= 7) thisWeek.push(n);
    else earlier.push(n);
  });
  const sections = [
    { title: 'Today', data: today },
    { title: 'This week', data: thisWeek },
    { title: 'Earlier', data: earlier },
  ].filter((s) => s.data.length);
  const unread = items.filter((n) => !n.read).length;

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'All caught up'}
        right={unread ? (
          <PressableScale onPress={markAllRead} haptics={false} style={{ padding: spacing.sm }}>
            <Text variant="bodySm" weight="600" color={palette.coralDark}>Mark all read</Text>
          </PressableScale>
        ) : undefined}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.base, paddingBottom: spacing.sm }}
      >
        {FILTERS.map((item) => (
          <Chip
            key={item}
            label={item}
            active={filter === item}
            onPress={() => setFilter(item)}
          />
        ))}
      </ScrollView>
      <SectionList
        sections={sections}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] }}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text variant="overline" color={palette.inkTertiary} style={{ marginTop: spacing.base, marginBottom: spacing.xs, marginLeft: 4 }}>{section.title.toUpperCase()}</Text>
        )}
        renderItem={({ item }) => <NotificationRow item={item} onPress={() => open(item)} />}
        ListEmptyComponent={<EmptyState illustration={<EmptyNotifications />} title="No notifications" message="You're all caught up." />}
      />
    </View>
  );
}
