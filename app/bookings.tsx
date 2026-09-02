/** Booking history — real `/tenant/booking` list with date & status filters in a sheet. */
import { useEffect, useMemo, useState } from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import {
  Text, ScreenHeader, PressableScale, EmptyState, Sheet, Chip, Button, Divider, AnimatedListItem, Badge, Skeleton,
} from '@/components/ui';
import { EmptyBookings } from '@/components/illustrations';
import { bookingApi, errorMessage, type ApiBooking } from '@/lib/api';
import { bookingStatusLabel, bookingStatusTone, bookingModeLabel, bookingCoverImage, isActiveBookingStatus, isUnitBooking } from '@/lib/bookingDisplay';
import { isUnitPropertyType } from '@/lib/listingAdapter';
import { toLocalIso } from '@/lib/dates';
import { inr, formatDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';

type DateFilter = 'all' | '3m' | '6m' | '12m' | '2026' | '2025' | '2024';

const PAGE_SIZE = 10;

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: '3m', label: 'Last 3 months' },
  { key: '6m', label: 'Last 6 months' },
  { key: '12m', label: 'Last 12 months' },
  { key: '2026', label: '2026' },
  { key: '2025', label: '2025' },
  { key: '2024', label: '2024' },
];

function monthsAgoIso(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return toLocalIso(d);
}

function matchesDateFilter(checkIn: string, filter: DateFilter): boolean {
  if (filter === 'all') return true;
  const iso = checkIn.slice(0, 10);
  if (filter === '3m') return iso >= monthsAgoIso(3);
  if (filter === '6m') return iso >= monthsAgoIso(6);
  if (filter === '12m') return iso >= monthsAgoIso(12);
  return iso.startsWith(filter);
}

export default function Bookings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = (skip: number) => {
    const setBusy = skip === 0 ? setLoading : setLoadingMore;
    setBusy(true);
    setError(null);
    bookingApi.listBookings({ limit: PAGE_SIZE, skip })
      .then((page) => {
        setBookings((prev) => (skip === 0 ? page.data : [...prev, ...page.data]));
        setTotal(page.total);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setBusy(false));
  };

  useEffect(() => {
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [draftDate, setDraftDate] = useState<DateFilter>('all');
  const [draftStatus, setDraftStatus] = useState<string>('all');

  const statusOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const b of bookings) seen.set(b.status, bookingStatusLabel(b.status));
    return [{ key: 'all', label: 'All statuses' }, ...Array.from(seen, ([key, label]) => ({ key, label }))];
  }, [bookings]);

  const filtersActive = dateFilter !== 'all' || statusFilter !== 'all';

  const filtered = bookings.filter((b) => (
    matchesDateFilter(b.check_in_date, dateFilter) && (statusFilter === 'all' || b.status === statusFilter)
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
        subtitle={loading ? undefined : `${filtered.length} of ${bookings.length} bookings`}
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
              label={statusOptions.find((f) => f.key === statusFilter)?.label ?? statusFilter}
              active
              onPress={openFilters}
            />
          ) : null}
        </View>
      ) : null}

      {loading ? (
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.md, flexDirection: 'row', gap: spacing.md }}>
              <Skeleton width={72} height={72} rounded={radius.md} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="65%" height={16} />
                <Skeleton width="45%" height={12} />
                <Skeleton width="55%" height={12} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
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
              {isActiveBookingStatus(item.status)
                ? <BookingCard booking={item} onPress={() => router.push(`/booking/${item.id}`)} />
                : <PastBookingCardApi booking={item} onPress={() => router.push(`/booking/${item.id}`)} />}
            </AnimatedListItem>
          )}
          ListEmptyComponent={
            <EmptyState
              illustration={<EmptyBookings />}
              title={error ? "Couldn't load bookings" : 'No bookings found'}
              message={error ?? 'Try adjusting your date or status filters.'}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!loadingMore && !error && bookings.length < total) loadPage(bookings.length);
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
              {statusOptions.map((f) => (
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

function BookingCard({ booking: b, onPress }: { booking: ApiBooking; onPress?: () => void }) {
  const rateSuffix = b.booking_mode === 'HOURLY' ? '/hr' : b.booking_mode === 'DAILY' ? '/day' : '/mo';
  return (
    <PressableScale onPress={onPress} scaleTo={0.99} style={{ backgroundColor: palette.navy, borderRadius: radius.lg, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', padding: spacing.md, gap: spacing.md, alignItems: 'center' }}>
        <Image source={{ uri: bookingCoverImage(b.property) }} style={{ width: 72, height: 72, borderRadius: radius.md }} contentFit="cover" />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
            <Text variant="bodyMd" weight="700" color={palette.white} numberOfLines={1} style={{ flex: 1 }}>
              {b.property.name}
            </Text>
            <Badge label={bookingStatusLabel(b.status)} tone={bookingStatusTone(b.status)} small />
          </View>
          <Text variant="caption" color="rgba(255,255,255,0.8)" style={{ marginTop: 2 }}>
            {isUnitBooking(b) || isUnitPropertyType(b.property) ? b.property.locality : `${b.property.locality} · ${b.room_number}/${b.bed_number}`}
          </Text>
          <Text variant="caption" color="rgba(255,255,255,0.8)" style={{ marginTop: 4 }}>
            {bookingModeLabel(b.booking_mode)} · {inr(b.base_rent)}{rateSuffix} · Since {formatDate(b.check_in_date)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={palette.white} />
      </View>
    </PressableScale>
  );
}

/** Closed-out bookings (rejected/expired/cancelled/completed/checked-out) — a plain
 * history-card treatment, distinct from the highlighted active-stay card above. */
function PastBookingCardApi({ booking: b, onPress }: { booking: ApiBooking; onPress?: () => void }) {
  const rateSuffix = b.booking_mode === 'HOURLY' ? '/hr' : b.booking_mode === 'DAILY' ? '/day' : '/mo';
  const dimmed = b.status === 'CANCELLED' || b.status === 'REJECTED' || b.status === 'EXPIRED';
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.99}
      style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' }}
    >
      <View style={{ flexDirection: 'row', padding: spacing.md, gap: spacing.md, alignItems: 'center' }}>
        <Image
          source={{ uri: bookingCoverImage(b.property) }}
          style={{ width: 72, height: 72, borderRadius: radius.md, opacity: dimmed ? 0.55 : 1 }}
          contentFit="cover"
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
            <Text variant="bodyMd" weight="700" numberOfLines={1} style={{ flex: 1 }}>{b.property.name}</Text>
            <Badge label={bookingStatusLabel(b.status)} tone={bookingStatusTone(b.status)} small />
          </View>
          <Text variant="caption" color={palette.inkTertiary} numberOfLines={1} style={{ marginTop: 2 }}>
            {isUnitBooking(b) || isUnitPropertyType(b.property) ? b.property.locality : `${b.property.locality} · ${b.room_number}/${b.bed_number}`}
          </Text>
          <Text variant="caption" color={palette.inkSecondary} style={{ marginTop: 4 }}>
            {bookingModeLabel(b.booking_mode)} · {inr(b.base_rent)}{rateSuffix} · {formatDate(b.check_in_date)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={palette.inkTertiary} />
      </View>
    </PressableScale>
  );
}
