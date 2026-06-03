/** Marketplace listing cards — full-width (results) and compact (rails). */
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/theme';
import { Text, PressableScale, IconButton } from '@/components/ui';
import { RatingPill } from './Badges';
import { inr } from '@/lib/format';
import { listingNearLandmarkTitle } from '@/lib/listingDisplay';
import type { Listing, ListingTag } from '@/data/types';

const AMENITY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Wi-Fi': 'wifi', AC: 'snow-outline', Gym: 'barbell-outline', Parking: 'car-outline',
  'Power Backup': 'flash-outline', 'Dedicated Security': 'shield-outline', 'Pure Veg': 'leaf-outline',
};

function visibleTags(tags: ListingTag[]): ListingTag[] {
  return tags.filter((t) => t === 'New');
}

function tagTone(tag: string) {
  if (tag === 'Highly rated by women') {
    return { bg: palette.navy, fg: palette.white };
  }
  return { bg: palette.success, fg: palette.white };
}

export function ListingCard({
  listing,
  onPress,
  saved,
  onToggleSave,
  titleFormat = 'name',
  showDistance = true,
  showMeta = true,
  showLocalityInMeta = true,
  badgeLabels = [],
}: {
  listing: Listing;
  onPress?: () => void;
  saved?: boolean;
  onToggleSave?: () => void;
  /** `nearLandmark` → "PG near Forum Mall" */
  titleFormat?: 'name' | 'nearLandmark';
  showDistance?: boolean;
  /** Locality / type line under the title */
  showMeta?: boolean;
  /** When false, hides locality/area from the meta row (type, gender, distance remain). */
  showLocalityInMeta?: boolean;
  /** Extra editorial badges shown in the top-left corner. */
  badgeLabels?: string[];
}) {
  const l = listing;
  const title = titleFormat === 'nearLandmark' ? listingNearLandmarkTitle(l) : l.name;
  const metaParts = [
    ...(showLocalityInMeta ? [l.locality] : []),
    l.type,
    l.gender,
    ...(showDistance ? [`${l.distanceKm} km`] : []),
  ];
  const meta = metaParts.join(' · ');
  const primaryTags = visibleTags(l.tags);
  const badges = primaryTags.length > 0 ? primaryTags : badgeLabels.slice(0, 1);
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' }}
    >
      <View>
        <Image source={{ uri: l.coverImage }} style={{ width: '100%', height: 168 }} contentFit="cover" transition={250} />
        <View style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 6 }}>
          {badges.map((t) => {
            const tone = tagTone(t);
            return (
              <View key={t} style={{ backgroundColor: tone.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 }}>
                <Text variant="overline" color={tone.fg} style={{ fontSize: 10 }}>{t.toUpperCase()}</Text>
              </View>
            );
          })}
        </View>
        <View style={{ position: 'absolute', top: 8, right: 8 }}>
          <IconButton icon={saved ? 'heart' : 'heart-outline'} size={18} color={saved ? palette.coral : palette.ink} bg="rgba(255,255,255,0.92)" onPress={onToggleSave} style={{ width: 36, height: 36 }} />
        </View>
        <View style={{ position: 'absolute', bottom: 10, left: 10 }}>
          <RatingPill rating={l.rating} count={l.reviewCount} dark />
        </View>
      </View>

      <View style={{ padding: spacing.base, gap: 6 }}>
        <Text variant="h3" numberOfLines={1}>{title}</Text>
        {showMeta ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="location-outline" size={13} color={palette.inkTertiary} />
            <Text variant="bodySm" color={palette.inkSecondary} numberOfLines={1} style={{ flex: 1 }}>
              {meta}
            </Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: 2 }}>
          {l.amenities.filter((a) => AMENITY_ICON[a]).slice(0, 4).map((a) => (
            <View key={a} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name={AMENITY_ICON[a]} size={13} color={palette.inkTertiary} />
              <Text variant="caption" color={palette.inkTertiary}>{a}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: palette.border }}>
          <View>
            <Text variant="h3" mono color={palette.navy}>
              {inr(l.priceFrom)}
              <Text variant="caption" color={palette.inkTertiary}> /mo onwards</Text>
            </Text>
            <Text variant="caption" color={l.vacantBeds <= 2 ? palette.coralDark : palette.success}>
              {l.vacantBeds} {l.vacantBeds === 1 ? 'bed' : 'beds'} available
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Text variant="bodySm" weight="600" color={palette.coralDark}>{l.verified ? 'View' : 'Request'}</Text>
            <Ionicons name="chevron-forward" size={15} color={palette.coralDark} />
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

/** Compact card for horizontal rails. */
export function ListingRailCard({ listing, onPress }: { listing: Listing; onPress?: () => void }) {
  const l = listing;
  return (
    <PressableScale onPress={onPress} scaleTo={0.97} style={{ width: 210, backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' }}>
      <View>
        <Image source={{ uri: l.coverImage }} style={{ width: '100%', height: 116 }} contentFit="cover" transition={250} />
        <View style={{ position: 'absolute', bottom: 8, left: 8 }}>
          <RatingPill rating={l.rating} dark />
        </View>
      </View>
      <View style={{ padding: spacing.md, gap: 3 }}>
        <Text variant="bodyMd" weight="600" numberOfLines={1}>{l.name}</Text>
        <Text variant="caption" color={palette.inkTertiary} numberOfLines={1}>{l.locality} · {l.type}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <Text variant="bodyMd" weight="700" mono color={palette.navy}>
            {inr(l.priceFrom)}<Text variant="caption" color={palette.inkTertiary}>/mo</Text>
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}
