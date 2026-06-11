/** T-S14 — Room & bed selection grid. Select an available bed → continue. */
import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Chip, Button, EmptyState } from '@/components/ui';
import { BedLegend, SelectableRoom, StatusPill } from '@/components/domain';
import { getListing, type Bed, type Room } from '@/data';
import { inr } from '@/lib/format';
import { listingNearLandmarkTitle } from '@/lib/listingDisplay';

export default function SelectBed() {
  const { id, checkIn, checkOut, occupancy, occupancyTitle, acType, selectedRent, bookingType } = useLocalSearchParams<{
    id: string;
    checkIn?: string;
    checkOut?: string;
    occupancy?: string;
    occupancyTitle?: string;
    acType?: string;
    selectedRent?: string;
    bookingType?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listing = getListing(String(id));
  const [floorIdx, setFloorIdx] = useState(0);
  const [sel, setSel] = useState<{ bed: Bed; room: Room } | null>(null);

  const selectBed = (bed: Bed, room: Room) => {
    setSel({ bed, room });
  };

  if (!listing) return <View style={{ flex: 1, paddingTop: insets.top + 60 }}><EmptyState title="Not found" /></View>;
  const floor = listing.floors[floorIdx];
  const acLabel = acType === 'AC' || acType === 'Non-AC' ? acType : null;
  const wantsAc = acLabel === 'AC';
  const rooms = floor.rooms.filter((room) => {
    if (occupancy && room.sharingType !== occupancy) return false;
    if (acLabel) {
      const roomHasAc = room.amenities.includes('AC');
      return wantsAc ? roomHasAc : !roomHasAc;
    }
    return true;
  });
  const selectedOccupancyRent = Number(selectedRent ?? 0) || undefined;
  const priceSuffix = bookingType === 'hourly' ? '/hr' : bookingType === 'daily' ? '/day' : '/mo';

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Choose room / bed" subtitle={listingNearLandmarkTitle(listing)} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: sel ? 120 : spacing.xl }} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: spacing.base }}>
          <Text variant="bodyMd" weight="700" style={{ marginBottom: spacing.sm }}>Bed availability</Text>
          <BedLegend />
        </Card>
        {occupancy ? (
          <Card style={{ marginBottom: spacing.base }}>
            <Text variant="bodySm" color={palette.inkSecondary}>Selected occupancy</Text>
            <Text variant="bodyMd" weight="700" style={{ marginTop: 4 }}>{occupancyTitle || occupancy}</Text>
            {acLabel ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
                <Ionicons
                  name={wantsAc ? 'snow-outline' : 'thermometer-outline'}
                  size={16}
                  color={wantsAc ? palette.info : palette.inkSecondary}
                />
                <StatusPill status={acLabel} small />
                <Text variant="caption" color={palette.inkTertiary}>
                  Showing {acLabel} rooms only
                </Text>
              </View>
            ) : null}
          </Card>
        ) : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.base }}>
          {listing.floors.map((f, i) => (
            <Chip key={f.id} label={f.name === 'Ground' ? 'Ground floor' : `Floor ${f.name}`} active={floorIdx === i} onPress={() => setFloorIdx(i)} />
          ))}
        </ScrollView>
        <View style={{ gap: spacing.md }}>
          {rooms.map((room) => (
            <SelectableRoom
              key={room.id}
              room={room}
              selectedBedId={sel?.bed.id ?? null}
              onSelectBed={selectBed}
              priceOverride={selectedOccupancyRent}
              subtitleOverride={
                occupancyTitle
                  ? `${occupancyTitle}${acLabel ? ` · ${acLabel}` : ''} · ${room.beds.filter((b) => b.status === 'available').length} available`
                  : undefined
              }
            />
          ))}
        </View>
        {rooms.length === 0 ? (
          <EmptyState
            title="No rooms available"
            message={acLabel
              ? `No ${acLabel} ${occupancy ?? ''} rooms on this floor. Try another floor or change your occupancy plan.`
              : 'Try another floor or go back and choose a different occupancy.'}
          />
        ) : null}
      </ScrollView>

      {sel ? (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.base, paddingTop: spacing.xs }}>
            <View style={{ width: 46, height: 46, borderRadius: radius.md, backgroundColor: palette.coralTint, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="h3" color={palette.coralDark}>{sel.bed.label}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMd" weight="700">Room {sel.room.number} · Bed {sel.bed.label}</Text>
              <Text variant="caption" color={palette.inkSecondary}>
                {sel.room.sharingType}{acLabel ? ` · ${acLabel}` : ''} · {inr(selectedOccupancyRent ?? sel.bed.rent)}{priceSuffix}
              </Text>
            </View>
            <Button
              label="Continue"
              iconRight="arrow-forward"
              onPress={() => router.push({
                pathname: `/listing/${id}/book`,
                params: {
                  room: sel.room.number,
                  bed: sel.bed.label,
                  rent: String(selectedOccupancyRent ?? sel.bed.rent),
                  sharing: sel.room.sharingType,
                  checkIn: checkIn ?? '',
                  checkOut: checkOut ?? '',
                  occupancyTitle: occupancyTitle ?? '',
                  acType: acLabel ?? '',
                  bookingType: bookingType ?? 'monthly',
                },
              })}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
