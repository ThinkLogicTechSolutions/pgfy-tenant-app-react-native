/** Popular areas — view-all grid of neighbourhoods (home "See all"). */
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, palette } from '@/theme';
import { Text, IconButton } from '@/components/ui';
import { CityTile, CraftedFooter } from '@/components/domain';
import { POPULAR_AREAS } from '@/data/popularAreas';
import { haptic } from '@/lib/haptics';

const COLUMNS = 3;

export default function PopularAreas() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.base * 2 - spacing.md * (COLUMNS - 1)) / COLUMNS;

  const openArea = (name: string) => {
    haptic.select();
    router.push({ pathname: '/browse', params: { city: name } });
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

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {POPULAR_AREAS.map((area) => (
            <CityTile
              key={area.id}
              label={area.name}
              landmarkId="cityscape"
              accent={area.accent}
              image={area.image}
              width={cardWidth}
              onPress={() => openArea(area.name)}
            />
          ))}
        </View>
        <CraftedFooter />
      </ScrollView>
    </View>
  );
}
