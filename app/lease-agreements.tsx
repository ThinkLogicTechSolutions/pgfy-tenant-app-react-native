/** Lease agreements — real `GET /tenant/lease-agreements` list, searchable by property name
 * with ALL / PENDING_TENANT / SIGNED status filters. */
import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Input, Chip, PressableScale, EmptyState, Badge, Skeleton, AnimatedListItem, Sheet, Button } from '@/components/ui';
import { EmptyGeneric } from '@/components/illustrations';
import { leaseApi, errorMessage, type LeaseAgreement, type LeaseAgreementStatusFilter } from '@/lib/api';
import { leaseStatusLabel, leaseStatusTone } from '@/lib/leaseDisplay';
import { formatDate } from '@/lib/format';

const PAGE_SIZE = 10;

const STATUS_FILTERS: { key: LeaseAgreementStatusFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING_TENANT', label: 'Pending signature' },
  { key: 'SIGNED', label: 'Signed' },
];

export default function LeaseAgreements() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LeaseAgreementStatusFilter>('ALL');
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<LeaseAgreementStatusFilter>('ALL');

  const [leases, setLeases] = useState<LeaseAgreement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce free-text search before it hits the API.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadPage = (skip: number) => {
    const setBusy = skip === 0 ? setLoading : setLoadingMore;
    setBusy(true);
    setError(null);
    leaseApi.listLeaseAgreements({ limit: PAGE_SIZE, skip, search, status })
      .then((page) => {
        setLeases((prev) => (skip === 0 ? page.data : [...prev, ...page.data]));
        setTotal(page.total);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setBusy(false));
  };

  useEffect(() => {
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const filterActive = status !== 'ALL';

  const openFilter = () => {
    setDraftStatus(status);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setStatus(draftStatus);
    setFilterOpen(false);
  };

  const clearFilter = () => {
    setDraftStatus('ALL');
    setStatus('ALL');
    setFilterOpen(false);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader
        title="Lease agreements"
        right={
          <PressableScale onPress={openFilter} scaleTo={0.92}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: filterActive ? palette.navyTint : palette.surface,
                borderWidth: 1,
                borderColor: filterActive ? palette.navy : palette.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="options-outline" size={20} color={filterActive ? palette.navy : palette.ink} />
              {filterActive ? (
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

      <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.sm }}>
        <Input
          icon="search"
          placeholder="Search by property name"
          value={searchInput}
          onChangeText={setSearchInput}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width="100%" height={104} rounded={radius.lg} />
          ))}
        </View>
      ) : (
        <FlatList
          data={leases}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: spacing.base,
            paddingBottom: spacing['3xl'],
            gap: spacing.md,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <LeaseCard lease={item} onPress={() => router.push({ pathname: '/lease', params: { id: String(item.id) } })} />
            </AnimatedListItem>
          )}
          ListEmptyComponent={
            <EmptyState
              illustration={<EmptyGeneric />}
              title={error ? "Couldn't load lease agreements" : 'No lease agreements found'}
              message={error ?? (search || filterActive ? 'Try a different search or filter.' : "You don't have any lease agreements yet.")}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!loadingMore && !error && leases.length < total) loadPage(leases.length);
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

      <Sheet visible={filterOpen} onClose={() => setFilterOpen(false)} title="Filter">
        <View style={{ gap: spacing.lg }}>
          <View>
            <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>
              STATUS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {STATUS_FILTERS.map((f) => (
                <Chip key={f.key} label={f.label} active={draftStatus === f.key} onPress={() => setDraftStatus(f.key)} />
              ))}
            </View>
          </View>

          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            <Button label="Apply filter" full size="lg" onPress={applyFilter} />
            <Button label="Clear all" variant="ghost" full onPress={clearFilter} />
          </View>
        </View>
      </Sheet>
    </View>
  );
}

function LeaseCard({ lease, onPress }: { lease: LeaseAgreement; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.99}
      style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.base }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
        <Text variant="bodyMd" weight="700" numberOfLines={1} style={{ flex: 1 }}>{lease.property.name}</Text>
        <Badge label={leaseStatusLabel(lease.status)} tone={leaseStatusTone(lease.status)} small />
      </View>
      <Text variant="caption" color={palette.inkTertiary} numberOfLines={1} style={{ marginTop: 2 }}>
        {lease.room && lease.bed ? `Room ${lease.room.room_number} · Bed ${lease.bed.bed_number} · ` : ''}{lease.booking.code}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm }}>
        <Ionicons name="calendar-outline" size={14} color={palette.inkSecondary} />
        <Text variant="caption" color={palette.inkSecondary}>
          {formatDate(lease.lease_start_date)} – {formatDate(lease.lease_end_date)}
        </Text>
      </View>
    </PressableScale>
  );
}
