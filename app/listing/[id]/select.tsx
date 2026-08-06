/** T-S14 — Room & bed selection grid. Select an available bed → continue. */
import { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Chip, Button, EmptyState, Sheet, PressableScale } from '@/components/ui';
import { BedLegend, SelectableRoom, StatusPill } from '@/components/domain';
import { getListing, type Bed, type Floor, type Room, type RoomRoommatePreference } from '@/data';
import { inr } from '@/lib/format';
import { listingNearLandmarkTitle } from '@/lib/listingDisplay';
import { useProfile } from '@/store/profile';
import { useAuth } from '@/context/AuthContext';
import { computeCompatibility, compatibilityTone, type CompatResult } from '@/lib/compatibility';
import { propertyApi, errorMessage, type ApiBookingMode, type RoommatePreferences } from '@/lib/api';
import { parseApiPropertyId, apiRoomAvailabilityToFloors } from '@/lib/listingAdapter';

const SLEEP_LABEL: Record<string, string> = { EARLY_BIRD: 'Early sleeper', NIGHT_OWL: 'Night owl' };
const DIET_LABEL: Record<string, string> = { VEGETARIAN: 'Vegetarian', VEGAN: 'Vegan', NON_VEGETARIAN: 'Non-vegetarian' };

type CompatSheetData =
  | { kind: 'mock'; room: Room; result: CompatResult }
  | { kind: 'real'; room: Room; score: number };

