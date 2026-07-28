/** PG browse results — list after home search (city + stay dates). */
import { useEffect, useMemo, useState } from 'react';
import { View, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius, shadows } from '@/theme';
import { Text, EmptyState, IconButton, PressableScale } from '@/components/ui';
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
import { Skeleton } from '@/components/ui';
import { LISTINGS } from '@/data';
import type { Listing } from '@/data/types';
import { formatDayMonth } from '@/lib/format';
import { listingSupportsBookingMode, getPromotedPgListingId } from '@/lib/listingDisplay';
import { apiPropertyToListing, searchPropertyToListing } from '@/lib/listingAdapter';
import { propertyApi, searchApi, errorMessage } from '@/lib/api';
import { useMasterData } from '@/context/MasterDataContext';
import { useSaved } from '@/store/saved';
import { setMapResults } from '@/store/mapResults';

export default function Browse() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    city?: string;
    cityId?: string;
    localityId?: string;
    checkIn?: string;
    checkOut?: string;
    bookingType?: string;
    startTime?: string;
    hours?: string;
    search?: string;
    gender?: string;
    food?: string;
    acType?: string;
    amenities?: string;
    minRating?: string;
    priceMin?: string;
    priceMax?: string;
    distanceMax?: string;
    propertyTypes?: string;
    roommateType?: string;
    smoking?: string;
    alcohol?: string;
    sleep?: string;
    diet?: string;
  }>();
  const saved = useSaved();
  const { cities, localities } = useMasterData();

  const city = params.city?.trim() || 'Bengaluru';
  const cityId = params.cityId ? Number(params.cityId) : undefined;
  const localityId = params.localityId ? Number(params.localityId) : undefined;
  const searchQuery = params.search?.trim() || undefined;

  // The filter sheet is applied on Home (or here) before landing on this list — never
  // auto-opened by a route param, so arriving here always shows results first.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<BrowseFilters>(() => browseFiltersFromParams(params));
  const [draftFilters, setDraftFilters] = useState<BrowseFilters>(() => browseFiltersFromParams(params));

  const { bookingType, stay } = filters;
  const { checkIn, checkOut } = stay;

  // A resolved operational location fetches real listings; otherwise fall back to the mock
  // catalogue (curated destination tiles / exploratory browsing without a matched location).
  const [liveListings, setLiveListings] = useState<Listing[] | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    if (!cityId && !searchQuery) {
      setLiveListings(null);
      return;
    }
    let active = true;
    setLiveLoading(true);
    setLiveError(null);
    const fetchListings = searchQuery
      ? searchApi.searchProperties(searchQuery).then((res) => res.properties.map(searchPropertyToListing))
      : propertyApi.searchProperties({ cityId, localityId }).then((page) => {
          const cityName = cities.find((c) => c.id === cityId)?.name ?? city;
          const localityName = localities.find((l) => l.id === localityId)?.name ?? '';
          return page.data.map((p) => apiPropertyToListing(p, { cityName, localityName }));
        });
    fetchListings
      .then((mapped) => {
        if (active) setLiveListings(mapped);
      })
      .catch((e) => {
        if (!active) return;
        setLiveError(errorMessage(e));
        setLiveListings([]);
      })
      .finally(() => {
        if (active) setLiveLoading(false);
      });
    return () => {
      active = false;
    };
  }, [cityId, localityId, cities, localities, city, searchQuery]);

  const baseListings = liveListings ?? LISTINGS;

  const promotedPgId = useMemo(() => getPromotedPgListingId(baseListings), [baseListings]);
  const filtersActive = browseFiltersActiveCount(filters) > 0;

  const list = useMemo(() => {
    return baseListings.filter((l) => {
      const loc = `${l.city} ${l.locality} ${l.name}`.toLowerCase();
      const cityMatch = liveListings ? true : !city || loc.includes(city.toLowerCase());
      const bookingMatch = listingSupportsBookingMode(l, bookingType);
      const filterMatch = matchesBrowseFilters(l, filters);
      return cityMatch && bookingMatch && filterMatch;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseListings, liveListings, city, bookingType, filters]);

  useEffect(() => {
    setMapResults(list);
  }, [list]);

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
              {searchQuery ? `Results for "${searchQuery}"` : city}
            </Text>
            {searchQuery ? (
              <Text variant="bodySm" color={palette.inkSecondary} numberOfLines={1}>
                {liveLoading ? 'Searching…' : `${list.length} ${list.length === 1 ? 'match' : 'matches'}`}
              </Text>
            ) : dateSubtitle ? (
              <Text variant="bodySm" color={palette.inkSecondary} numberOfLines={1}>
                {dateSubtitle}
              </Text>
            ) : null}
          </View>
          <IconButton icon="notifications-outline" onPress={() => router.push('/notifications')} />
        </View>
      </View>

      {liveLoading ? (
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <ResultCardSkeleton key={i} />
          ))}
        </View>
      ) : (
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
              message={liveError ?? 'Try adjusting your filters.'}
            />
          }
          ListFooterComponent={<CraftedFooter />}
        />
      )}

      {!liveLoading && list.length > 0 ? (
        <PressableScale
          onPress={() => router.push('/map')}
          scaleTo={0.94}
          style={{
            position: 'absolute',
            top: spacing.md,
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
      ) : null}

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

function ResultCardSkeleton() {
  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' }}>
      <Skeleton height={180} rounded={0} />
      <View style={{ padding: spacing.base, gap: 8 }}>
        <Skeleton width="65%" height={16} />
        <Skeleton width="45%" height={12} />
        <Skeleton width="35%" height={18} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}
