/** Booking history — all stays with date & status filters in a sheet. */
import { useMemo, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import {
  Text, ScreenHeader, PressableScale, EmptyState, Sheet, Chip, AnimatedListItem, DateRangePicker,
} from '@/components/ui';
import { PastBookingCard, StatusPill } from '@/components/domain';
import { EmptyBookings } from '@/components/illustrations';
import {
  getAllTenantBookings,
  bookingListStatus,
  bookingCheckInDate,
  type TenantBookingItem,
} from '@/data';
import { useBookingCancellations } from '@/store/bookingCancellations';
import { inr, formatDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { defaultDateRange, type DateRangeValue } from '@/lib/dateRange';

type StatusFilter = 'all' | 'Active' | 'Completed' | 'Moved Out' | 'Cancelled';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All statuses' },
  { key: 'Active', label: 'Active' },
  { key: 'Completed', label: 'Completed' },
  { key: 'Moved Out', label: 'Moved out' },
  { key: 'Cancelled', label: 'Cancelled' },
];

function matchesStatusFilter(status: string, filter: StatusFilter): boolean {
  if (filter === 'all') return true;
  return status === filter;
}

export default function Bookings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cancelStore = useBookingCancellations();
  const allBookings = useMemo(() => getAllTenantBookings(), []);

  const [range, setRange] = useState<DateRangeValue>(defaultDateRange);
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const statusFilterActive = statusFilter !== 'all';

  // A booking cancelled this session reads as "Cancelled" everywhere, overriding its stored status.
  const effectiveStatus = (item: TenantBookingItem) =>
    item.kind === 'active' && cancelStore.isCancelled(item.booking.ref) ? 'Cancelled' : bookingListStatus(item);

  const filtered = allBookings.filter((item) => {
    const checkIn = bookingCheckInDate(item);
    return checkIn >= range.from && checkIn <= range.to && matchesStatusFilter(effectiveStatus(item), statusFilter);
  });

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader
        title="Booking history"
        subtitle={`${filtered.length} of ${allBookings.length} bookings`}
        right={
          <PressableScale onPress={() => setStatusFilterOpen(true)} scaleTo={0.92}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: statusFilterActive ? palette.navyTint : palette.surface,
                borderWidth: 1,
                borderColor: statusFilterActive ? palette.navy : palette.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="options-outline" size={20} color={statusFilterActive ? palette.navy : palette.ink} />
              {statusFilterActive ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: palette.coral,
                  }}
                />
              ) : null}
            </View>
          </PressableScale>
        }
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.base, marginBottom: spacing.sm }}>
        <DateRangePicker value={range} onChange={setRange} />
        {statusFilter !== 'all' ? (
          <Chip
            label={STATUS_FILTERS.find((f) => f.key === statusFilter)?.label ?? statusFilter}
            active
            onPress={() => setStatusFilterOpen(true)}
          />
        ) : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.booking.ref}
        contentContainerStyle={{
          paddingHorizontal: spacing.base,
          paddingBottom: spacing['3xl'],
          gap: spacing.md,
          paddingTop: spacing.sm,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            {item.kind === 'active'
              ? <ActiveBookingCard item={item} status={effectiveStatus(item)} onPress={() => router.push(`/booking/${item.booking.ref}`)} />
              : <PastBookingCard booking={item.booking} onPress={() => router.push(`/booking/${item.booking.ref}`)} />}
          </AnimatedListItem>
        )}
        ListEmptyComponent={
          <EmptyState
            illustration={<EmptyBookings />}
            title="No bookings found"
            message="Try adjusting your date or status filters."
          />
        }
      />

      <Sheet visible={statusFilterOpen} onClose={() => setStatusFilterOpen(false)} title="Filter by status">
        <View style={{ gap: spacing.xs }}>
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.key;
            return (
              <PressableScale
                key={f.key}
                onPress={() => { setStatusFilter(f.key); setStatusFilterOpen(false); haptic.select(); }}
                scaleTo={0.98}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing.base,
                  backgroundColor: active ? palette.navyTint : palette.surfaceRaised,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: active ? palette.navy : 'transparent',
                }}
              >
                <Text variant="bodyMd" weight={active ? '700' : '500'} color={active ? palette.navy : palette.ink}>
                  {f.label}
                </Text>
                {active ? <Ionicons name="checkmark-circle" size={20} color={palette.navy} /> : null}
              </PressableScale>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}

function ActiveBookingCard({ item, status, onPress }: { item: TenantBookingItem & { kind: 'active' }; status?: string; onPress?: () => void }) {
  const b = item.booking;
  return (
    <PressableScale onPress={onPress} scaleTo={0.99} style={{ backgroundColor: palette.navy, borderRadius: radius.lg, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', padding: spacing.md, gap: spacing.md, alignItems: 'center' }}>
        <Image source={{ uri: b.propertyImage }} style={{ width: 72, height: 72, borderRadius: radius.md }} contentFit="cover" />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
            <Text variant="bodyMd" weight="700" color={palette.white} numberOfLines={1} style={{ flex: 1 }}>
              {b.propertyName}
            </Text>
            <StatusPill status={status ?? b.status} small />
          </View>
          <Text variant="caption" color="rgba(255,255,255,0.8)" style={{ marginTop: 2 }}>
            {b.locality} · {b.roomNumber}/{b.bedLabel}
          </Text>
          <Text variant="caption" color="rgba(255,255,255,0.8)" style={{ marginTop: 4 }}>
            Since {formatDate(b.checkInDate)} · {b.bookingMode === 'hourly'
              ? `${inr(b.ratePerHour ?? 0)}/hr`
              : b.bookingMode === 'daily'
                ? `${inr(b.ratePerDay ?? 0)}/day`
                : `${inr(b.monthlyRent)}/mo`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={palette.white} />
      </View>
    </PressableScale>
  );
}
