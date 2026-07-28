/** Continue browsing — view-all of recently-viewed listings (home "See all"). */
import { useCallback, useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, palette } from '@/theme';
import { Text, IconButton, EmptyState } from '@/components/ui';
import { ListingCard, CraftedFooter } from '@/components/domain';
import { EmptySearch } from '@/components/illustrations';
import { continueBrowsingToListing } from '@/lib/listingAdapter';
import { continueBrowsingApi, errorMessage } from '@/lib/api';
import { recordView } from '@/store/recentlyViewed';
import { useSaved } from '@/store/saved';
import type { Listing } from '@/data/types';

const PAGE_SIZE = 10;

export default function ContinueBrowsing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const saved = useSaved();

  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    continueBrowsingApi
      .getContinueBrowsing({ limit: PAGE_SIZE, skip: 0 })
      .then((page) => {
        if (!active) return;
        setListings(page.data.map(continueBrowsingToListing));
        setTotal(page.total);
      })
      .catch((e) => {
        if (!active) return;
        setError(errorMessage(e));
        setListings([]);
        setTotal(0);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || listings.length >= total) return;
    setLoadingMore(true);
    continueBrowsingApi
      .getContinueBrowsing({ limit: PAGE_SIZE, skip: listings.length })
      .then((page) => {
        setListings((prev) => [...prev, ...page.data.map(continueBrowsingToListing)]);
        setTotal(page.total);
      })
      .catch(() => {
        // Keep what's already loaded; the user can retry by scrolling again.
      })
      .finally(() => setLoadingMore(false));
  }, [loading, loadingMore, listings.length, total]);

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.base, paddingBottom: spacing.sm }}>
        <IconButton icon="chevron-back" onPress={() => router.back()} style={{ borderRadius: 21 }} />
        <View style={{ flex: 1 }}>
          <Text variant="h2" numberOfLines={1}>Continue browsing</Text>
          <Text variant="bodySm" color={palette.inkSecondary} numberOfLines={1}>
            Pick up where you left off
          </Text>
        </View>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing['3xl'], gap: spacing.md }}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            titleFormat="nearLandmark"
            showLocalityInMeta={false}
            saved={saved.isSaved(item.id)}
            onToggleSave={() => saved.toggle(item.id)}
            onPress={() => {
              recordView(item.id);
              router.push(`/listing/${item.id}`);
            }}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            illustration={<EmptySearch />}
            title={loading ? 'Loading…' : 'Nothing here yet'}
            message={
              loading
                ? 'Fetching properties you viewed recently.'
                : (error ?? 'Properties you view will show up here so you can pick up where you left off.')
            }
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={palette.navy} style={{ marginVertical: spacing.md }} />
          ) : listings.length > 0 ? (
            <CraftedFooter />
          ) : null
        }
      />
    </View>
  );
}
