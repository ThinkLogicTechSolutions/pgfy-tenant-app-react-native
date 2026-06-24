/** Booking history — all stays with date & status filters in a sheet. */
import { useMemo, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import {
  Text, ScreenHeader, PressableScale, EmptyState, Sheet, Chip, Button, Divider, AnimatedListItem,
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

type DateFilter = 'all' | '3m' | '6m' | '12m' | '2026' | '2025' | '2024';
type StatusFilter = 'all' | 'Active' | 'Completed' | 'Moved Out' | 'Cancelled';

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: '3m', label: 'Last 3 months' },
  { key: '6m', label: 'Last 6 months' },
  { key: '12m', label: 'Last 12 months' },
  { key: '2026', label: '2026' },
  { key: '2025', label: '2025' },
  { key: '2024', label: '2024' },
];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All statuses' },
  { key: 'Active', label: 'Active' },
  { key: 'Completed', label: 'Completed' },
  { key: 'Moved Out', label: 'Moved out' },
  { key: 'Cancelled', label: 'Cancelled' },
];

function monthsAgoIso(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

function matchesDateFilter(checkIn: string, filter: DateFilter): boolean {
  if (filter === 'all') return true;
  if (filter === '3m') return checkIn >= monthsAgoIso(3);
  if (filter === '6m') return checkIn >= monthsAgoIso(6);
  if (filter === '12m') return checkIn >= monthsAgoIso(12);
  return checkIn.startsWith(filter);
}

function matchesStatusFilter(status: string, filter: StatusFilter): boolean {
  if (filter === 'all') return true;
  return status === filter;
}

export default function Bookings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cancelStore = useBookingCancellations();
  const allBookings = useMemo(() => getAllTenantBookings(), []);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [draftDate, setDraftDate] = useState<DateFilter>('all');
  const [draftStatus, setDraftStatus] = useState<StatusFilter>('all');

  const filtersActive = dateFilter !== 'all' || statusFilter !== 'all';

  // A booking cancelled this session reads as "Cancelled" everywhere, overriding its stored status.
  const effectiveStatus = (item: TenantBookingItem) =>
    item.kind === 'active' && cancelStore.isCancelled(item.booking.ref) ? 'Cancelled' : bookingListStatus(item);

  const filtered = allBookings.filter((item) => (
    matchesDateFilter(bookingCheckInDate(item), dateFilter) && matchesStatusFilter(effectiveStatus(item), statusFilter)
  ));

  const openFilters = () => {
    setDraftDate(dateFilter);
    setDraftStatus(statusFilter);
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    haptic.select();
    setDateFilter(draftDate);
    setStatusFilter(draftStatus);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setDraftDate('all');
    setDraftStatus('all');
    setDateFilter('all');
    setStatusFilter('all');
    setFiltersOpen(false);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader
        title="Booking history"
        subtitle={`${filtered.length} of ${allBookings.length} bookings`}
        right={
          <PressableScale onPress={openFilters} scaleTo={0.92}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: filtersActive ? palette.navyTint : palette.surface,
                borderWidth: 1,
                borderColor: filtersActive ? palette.navy : palette.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="options-outline" size={20} color={filtersActive ? palette.navy : palette.ink} />
              {filtersActive ? (
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

      {filtersActive ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.base, marginBottom: spacing.sm }}>
          {dateFilter !== 'all' ? (
            <Chip
              label={DATE_FILTERS.find((f) => f.key === dateFilter)?.label ?? dateFilter}
              active
              onPress={openFilters}
            />
          ) : null}
          {statusFilter !== 'all' ? (
            <Chip
              label={STATUS_FILTERS.find((f) => f.key === statusFilter)?.label ?? statusFilter}
              active
              onPress={openFilters}
            />
          ) : null}
        </View>
      ) : null}

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

      <Sheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" scroll>
        <View style={{ gap: spacing.lg }}>
          <View>
            <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>
              DATE
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {DATE_FILTERS.map((f) => (
                <Chip
                  key={f.key}
                  label={f.label}
                  active={draftDate === f.key}
                  onPress={() => setDraftDate(f.key)}
                />
              ))}
            </View>
          </View>

          <Divider />

          <View>
            <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>
              BOOKING STATUS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {STATUS_FILTERS.map((f) => (
                <Chip
                  key={f.key}
                  label={f.label}
                  active={draftStatus === f.key}
                  onPress={() => setDraftStatus(f.key)}
                />
              ))}
            </View>
          </View>

          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            <Button label="Apply filters" full size="lg" onPress={applyFilters} />
            <Button label="Clear all" variant="ghost" full onPress={clearFilters} />
          </View>
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
