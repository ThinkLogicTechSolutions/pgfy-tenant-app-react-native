/** T-S12 — Compare up to 3 properties side by side. */
import { View, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Button } from '@/components/ui';
import { listingsByIds } from '@/data';
import { inr } from '@/lib/format';

const COL = 168;

export default function Compare() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ids } = useLocalSearchParams<{ ids: string }>();
  const items = listingsByIds((ids ?? '').split(',').filter(Boolean));

  const rows: { label: string; render: (l: (typeof items)[number]) => React.ReactNode }[] = [
    { label: 'Price from', render: (l) => <Val>{inr(l.priceFrom)}/mo</Val> },
    { label: 'PGfy score', render: (l) => <Val>{l.verified ? `${l.pgfyScore.toFixed(1)}/5` : '—'}</Val> },
    { label: 'Rating', render: (l) => <Val>{l.rating} ({l.reviewCount})</Val> },
    { label: 'Type', render: (l) => <Val>{l.type}</Val> },
    { label: 'Gender', render: (l) => <Val>{l.gender}</Val> },
    { label: 'Distance', render: (l) => <Val>{l.distanceKm} km</Val> },
    { label: 'Beds free', render: (l) => <Val>{l.vacantBeds}</Val> },
    { label: 'Food', render: (l) => <Bool on={l.foodIncluded} /> },
    { label: 'Wi-Fi', render: (l) => <Bool on={l.amenities.includes('Wi-Fi')} /> },
    { label: 'AC', render: (l) => <Bool on={l.amenities.includes('AC')} /> },
    { label: 'Gym', render: (l) => <Bool on={l.amenities.includes('Gym')} /> },
    { label: 'Parking', render: (l) => <Bool on={l.amenities.includes('Parking')} /> },
    { label: 'Notice period', render: (l) => <Val>{l.noticePeriodDays}d</Val> },
    { label: 'Lock-in', render: (l) => <Val>{l.lockInMonths} mo</Val> },
  ];

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Compare" subtitle={`${items.length} properties`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        <View>
          {/* Header row */}
          <View style={{ flexDirection: 'row', paddingHorizontal: spacing.base }}>
            <View style={{ width: 110 }} />
            {items.map((l) => (
              <View key={l.id} style={{ width: COL, paddingHorizontal: spacing.xs }}>
                <Image source={{ uri: l.coverImage }} style={{ width: '100%', height: 90, borderRadius: radius.md }} contentFit="cover" />
                <Text variant="bodyMd" weight="700" numberOfLines={1} style={{ marginTop: 6 }}>{l.name}</Text>
                <Text variant="caption" color={palette.inkTertiary} numberOfLines={1}>{l.locality}</Text>
              </View>
            ))}
          </View>

          {/* Rows */}
          <View style={{ marginTop: spacing.md, paddingHorizontal: spacing.base }}>
            {rows.map((row, i) => (
              <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, backgroundColor: i % 2 ? palette.surface : 'transparent', borderRadius: radius.sm }}>
                <Text variant="caption" color={palette.inkSecondary} style={{ width: 110 }}>{row.label}</Text>
                {items.map((l) => (
                  <View key={l.id} style={{ width: COL, alignItems: 'center' }}>{row.render(l)}</View>
                ))}
              </View>
            ))}
          </View>

          {/* CTAs */}
          <View style={{ flexDirection: 'row', paddingHorizontal: spacing.base, marginTop: spacing.md }}>
            <View style={{ width: 110 }} />
            {items.map((l) => (
              <View key={l.id} style={{ width: COL, paddingHorizontal: spacing.xs }}>
                <Button label={l.verified ? 'View' : 'Request'} size="sm" full onPress={() => router.push(`/listing/${l.id}`)} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Val({ children }: { children: React.ReactNode }) {
  return <Text variant="bodySm" weight="600">{children}</Text>;
}
function Bool({ on }: { on: boolean }) {
  return <Ionicons name={on ? 'checkmark-circle' : 'close-circle'} size={20} color={on ? palette.success : palette.borderStrong} />;
}
