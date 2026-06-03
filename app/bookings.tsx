/** Booking history — current + all past stays. */
import { useMemo, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, SegmentedControl, PressableScale, EmptyState } from '@/components/ui';
import { PastBookingCard, StatusPill } from '@/components/domain';
import { EmptyBookings } from '@/components/illustrations';
import { ACTIVE_BOOKING, PAST_BOOKINGS } from '@/data';
import { inr, formatDate } from '@/lib/format';

export default function Bookings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('all');

  const data = useMemo(() => {
    if (tab === 'past') return PAST_BOOKINGS;
    if (tab === 'cancelled') return PAST_BOOKINGS.filter((b) => b.status === 'Cancelled');
    return PAST_BOOKINGS; // 'all' → past list below the active card
  }, [tab]);

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="My bookings" subtitle={`1 active · ${PAST_BOOKINGS.length} past`} />
      <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.sm }}>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          segments={[
            { key: 'all', label: 'All' },
            { key: 'past', label: 'Past', count: PAST_BOOKINGS.length },
            { key: 'cancelled', label: 'Cancelled', count: PAST_BOOKINGS.filter((b) => b.status === 'Cancelled').length },
          ]}
        />
      </View>

      <FlatList
        data={data}
        keyExtractor={(b) => b.ref}
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'], gap: spacing.md, paddingTop: spacing.sm }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          tab === 'all' ? (
            <View style={{ marginBottom: spacing.xs }}>
              <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>CURRENT STAY</Text>
              <PressableScale onPress={() => router.push(`/booking/${ACTIVE_BOOKING.ref}`)} scaleTo={0.99} style={{ backgroundColor: palette.navy, borderRadius: radius.lg, overflow: 'hidden' }}>
                <View style={{ flexDirection: 'row', padding: spacing.md, gap: spacing.md, alignItems: 'center' }}>
                  <Image source={{ uri: ACTIVE_BOOKING.propertyImage }} style={{ width: 72, height: 72, borderRadius: radius.md }} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
                      <Text variant="bodyMd" weight="700" color={palette.white} numberOfLines={1} style={{ flex: 1 }}>{ACTIVE_BOOKING.propertyName}</Text>
                      <StatusPill status={ACTIVE_BOOKING.stayStatus} small />
                    </View>
                    <Text variant="caption" color="rgba(255,255,255,0.8)" style={{ marginTop: 2 }}>{ACTIVE_BOOKING.locality} · {ACTIVE_BOOKING.roomNumber}/{ACTIVE_BOOKING.bedLabel}</Text>
                    <Text variant="caption" color="rgba(255,255,255,0.8)" style={{ marginTop: 4 }}>Since {formatDate(ACTIVE_BOOKING.checkInDate)} · {inr(ACTIVE_BOOKING.monthlyRent)}/mo</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={palette.white} />
                </View>
              </PressableScale>
              <Text variant="overline" color={palette.inkTertiary} style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>PAST STAYS</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <PastBookingCard booking={item} onPress={() => router.push(`/booking/${item.ref}`)} />}
        ListEmptyComponent={<EmptyState illustration={<EmptyBookings />} title="Nothing here" message="No bookings in this category." />}
      />
    </View>
  );
}
