/** Saved / shortlisted properties — real `GET /tenant-management/tenant-favorite-property`,
 *  eager-loaded with the property row. Paginated, pull-to-refresh, shimmer on first load. */
import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { ScreenHeader, EmptyState, Text, PressableScale, IconButton, Skeleton, AnimatedListItem } from '@/components/ui';
import { RatingPill } from '@/components/domain';
import { EmptyGeneric } from '@/components/illustrations';
import { favoritesApi, errorMessage, type ApiFavoritePropertyItem, type ApiProperty, type PropertyGender } from '@/lib/api';
import { useMasterData } from '@/context/MasterDataContext';
import { haptic } from '@/lib/haptics';
import { alert } from '@/lib/alertDialog';

const PAGE_SIZE = 10;

const GENDER_LABEL: Record<string, string> = { MALE: 'Boys', FEMALE: 'Girls', UNISEX: 'Co-ed' };

function propertyCoverImage(property: ApiProperty): string {
  const attachments = property.media.flatMap((s) => s.attachments);
  return attachments.find((a) => a.type === 1)?.link ?? attachments[0]?.link ?? '';
}

export default function Saved() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cities, localities } = useMasterData();

  const [items, setItems] = useState<ApiFavoritePropertyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const loadPage = (skip: number, isRefresh = false) => {
    const setBusy = isRefresh ? setRefreshing : skip === 0 ? setLoading : setLoadingMore;
    setBusy(true);
    setError(null);
    favoritesApi.listFavoriteProperties({ limit: PAGE_SIZE, skip })
      .then((page) => {
        setItems((prev) => (skip === 0 ? page.data : [...prev, ...page.data]));
        setTotal(page.total);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setBusy(false));
  };

  useEffect(() => {
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeFavorite = async (item: ApiFavoritePropertyItem) => {
    if (removingId != null) return;
    haptic.light();
    setRemovingId(item.id);
    const prevItems = items;
    const prevTotal = total;
    // Optimistic — drop it from the list immediately, restore on failure.
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setTotal((t) => Math.max(0, t - 1));
    try {
      await favoritesApi.removeFavoriteProperty(item.id);
      haptic.success();
    } catch (e) {
      haptic.error();
      setItems(prevItems);
      setTotal(prevTotal);
      alert('Could not remove favorite', errorMessage(e));
    } finally {
      setRemovingId(null);
    }
  };

  const localityName = (id: number) => localities.find((l) => l.id === id)?.name;
  const cityName = (id: number) => cities.find((c) => c.id === id)?.name;

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Saved properties" subtitle={loading ? undefined : `${total} shortlisted`} />

      {loading ? (
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm, gap: spacing.md }}>
          {[0, 1, 2].map((i) => <SavedPropertyCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'], gap: spacing.md, paddingTop: spacing.sm, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPage(0, true)} tintColor={palette.coral} colors={[palette.coral]} />}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <SavedPropertyCard
                item={item}
                locality={localityName(item.property.locality_id)}
                city={cityName(item.property.city_id)}
                removing={removingId === item.id}
                onPress={() => router.push(`/listing/api-${item.property_id}`)}
                onRemove={() => removeFavorite(item)}
              />
            </AnimatedListItem>
          )}
          ListEmptyComponent={
            <EmptyState
              illustration={<EmptyGeneric />}
              title={error ? "Couldn't load saved properties" : 'No saved properties yet'}
              message={error ?? 'Tap the heart on any property to shortlist it here for later.'}
              actionLabel="Explore properties"
              onAction={() => router.replace('/(tabs)')}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!loadingMore && !refreshing && !error && items.length < total) loadPage(items.length);
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
    </View>
  );
}

function SavedPropertyCard({
  item, locality, city, removing, onPress, onRemove,
}: {
  item: ApiFavoritePropertyItem;
  locality?: string;
  city?: string;
  removing: boolean;
  onPress: () => void;
  onRemove: () => void;
}) {
  const p = item.property;
  const genderLabel = p.gender ? GENDER_LABEL[p.gender as PropertyGender] ?? p.gender : null;
  const metaLine = [locality, city].filter(Boolean).join(', ');
  const hasRating = (p.rating_count ?? 0) > 0 && p.avg_overall_rating != null;

  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' }}>
      <PressableScale onPress={onPress} scaleTo={0.99}>
        <View>
          <Image source={{ uri: propertyCoverImage(p) }} style={{ width: '100%', height: 160 }} contentFit="cover" transition={200} />
          <View style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 6 }}>
            {p.is_verified ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: palette.navy, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 }}>
                <Ionicons name="shield-checkmark" size={11} color={palette.white} />
                <Text variant="overline" color={palette.white} style={{ fontSize: 10 }}>VERIFIED</Text>
              </View>
            ) : null}
            {genderLabel ? (
              <View style={{ backgroundColor: 'rgba(255,255,255,0.94)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 }}>
                <Text variant="overline" color={palette.ink} style={{ fontSize: 10 }}>{genderLabel.toUpperCase()}</Text>
              </View>
            ) : null}
          </View>
          {hasRating ? (
            <View style={{ position: 'absolute', bottom: 10, left: 10 }}>
              <RatingPill rating={p.avg_overall_rating!} count={p.rating_count} dark />
            </View>
          ) : null}
        </View>
      </PressableScale>

      <View style={{ position: 'absolute', top: 8, right: 8 }}>
        <IconButton
          icon="heart"
          size={18}
          color={palette.coral}
          bg="rgba(255,255,255,0.92)"
          onPress={onRemove}
          style={{ width: 36, height: 36, opacity: removing ? 0.5 : 1 }}
        />
      </View>

      <PressableScale onPress={onPress} scaleTo={0.99}>
        <View style={{ padding: spacing.base, gap: 6 }}>
          <Text variant="h3" numberOfLines={1}>{p.name}</Text>
          {metaLine ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location-outline" size={13} color={palette.inkTertiary} />
              <Text variant="bodySm" color={palette.inkSecondary} numberOfLines={1} style={{ flex: 1 }}>{metaLine}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: palette.border }}>
            <Text variant="caption" color={p.available_beds > 0 ? palette.success : palette.inkTertiary}>
              {p.available_beds > 0 ? `${p.available_beds} bed${p.available_beds === 1 ? '' : 's'} available` : 'No beds available'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={palette.inkTertiary} />
          </View>
        </View>
      </PressableScale>
    </View>
  );
}

function SavedPropertyCardSkeleton() {
  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' }}>
      <Skeleton width="100%" height={160} rounded={0} />
      <View style={{ padding: spacing.base, gap: 8 }}>
        <Skeleton width="65%" height={18} />
        <Skeleton width="45%" height={13} />
        <View style={{ paddingTop: spacing.sm, marginTop: 2, borderTopWidth: 1, borderTopColor: palette.border }}>
          <Skeleton width="40%" height={13} />
        </View>
      </View>
    </View>
  );
}