export default function SelectBed() {
  const { id, checkIn, checkOut, startTime, hours, occupancy, occupancyTitle, acType, selectedRent, bookingType, layout, withFood, propertyName } = useLocalSearchParams<{
    id: string;
    checkIn?: string;
    checkOut?: string;
    startTime?: string;
    hours?: string;
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
  const { user } = useAuth();
  const [floorIdx, setFloorIdx] = useState(0);
  const [sel, setSel] = useState<{ bed: Bed; room: Room } | null>(null);
  const [compatRoom, setCompatRoom] = useState<CompatSheetData | null>(null);

  const apiId = parseApiPropertyId(String(id));
  const compatInput = { occupation: profile.occupation, prefs: profile.prefs };
  const hasAnyPref = apiId
    ? !!user?.roommate_preferences
    : profile.occupation !== null || Object.values(profile.prefs).some((v) => v !== null);

  const selectBed = (bed: Bed, room: Room) => {
    setSel({ bed, room });
  };

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
    // `match_score` is computed server-side against the tenant's own saved preferences, so a
    // room fetched before the tenant filled them in (or edited them) is stuck showing a stale
    // score until refetched — re-run whenever the saved preferences object changes.
  }, [apiId, layout, apiBookingMode, wantsAc, withFood, retryTick, user?.roommate_preferences]);

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
            // Real API rooms carry a server-computed match_score (against the tenant's own
            // saved roommate_preferences) — only mock listings still need the client-side
            // computeCompatibility() estimate against the mock profile store.
            if (apiId) {
              const score = room.matchScore ?? 0;
              const answered = hasAnyPref ? 1 : 0;
              const canShowBreakdown = hasAnyPref && !!room.roommatePrefs?.length;
              return (
                <SelectableRoom
                  key={room.id}
                  room={room}
                  selectedBedId={sel?.bed.id ?? null}
                  onSelectBed={selectBed}
                  priceOverride={selectedOccupancyRent}
                  compatibility={{ score, answered }}
                  onCompatPress={canShowBreakdown ? () => setCompatRoom({ kind: 'real', room, score }) : undefined}
                  subtitleOverride={
                    occupancyTitle
                      ? `${occupancyTitle}${acLabel ? ` · ${acLabel}` : ''} · ${room.beds.filter((b) => b.status === 'available').length} available`
                      : undefined
                  }
                />
              );
            }
            const result = computeCompatibility(compatInput, room.roommateProfile);
            return (
              <SelectableRoom
                key={room.id}
                room={room}
                selectedBedId={sel?.bed.id ?? null}
                onSelectBed={selectBed}
                priceOverride={selectedOccupancyRent}
                compatibility={{ score: result.score, answered: result.answered }}
                onCompatPress={result.answered > 0 ? () => setCompatRoom({ kind: 'mock', room, result }) : undefined}
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
                  startTime: startTime ?? '',
                  hours: hours ?? '',
                  occupancyTitle: occupancyTitle ?? '',
                  acType: acLabel ?? '',
                  bookingType: bookingType ?? 'monthly',
                  // Real-property fields — only meaningful (and only present) for API-backed rooms.
                  ...(apiId ? {
                    propertyId: String(apiId),
                    roomId: sel.room.id,
                    bedId: sel.bed.id,
                    floorId: floor.id,
                    layout: layout ?? '',
                    isAc: String(wantsAc),
                    withFood: withFood ?? 'false',
                  } : {}),
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
                <Text variant="h3" color={compatibilityTone(compatRoom.kind === 'mock' ? compatRoom.result.score : compatRoom.score) === 'success' ? palette.success : compatibilityTone(compatRoom.kind === 'mock' ? compatRoom.result.score : compatRoom.score) === 'warning' ? '#B26A00' : palette.danger}>
                  {compatRoom.kind === 'mock' ? compatRoom.result.score : compatRoom.score}%
                </Text>
              </View>
              <Text variant="bodySm" color={palette.inkSecondary} style={{ flex: 1 }}>
                Based on your preferences vs the roommates currently in this room.
              </Text>
            </View>
            {compatRoom.kind === 'mock' ? (
              <View style={{ gap: spacing.sm }}>
                {compatRoom.result.breakdown.map((item) => (
                  <CompatRow key={item.category} category={item.category} you={item.you} room={item.room} match={item.match} />
                ))}
              </View>
            ) : (
              <View style={{ gap: spacing.lg }}>
                {(compatRoom.room.roommatePrefs ?? []).map((occupant, i) => (
                  <View key={occupant.tenantId} style={{ gap: spacing.sm }}>
                    <Text variant="overline" color={palette.inkTertiary}>
                      {(compatRoom.room.roommatePrefs?.length ?? 0) > 1 ? `ROOMMATE ${i + 1}` : 'ROOMMATE'}
                    </Text>
                    {buildRealBreakdown(user?.roommate_preferences ?? null, occupant).map((item) => (
                      <CompatRow key={item.category} category={item.category} you={item.you} room={item.room} match={item.match} />
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}

function CompatRow({ category, you, room, match }: { category: string; you: string; room: string; match: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: match ? palette.successTint : palette.dangerTint,
      }}
    >
      <Ionicons name={match ? 'checkmark-circle' : 'close-circle'} size={20} color={match ? palette.success : palette.danger} />
      <View style={{ flex: 1 }}>
        <Text variant="bodySm" weight="700">{category}</Text>
        <Text variant="caption" color={palette.inkSecondary} style={{ marginTop: 2 }}>You: {you}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', flexShrink: 1, maxWidth: '42%' }}>
        <Text variant="overline" color={palette.inkTertiary}>THIS ROOM</Text>
        {/* dark green / red ink for readable contrast on the tinted card (matches bedStatus inks) */}
        <Text variant="caption" weight="700" align="right" color={match ? '#0E7A4B' : '#B42318'} style={{ marginTop: 2 }}>{room}</Text>
      </View>
    </View>
  );
}

/** Per-category comparison between the tenant's own saved prefs and one room occupant's —
 * only for categories both sides have actually answered (unanswered ones are silently
 * skipped rather than shown as a mismatch). */
function buildRealBreakdown(mine: RoommatePreferences | null, other: RoomRoommatePreference): { category: string; you: string; room: string; match: boolean }[] {
  if (!mine) return [];
  const items: { category: string; you: string; room: string; match: boolean }[] = [];
  if (mine.smoking_pref != null && other.smokingPref != null) {
    items.push({
      category: 'Smoking',
      you: mine.smoking_pref ? 'Smoking-friendly' : 'Non-smoking',
      room: other.smokingPref ? 'Smoking-friendly' : 'Non-smoking',
      match: mine.smoking_pref === other.smokingPref,
    });
  }
  if (mine.alcohol_pref != null && other.alcoholPref != null) {
    items.push({
      category: 'Alcohol',
      you: mine.alcohol_pref ? 'Alcohol-friendly' : 'No alcohol',
      room: other.alcoholPref ? 'Alcohol-friendly' : 'No alcohol',
      match: mine.alcohol_pref === other.alcoholPref,
    });
  }
  if (mine.sleep_schedule && other.sleepSchedule) {
    items.push({
      category: 'Sleep schedule',
      you: SLEEP_LABEL[mine.sleep_schedule] ?? mine.sleep_schedule,
      room: SLEEP_LABEL[other.sleepSchedule] ?? other.sleepSchedule,
      match: mine.sleep_schedule === other.sleepSchedule,
    });
  }
  if (mine.diet_preference && other.dietPreference) {
    items.push({
      category: 'Diet',
      you: DIET_LABEL[mine.diet_preference] ?? mine.diet_preference,
      room: DIET_LABEL[other.dietPreference] ?? other.dietPreference,
      // Vegetarian & vegan are treated as compatible with each other, matching the mock rule.
      match: mine.diet_preference === other.dietPreference || (mine.diet_preference !== 'NON_VEGETARIAN' && other.dietPreference !== 'NON_VEGETARIAN'),
    });
  }
  return items;
}
