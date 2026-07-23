/** T-S14 — Room & bed selection grid. Select an available bed → continue. */
import { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Chip, Button, EmptyState, Sheet, PressableScale } from '@/components/ui';
import { BedLegend, SelectableRoom, StatusPill } from '@/components/domain';
import { getListing, type Bed, type Floor, type Room } from '@/data';
import { inr } from '@/lib/format';
import { listingNearLandmarkTitle } from '@/lib/listingDisplay';
import { useProfile } from '@/store/profile';
import { computeCompatibility, compatibilityTone, type CompatResult } from '@/lib/compatibility';
import { propertyApi, errorMessage, type ApiBookingMode } from '@/lib/api';
import { parseApiPropertyId, apiRoomAvailabilityToFloors } from '@/lib/listingAdapter';

export default function SelectBed() {
  const { id, checkIn, checkOut, occupancy, occupancyTitle, acType, selectedRent, bookingType, layout, withFood, propertyName } = useLocalSearchParams<{
    id: string;
    checkIn?: string;
    checkOut?: string;
    occupancy?: string;
    occupancyTitle?: string;
    acType?: string;
    selectedRent?: string;
    bookingType?: string;
    layout?: string;
    withFood?: string;
    propertyName?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mockListing = getListing(String(id));
  const profile = useProfile();
  const [floorIdx, setFloorIdx] = useState(0);
  const [sel, setSel] = useState<{ bed: Bed; room: Room } | null>(null);
  const [compatRoom, setCompatRoom] = useState<{ room: Room; result: CompatResult } | null>(null);

  const compatInput = { occupation: profile.occupation, prefs: profile.prefs };
  const hasAnyPref = profile.occupation !== null || Object.values(profile.prefs).some((v) => v !== null);

  const selectBed = (bed: Bed, room: Room) => {
    setSel({ bed, room });
  };

  const apiId = parseApiPropertyId(String(id));
  const acLabel = acType === 'AC' || acType === 'Non-AC' ? acType : null;
  const wantsAc = acLabel === 'AC';
  const apiBookingMode: ApiBookingMode = bookingType === 'hourly' ? 'HOURLY' : bookingType === 'daily' ? 'DAILY' : 'MONTHLY';
  const [apiFloors, setApiFloors] = useState<Floor[] | null>(null);
  const [floorsLoading, setFloorsLoading] = useState(!!(apiId && layout));
  const [floorsError, setFloorsError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (!apiId || !layout) return;
    let active = true;
    setFloorsLoading(true);
    setFloorsError(null);
    propertyApi.getRoomBedAvailability(apiId, { bookingMode: apiBookingMode, layout, isAc: wantsAc, withFood: withFood === 'true' })
      .then((data) => { if (active) setApiFloors(apiRoomAvailabilityToFloors(data, mockListing?.gender ?? 'Co-ed')); })
      .catch((e) => { if (active) setFloorsError(errorMessage(e)); })
      .finally(() => { if (active) setFloorsLoading(false); });
    return () => { active = false; };
  }, [apiId, layout, apiBookingMode, wantsAc, withFood, retryTick]);

  const floors = apiId ? apiFloors : mockListing?.floors ?? null;
  const headerSubtitle = apiId ? (propertyName || 'Property') : mockListing ? listingNearLandmarkTitle(mockListing) : '';

  if (!floors || floors.length === 0) {
    if (apiId && floorsLoading) {
      return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }}><ActivityIndicator color={palette.coral} /></View>;
    }
    if (apiId && floorsError) {
      return (
        <View style={{ flex: 1, paddingTop: insets.top + 60 }}>
          <EmptyState title="Couldn't load rooms" message={floorsError} actionLabel="Retry" onAction={() => setRetryTick((t) => t + 1)} />
        </View>
      );
    }
    if (apiId && floors) {
      return <View style={{ flex: 1, paddingTop: insets.top + 60 }}><EmptyState title="No rooms available" message="There are no rooms configured for this option yet." /></View>;
    }
    return <View style={{ flex: 1, paddingTop: insets.top + 60 }}><EmptyState title="Not found" /></View>;
  }
  const floor = floors[Math.min(floorIdx, floors.length - 1)];
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
      <ScreenHeader title="Choose room / bed" subtitle={headerSubtitle} />
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
          {floors.map((f, i) => (
            <Chip key={f.id} label={f.name === 'Ground' ? 'Ground floor' : `Floor ${f.name}`} active={floorIdx === i} onPress={() => setFloorIdx(i)} />
          ))}
        </ScrollView>
        {!hasAnyPref ? (
          <PressableScale
            onPress={() => router.push('/roommate-preferences')}
            scaleTo={0.99}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.navyTint, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.base }}
          >
            <Ionicons name="people-circle-outline" size={22} color={palette.navy} />
            <View style={{ flex: 1 }}>
              <Text variant="bodySm" weight="700" color={palette.navy}>Add your preferences for match scores</Text>
              <Text variant="caption" color={palette.navy}>See how well each room's roommates fit you</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.navy} />
          </PressableScale>
        ) : null}
        <View style={{ gap: spacing.md }}>
          {rooms.map((room) => {
            const result = computeCompatibility(compatInput, room.roommateProfile);
            return (
              <SelectableRoom
                key={room.id}
                room={room}
                selectedBedId={sel?.bed.id ?? null}
                onSelectBed={selectBed}
                priceOverride={selectedOccupancyRent}
                compatibility={{ score: result.score, answered: result.answered }}
                onCompatPress={result.answered > 0 ? () => setCompatRoom({ room, result }) : undefined}
                subtitleOverride={
                  occupancyTitle
                    ? `${occupancyTitle}${acLabel ? ` · ${acLabel}` : ''} · ${room.beds.filter((b) => b.status === 'available').length} available`
                    : undefined
                }
              />
            );
          })}
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
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.base, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMd" weight="700" numberOfLines={1}>Room {sel.room.number} · Bed {sel.bed.label}</Text>
              <Text variant="caption" color={palette.inkSecondary} numberOfLines={1}>
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

      <Sheet visible={!!compatRoom} onClose={() => setCompatRoom(null)} title={compatRoom ? `Room ${compatRoom.room.number} compatibility` : 'Compatibility'}>
        {compatRoom ? (
          <View style={{ gap: spacing.base }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.navyTint }}>
                <Text variant="h3" color={compatibilityTone(compatRoom.result.score) === 'success' ? palette.success : compatibilityTone(compatRoom.result.score) === 'warning' ? '#B26A00' : palette.danger}>
                  {compatRoom.result.score}%
                </Text>
              </View>
              <Text variant="bodySm" color={palette.inkSecondary} style={{ flex: 1 }}>
                Based on your preferences vs the roommates currently in this room.
              </Text>
            </View>
            <View style={{ gap: spacing.sm }}>
              {compatRoom.result.breakdown.map((item) => (
                <View
                  key={item.category}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.md,
                    borderRadius: radius.lg,
                    backgroundColor: item.match ? palette.successTint : palette.dangerTint,
                  }}
                >
                  <Ionicons name={item.match ? 'checkmark-circle' : 'close-circle'} size={20} color={item.match ? palette.success : palette.danger} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodySm" weight="700">{item.category}</Text>
                    <Text variant="caption" color={palette.inkSecondary} style={{ marginTop: 2 }}>You: {item.you}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', flexShrink: 1, maxWidth: '42%' }}>
                    <Text variant="overline" color={palette.inkTertiary}>THIS ROOM</Text>
                    {/* dark green / red ink for readable contrast on the tinted card (matches bedStatus inks) */}
                    <Text variant="caption" weight="700" align="right" color={item.match ? '#0E7A4B' : '#B42318'} style={{ marginTop: 2 }}>{item.room}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}
