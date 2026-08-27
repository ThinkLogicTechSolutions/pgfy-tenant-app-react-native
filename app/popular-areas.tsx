/** Popular areas — view-all grid of neighbourhoods (home "See all"). Renders the exact
 * `popular_areas` list from `GET /tenant/dashboard` that Home already fetched — passed in via
 * route params rather than re-fetched, so this screen never needs its own dashboard call. */
import { useMemo } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, palette } from '@/theme';
import { Text, IconButton, EmptyState } from '@/components/ui';
import { CityTile, CraftedFooter } from '@/components/domain';
import { EmptyLocation } from '@/components/illustrations';
import type { LocalityMaster } from '@/lib/api';
import { haptic } from '@/lib/haptics';

const COLUMNS = 3;

// Same cycling accent palette as Home's "Popular areas" rail — these tiles have no color of
// their own in the master data, just an index-based tint for visual variety.
const AREA_TILE_ACCENTS = ['#3B82F6', '#1FB573', '#7C5CFC', '#F5A623', '#FF4B3E', '#01264E'];

export default function PopularAreas() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { areas: areasParam, cityId, city } = useLocalSearchParams<{ areas?: string; cityId?: string; city?: string }>();
  const cardWidth = (width - spacing.base * 2 - spacing.md * (COLUMNS - 1)) / COLUMNS;

  const areas = useMemo<LocalityMaster[]>(() => {
    if (!areasParam) return [];
    try {
      const parsed = JSON.parse(areasParam);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [areasParam]);

  const openArea = (area: LocalityMaster) => {
    haptic.select();
    router.push({
      pathname: '/browse',
      params: {
        city: city ?? '',
        cityId: cityId ?? String(area.city_id),
        localityId: String(area.id),
      },
    });
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.base, paddingBottom: spacing.sm }}>
        <IconButton icon="chevron-back" onPress={() => router.back()} style={{ borderRadius: 21 }} />
        <View style={{ flex: 1 }}>
          <Text variant="h2" numberOfLines={1}>Popular areas</Text>
          <Text variant="bodySm" color={palette.inkSecondary} numberOfLines={1}>
            Explore by popular neighbourhoods
          </Text>
        </View>
      </View>

      {areas.length === 0 ? (
        <EmptyState
          illustration={<EmptyLocation />}
          title="No popular areas yet"
          message="Set your location on Home to see popular neighbourhoods here."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {areas.map((area, i) => (
              <CityTile
                key={area.id}
                label={area.name}
                landmarkId="cityscape"
                accent={AREA_TILE_ACCENTS[i % AREA_TILE_ACCENTS.length]}
                image={area.avatar?.link}
                width={cardWidth}
                onPress={() => openArea(area)}
              />
            ))}
          </View>
          <CraftedFooter />
        </ScrollView>
      )}
    </View>
  );
}
