/** PG browse results — list after home search (city + stay dates). */
import { useMemo, useState } from 'react';
import { View, FlatList, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius, shadows } from '@/theme';
import { Text, Chip, EmptyState, IconButton, Sheet, PressableScale } from '@/components/ui';
import { ListingCard, CraftedFooter } from '@/components/domain';
import { EmptySearch } from '@/components/illustrations';
import { LISTINGS, SORT_OPTIONS } from '@/data';
import { formatDayMonth } from '@/lib/format';
import { useSaved } from '@/store/saved';

const QUICK = ['All', 'Saved', 'Co-living', 'PG', 'Hostel'] as const;

export default function Browse() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ city?: string; checkIn?: string; checkOut?: string }>();
  const saved = useSaved();

  const city = params.city?.trim() || 'Bengaluru';
  const checkIn = params.checkIn || '';
  const checkOut = params.checkOut || '';

  const [quick, setQuick] = useState<(typeof QUICK)[number]>('All');
  const [sort, setSort] = useState('Relevance');
  const [sortOpen, setSortOpen] = useState(false);

  const list = useMemo(() => {
    const filtered = LISTINGS.filter((l) => {
      const loc = `${l.city} ${l.locality} ${l.name}`.toLowerCase();
      const cityMatch = !city || loc.includes(city.toLowerCase());
      let f = true;
      if (quick === 'Saved') f = saved.isSaved(l.id);
      else if (quick !== 'All') f = l.type === quick;
      return cityMatch && f;
    });
    const arr = [...filtered];
    if (sort === 'Price: Low to High') arr.sort((a, b) => a.priceFrom - b.priceFrom);
    else if (sort === 'Price: High to Low') arr.sort((a, b) => b.priceFrom - a.priceFrom);
    else if (sort === 'Rating') arr.sort((a, b) => b.rating - a.rating);
    else if (sort === 'Distance') arr.sort((a, b) => a.distanceKm - b.distanceKm);
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, quick, sort, saved.count]);

  const dateSubtitle =
    checkIn && checkOut ? `${formatDayMonth(checkIn)} – ${formatDayMonth(checkOut)}` : checkIn ? `From ${formatDayMonth(checkIn)}` : undefined;

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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {QUICK.map((q) => (
            <Chip key={q} label={q === 'Saved' ? `Saved (${saved.count})` : q} active={quick === q} onPress={() => setQuick(q)} />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={list}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] + 48, gap: spacing.md, paddingTop: spacing.sm }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <Text variant="bodySm" color={palette.inkSecondary}>
              {list.length} properties found
            </Text>
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
            onPress={() => router.push({
              pathname: `/listing/${item.id}`,
              params: { checkIn, checkOut },
            })}
            saved={saved.isSaved(item.id)}
            onToggleSave={() => saved.toggle(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            illustration={<EmptySearch />}
            title={quick === 'Saved' ? 'No saved properties' : 'No properties found'}
            message="Try a different search or filter."
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
    </View>
  );
}
