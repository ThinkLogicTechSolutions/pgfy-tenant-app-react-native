/** PG browse results — list after home search (city + stay dates). */
import { useMemo, useState } from 'react';
import { View, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius, shadows } from '@/theme';
import { Text, EmptyState, IconButton, Sheet, PressableScale } from '@/components/ui';
import { ListingCard, CraftedFooter } from '@/components/domain';
import {
  BrowseFiltersSheet,
  DEFAULT_BROWSE_FILTERS,
  browseFiltersFromParams,
  matchesBrowseFilters,
  browseFiltersActiveCount,
  type BrowseFilters,
} from '@/components/search';
import { EmptySearch } from '@/components/illustrations';
import { LISTINGS, SORT_OPTIONS } from '@/data';
import { formatDayMonth } from '@/lib/format';
import { listingSupportsBookingMode, getPromotedPgListingId } from '@/lib/listingDisplay';
import { useSaved } from '@/store/saved';

export default function Browse() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    city?: string;
    checkIn?: string;
    checkOut?: string;
    bookingType?: string;
    startTime?: string;
    hours?: string;
  }>();
  const saved = useSaved();

  const city = params.city?.trim() || 'Bengaluru';

  const [sort, setSort] = useState('Relevance');
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<BrowseFilters>(() => browseFiltersFromParams(params));
  const [draftFilters, setDraftFilters] = useState<BrowseFilters>(() => browseFiltersFromParams(params));

  const { bookingType, stay } = filters;
  const { checkIn, checkOut } = stay;

  const promotedPgId = useMemo(() => getPromotedPgListingId(LISTINGS), []);
  const filtersActive = browseFiltersActiveCount(filters) > 0;

  const list = useMemo(() => {
    const filtered = LISTINGS.filter((l) => {
      const loc = `${l.city} ${l.locality} ${l.name}`.toLowerCase();
      const cityMatch = !city || loc.includes(city.toLowerCase());
      const bookingMatch = listingSupportsBookingMode(l, bookingType);
      const filterMatch = matchesBrowseFilters(l, filters);
      return cityMatch && bookingMatch && filterMatch;
    });
    const arr = [...filtered];
    if (sort === 'Price: Low to High') arr.sort((a, b) => a.priceFrom - b.priceFrom);
    else if (sort === 'Price: High to Low') arr.sort((a, b) => b.priceFrom - a.priceFrom);
    else if (sort === 'Rating') arr.sort((a, b) => b.rating - a.rating);
    else if (sort === 'Distance') arr.sort((a, b) => a.distanceKm - b.distanceKm);
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, sort, bookingType, filters]);

  const dateSubtitle = bookingType === 'monthly'
    ? (checkIn ? `Monthly · from ${formatDayMonth(checkIn)}` : undefined)
    : bookingType === 'hourly'
      ? (checkIn ? `Hourly · ${formatDayMonth(checkIn)}` : undefined)
      : (checkIn && checkOut ? `${formatDayMonth(checkIn)} – ${formatDayMonth(checkOut)}` : checkIn ? `From ${formatDayMonth(checkIn)}` : undefined);

  const listingParams = {
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    bookingType,
    startTime: stay.startTime,
    hours: String(stay.hours),
  };

  const openFilters = () => {
    setDraftFilters(filters);
    setFiltersOpen(true);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
      <View style={{ paddingHorizontal: spacing.base, gap: spacing.md, paddingBottom: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <IconButton icon="chevron-back" onPress={() => router.back()} style={{ borderRadius: 21 }} />
          <View style={{ flex: 1 }}>
            <Text variant="h2" numberOfLines={1}>
              {city}
            </Text>
            {dateSubtitle ? (
              <Text variant="bodySm" color={palette.inkSecondary} numberOfLines={1}>
                {dateSubtitle}
              </Text>
            ) : null}
          </View>
          <IconButton icon="notifications-outline" onPress={() => router.push('/notifications')} />
        </View>
      </View>

      <FlatList
        data={list}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] + 48, gap: spacing.md, paddingTop: spacing.sm }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm, gap: spacing.sm }}>
            <Text variant="bodySm" color={palette.inkSecondary} style={{ flex: 1 }}>
              {list.length} properties found
            </Text>
            <PressableScale
              onPress={openFilters}
              haptics={false}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: filtersActive ? palette.navyTint : palette.surface,
                borderWidth: 1,
                borderColor: filtersActive ? palette.navy : palette.border,
                borderRadius: radius.pill,
                paddingVertical: 7,
                paddingHorizontal: 12,
              }}
            >
              <Ionicons name="options-outline" size={15} color={filtersActive ? palette.navy : palette.navy} />
              <Text variant="bodySm" weight="600" color={filtersActive ? palette.navy : palette.ink}>
                Filters{filtersActive ? ` · ${browseFiltersActiveCount(filters)}` : ''}
              </Text>
            </PressableScale>
            <PressableScale
              onPress={() => setSortOpen(true)}
              haptics={false}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: palette.surface,
                borderWidth: 1,
                borderColor: palette.border,
                borderRadius: radius.pill,
                paddingVertical: 7,
                paddingHorizontal: 12,
              }}
            >
              <Ionicons name="swap-vertical" size={15} color={palette.navy} />
              <Text variant="bodySm" weight="600">
                {sort}
              </Text>
            </PressableScale>
          </View>
        }
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            titleFormat="nearLandmark"
            showLocalityInMeta={false}
            promoted={item.id === promotedPgId}
            bookingType={bookingType}
            onPress={() => router.push({
              pathname: `/listing/${item.id}`,
              params: listingParams,
            })}
            saved={saved.isSaved(item.id)}
            onToggleSave={() => saved.toggle(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            illustration={<EmptySearch />}
            title="No properties found"
            message="Try adjusting your filters."
          />
        }
        ListFooterComponent={<CraftedFooter />}
      />

      <PressableScale
        onPress={() => router.push('/map')}
        scaleTo={0.94}
        style={{
          position: 'absolute',
          bottom: spacing.md,
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: palette.navy,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: radius.pill,
          ...shadows.fab,
        }}
      >
        <Ionicons name="map" size={16} color={palette.white} />
        <Text variant="caption" weight="700" color={palette.white}>
          Map
        </Text>
      </PressableScale>

      <Sheet visible={sortOpen} onClose={() => setSortOpen(false)} title="Sort by">
        <View>
          {SORT_OPTIONS.map((s) => (
            <PressableScale
              key={s}
              onPress={() => {
                setSort(s);
                setSortOpen(false);
              }}
              scaleTo={0.98}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md }}
            >
              <Text variant="bodyMd" color={sort === s ? palette.coralDark : palette.ink} weight={sort === s ? '600' : '400'}>
                {s}
              </Text>
              {sort === s ? <Ionicons name="checkmark-circle" size={22} color={palette.coral} /> : null}
            </PressableScale>
          ))}
        </View>
      </Sheet>

      <BrowseFiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        draft={draftFilters}
        onDraftChange={setDraftFilters}
        onApply={() => {
          setFilters(draftFilters);
          setFiltersOpen(false);
        }}
        onClear={() => {
          setDraftFilters(DEFAULT_BROWSE_FILTERS);
          setFilters(DEFAULT_BROWSE_FILTERS);
          setFiltersOpen(false);
        }}
      />
    </View>
  );
}
