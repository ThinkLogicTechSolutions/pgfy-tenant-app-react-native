/** T-S10 — Search results list with sort + compare bar. */
import { useMemo, useState } from 'react';
import { View, FlatList, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Chip, Sheet, EmptyState, PressableScale, IconButton } from '@/components/ui';
import { ListingCard } from '@/components/domain';
import { EmptySearch } from '@/components/illustrations';
import { LISTINGS, listingsByIds, CURATED_RAILS, SORT_OPTIONS } from '@/data';
import { useSaved } from '@/store/saved';

export default function Results() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ rail?: string; title?: string }>();
  const saved = useSaved();
  const [sort, setSort] = useState('Relevance');
  const [sortOpen, setSortOpen] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);

  const base = useMemo(() => {
    if (params.rail) {
      const rail = CURATED_RAILS.find((r) => r.key === params.rail);
      if (rail) return listingsByIds(rail.listingIds);
    }
    return LISTINGS;
  }, [params.rail]);

  const list = useMemo(() => {
    const arr = [...base];
    if (sort === 'Price: Low to High') arr.sort((a, b) => a.priceFrom - b.priceFrom);
    else if (sort === 'Price: High to Low') arr.sort((a, b) => b.priceFrom - a.priceFrom);
    else if (sort === 'Rating') arr.sort((a, b) => b.rating - a.rating);
    else if (sort === 'Distance') arr.sort((a, b) => a.distanceKm - b.distanceKm);
    return arr;
  }, [base, sort]);

  const toggleCompare = (id: string) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 3 ? [...c, id] : c));

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader
        title={params.title || 'Results'}
        subtitle={`${list.length} properties`}
        right={<IconButton icon="map-outline" color={palette.navy} onPress={() => router.push('/map')} />}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, gap: spacing.sm, paddingBottom: spacing.sm }}>
        <PressableScale onPress={() => setSortOpen(true)} haptics={false} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 }}>
          <Ionicons name="swap-vertical" size={15} color={palette.navy} />
          <Text variant="bodySm" weight="600">{sort}</Text>
        </PressableScale>
        <PressableScale onPress={() => router.push('/search')} haptics={false} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 }}>
          <Ionicons name="options-outline" size={15} color={palette.navy} />
          <Text variant="bodySm" weight="600">Filters</Text>
        </PressableScale>
      </View>

      <FlatList
        data={list}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: compare.length >= 2 ? 100 : spacing['3xl'], gap: spacing.md, paddingTop: spacing.xs }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View>
            <ListingCard
              listing={item}
              titleFormat="nearLandmark"
              showLocalityInMeta={false}
              onPress={() => router.push(`/listing/${item.id}`)}
              saved={saved.isSaved(item.id)}
              onToggleSave={() => saved.toggle(item.id)}
            />
            <PressableScale onPress={() => toggleCompare(item.id)} haptics={false} style={{ position: 'absolute', top: 14, right: 56, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: compare.includes(item.id) ? palette.navy : 'rgba(255,255,255,0.92)', paddingHorizontal: 9, height: 36, borderRadius: 10 }}>
              <Ionicons name={compare.includes(item.id) ? 'checkmark' : 'git-compare-outline'} size={15} color={compare.includes(item.id) ? palette.white : palette.ink} />
            </PressableScale>
          </View>
        )}
        ListEmptyComponent={<EmptyState illustration={<EmptySearch />} title="No properties found" message="Try adjusting your filters." actionLabel="Edit filters" onAction={() => router.push('/search')} />}
      />

      {compare.length >= 2 ? (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
          <PressableScale onPress={() => router.push({ pathname: '/compare', params: { ids: compare.join(',') } })} style={{ height: 52, borderRadius: radius.md, backgroundColor: palette.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="git-compare" size={18} color={palette.white} />
            <Text variant="button" color={palette.white}>Compare {compare.length} properties</Text>
          </PressableScale>
        </View>
      ) : null}

      <Sheet visible={sortOpen} onClose={() => setSortOpen(false)} title="Sort by">
        <View>
          {SORT_OPTIONS.map((s) => (
            <PressableScale key={s} onPress={() => { setSort(s); setSortOpen(false); }} scaleTo={0.98} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md }}>
              <Text variant="bodyMd" color={sort === s ? palette.coralDark : palette.ink} weight={sort === s ? '600' : '400'}>{s}</Text>
              {sort === s ? <Ionicons name="checkmark-circle" size={22} color={palette.coral} /> : null}
            </PressableScale>
          ))}
        </View>
      </Sheet>
    </View>
  );
}
