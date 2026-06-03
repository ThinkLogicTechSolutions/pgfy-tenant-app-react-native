/** Saved / shortlisted properties. */
import { View, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { ScreenHeader, EmptyState, Button } from '@/components/ui';
import { ListingCard } from '@/components/domain';
import { EmptyGeneric } from '@/components/illustrations';
import { LISTINGS } from '@/data';
import { useSaved } from '@/store/saved';

export default function Saved() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const saved = useSaved();
  const list = LISTINGS.filter((l) => saved.isSaved(l.id));

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Saved properties" subtitle={`${list.length} shortlisted`} />
      <FlatList
        data={list}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'], gap: spacing.md, paddingTop: spacing.sm }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ListingCard listing={item} onPress={() => router.push(`/listing/${item.id}`)} saved onToggleSave={() => saved.toggle(item.id)} />
        )}
        ListEmptyComponent={
          <EmptyState
            illustration={<EmptyGeneric />}
            title="No saved properties yet"
            message="Tap the heart on any property to shortlist it here for later."
            actionLabel="Explore properties"
            onAction={() => router.replace('/(tabs)')}
          />
        }
      />
    </View>
  );
}
