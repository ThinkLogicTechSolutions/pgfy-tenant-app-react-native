/** T-S11 — Map view (stylized mock map with clustered pins + horizontal preview cards). */
import { useRef, useState } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius, shadows } from '@/theme';
import { Text, IconButton, PressableScale, EmptyState } from '@/components/ui';
import { RatingPill } from '@/components/domain';
import { MapBackdrop, EmptySearch } from '@/components/illustrations';
import { useMapResults } from '@/store/mapResults';
import type { Listing } from '@/data/types';
import { inr } from '@/lib/format';

const POS = [
  { top: '22%', left: '18%' }, { top: '30%', left: '58%' }, { top: '44%', left: '32%' },
  { top: '38%', left: '74%' }, { top: '56%', left: '50%' }, { top: '60%', left: '20%' },
  { top: '50%', left: '82%' }, { top: '68%', left: '66%' }, { top: '26%', left: '40%' },
  { top: '72%', left: '38%' },
];

export default function MapView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [selected, setSelected] = useState(0);
  const listings = useMapResults();

  const cardWidth = Math.min(300, width * 0.82);
  const cardGap = spacing.md;
  const cardStep = cardWidth + cardGap;

  const selectListing = (index: number) => {
    const i = Math.max(0, Math.min(index, listings.length - 1));
    setSelected(i);
    scrollRef.current?.scrollTo({ x: i * cardStep, animated: true });
  };

  if (listings.length === 0) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
        <View style={{ paddingHorizontal: spacing.base, paddingBottom: spacing.sm }}>
          <IconButton icon="chevron-back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={{ borderRadius: 21 }} />
        </View>
        <EmptyState illustration={<EmptySearch />} title="No properties to show" message="Go back and search or browse properties first." />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.navyTint }}>
      <View style={{ position: 'absolute', inset: 0 }}>
        <MapBackdrop />
        {listings.map((l, i) => {
          const active = i === selected;
          return (
            <PressableScale
              key={l.id}
              onPress={() => selectListing(i)}
              haptics
              style={{ position: 'absolute', top: POS[i % POS.length].top as any, left: POS[i % POS.length].left as any }}
            >
              <View
                style={{
                  backgroundColor: active ? palette.coral : palette.navy,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  ...(active ? shadows.floating : shadows.card),
                  transform: [{ scale: active ? 1.08 : 1 }],
                }}
              >
                <Ionicons name="home" size={12} color={palette.white} />
                <Text variant="caption" weight="700" color={palette.white} style={{ fontSize: 11 }}>
                  {inr(l.priceFrom)}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.base }}>
        <IconButton icon="chevron-back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={{ borderRadius: 21 }} />
        <IconButton icon="locate" color={palette.navy} />
      </View>

      <PressableScale
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        style={{
          position: 'absolute',
          top: insets.top + 70,
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: palette.navy,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 999,
          ...shadows.floating,
        }}
      >
        <Ionicons name="list" size={16} color={palette.white} />
        <Text variant="bodySm" weight="600" color={palette.white}>
          List view
        </Text>
      </PressableScale>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardStep}
        snapToAlignment="start"
        contentContainerStyle={{
          paddingHorizontal: spacing.base,
          gap: cardGap,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.base,
        }}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / cardStep);
          setSelected(Math.max(0, Math.min(idx, listings.length - 1)));
        }}
      >
        {listings.map((listing, i) => (
          <MapPreviewCard
            key={listing.id}
            listing={listing}
            width={cardWidth}
            active={i === selected}
            onPress={() => router.push(`/listing/${listing.id}`)}
            onFocus={() => setSelected(i)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function MapPreviewCard({
  listing,
  width,
  active,
  onPress,
  onFocus,
}: {
  listing: Listing;
  width: number;
  active: boolean;
  onPress: () => void;
  onFocus: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      onPressIn={onFocus}
      scaleTo={0.98}
      style={{
        width,
        backgroundColor: palette.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        flexDirection: 'row',
        gap: spacing.md,
        borderWidth: active ? 2 : 1,
        borderColor: active ? palette.coral : palette.border,
        ...shadows.floating,
      }}
    >
      <Image source={{ uri: listing.coverImage }} style={{ width: 80, height: 80, borderRadius: radius.md }} contentFit="cover" />
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
            <Text variant="bodyMd" weight="700" numberOfLines={1} style={{ flex: 1 }}>
              {listing.name}
            </Text>
            <RatingPill rating={listing.rating} />
          </View>
          <Text variant="caption" color={palette.inkSecondary} numberOfLines={1}>
            {listing.locality} · {listing.type} · {listing.distanceKm} km
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="bodyMd" weight="700" mono color={palette.navy}>
            {inr(listing.priceFrom)}
            <Text variant="caption" color={palette.inkTertiary}>
              /mo
            </Text>
          </Text>
          <Text variant="caption" color={listing.vacantBeds <= 2 ? palette.coralDark : palette.success}>
            {listing.vacantBeds} beds left
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}
