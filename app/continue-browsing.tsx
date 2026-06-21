/** Continue browsing — view-all of recently-viewed listings (home "See all"). */
import { View, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, palette } from '@/theme';
import { Text, IconButton, EmptyState } from '@/components/ui';
import { ListingCard, CraftedFooter } from '@/components/domain';
import { EmptySearch } from '@/components/illustrations';
import { listingsByIds } from '@/data';
import { useRecentlyViewed, recordView } from '@/store/recentlyViewed';
import { useSaved } from '@/store/saved';

export default function ContinueBrowsing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const saved = useSaved();
  const { ids } = useRecentlyViewed();
  const listings = listingsByIds(ids);

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
            title="Nothing here yet"
            message="Properties you view will show up here so you can pick up where you left off."
          />
        }
        ListFooterComponent={listings.length > 0 ? <CraftedFooter /> : null}
      />
    </View>
  );
}
