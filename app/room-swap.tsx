/** T-S24 — Room swap request (`/tenant/change-bed`). Checks for an already-scheduled
 *  request first; if one's pending, shows a review-status screen instead of the picker. */
import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Input, Chip, Divider, EmptyState, Sheet } from '@/components/ui';
import { BedLegend, SelectableBed } from '@/components/domain';
import { changeBedApi, errorMessage, type ApiSwapFloorGroup, type ApiSwapRoom, type ApiSwapBed, type ApiChangeBedRequest } from '@/lib/api';
import { formatLayoutFallback, BED_STATUS_MAP } from '@/lib/listingAdapter';
import type { Bed } from '@/data/types';
import { inr, formatDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { alert } from '@/lib/alertDialog';

export default function RoomSwap() {
  const { bookingId: bookingIdParam, roomNumber, bedNumber, currentRent: currentRentParam } = useLocalSearchParams<{
    bookingId?: string;
    roomNumber?: string;
    bedNumber?: string;
    currentRent?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bookingId = Number(bookingIdParam);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<ApiChangeBedRequest | null>(null);

  const [floorGroups, setFloorGroups] = useState<ApiSwapFloorGroup[] | null>(null);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  const [layoutFilter, setLayoutFilter] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadRooms = () => {
    setRoomsLoading(true);
    setRoomsError(null);
    changeBedApi.getAvailableSwapRooms(bookingId)
      .then(setFloorGroups)
      .catch((e) => setRoomsError(errorMessage(e)))
      .finally(() => setRoomsLoading(false));
  };

  const load = () => {
    if (!Number.isFinite(bookingId)) { setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    changeBedApi.getScheduledChangeBed(bookingId)
      .then((res) => {
        setScheduled(res);
        if (!res || res.status !== 'SCHEDULED') loadRooms();
      })
      .catch((e) => setLoadError(errorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [bookingId]);

  const availableLayouts = useMemo(() => {
    if (!floorGroups) return [];
    const set = new Set<string>();
    floorGroups.forEach((f) => f.rooms.forEach((r) => set.add(r.layout)));
    return Array.from(set);
  }, [floorGroups]);

  const filteredFloorGroups = useMemo(() => {
    if (!floorGroups) return [];
    return floorGroups
      .map((f) => ({ ...f, rooms: layoutFilter ? f.rooms.filter((r) => r.layout === layoutFilter) : f.rooms }))
      .filter((f) => f.rooms.length > 0);
  }, [floorGroups, layoutFilter]);

  const selectedRoom = useMemo<ApiSwapRoom | null>(() => {
    if (selectedRoomId == null || !floorGroups) return null;
    for (const f of floorGroups) {
      const r = f.rooms.find((rm) => rm.id === selectedRoomId);
      if (r) return r;
    }
    return null;
  }, [floorGroups, selectedRoomId]);

  const selectBed = (room: ApiSwapRoom, bed: ApiSwapBed) => {
    setSelectedRoomId(room.id);
    setSelectedBedId(bed.id);
  };

  const currentRent = currentRentParam ? Number(currentRentParam) : null;
  const rentDelta = selectedRoom?.monthly_rent != null && currentRent != null
    ? selectedRoom.monthly_rent - currentRent
    : null;

  const submit = async () => {
    if (!selectedBedId || !reason.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await changeBedApi.createChangeBedRequest({
        booking_id: bookingId,
        target_bed_id: selectedBedId,
        reason: reason.trim(),
      });
      haptic.success();
      const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/stay'));
      alert(
        'Request submitted',
        `You can move in to ${res.to.room?.room_number ?? 'the new room'} · Bed ${res.to.bed?.bed_number ?? '—'} after ${formatDate(res.effective_on)}.`,
        [{ text: 'OK', onPress: goBack }],
      );
    } catch (e) {
      haptic.error();
      alert("Couldn't submit request", errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCancel = async () => {
    if (!scheduled || !cancelReason.trim() || cancelling) return;
    setCancelling(true);
    try {
      const res = await changeBedApi.cancelChangeBedRequest(scheduled.id, {
        booking_id: bookingId,
        cancel_reason: cancelReason.trim(),
      });
      haptic.success();
      setCancelOpen(false);
      setCancelReason('');
      setScheduled(res);
      setSelectedRoomId(null);
      setSelectedBedId(null);
      setReason('');
      loadRooms();
    } catch (e) {
      haptic.error();
      alert("Couldn't cancel request", errorMessage(e));
    } finally {
      setCancelling(false);
    }
  };

  if (!Number.isFinite(bookingId)) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
        <ScreenHeader title="Room swap" />
        <EmptyState title="Booking not found" message="We couldn't tell which booking this is for." />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }}>
        <ActivityIndicator color={palette.coral} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
        <ScreenHeader title="Room swap" />
        <EmptyState title="Couldn't load room swap" message={loadError} actionLabel="Retry" onAction={load} />
      </View>
    );
  }

  // A request is already awaiting owner review — nothing else to do here but wait or cancel.
  if (scheduled && scheduled.status === 'SCHEDULED') {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
        <ScreenHeader title="Room swap" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.base }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: palette.navyTint, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="hourglass-outline" size={32} color={palette.navy} />
          </View>
          <Text variant="h2" align="center">Your request is under review</Text>
          <Text variant="bodyMd" color={palette.inkSecondary} align="center">
            We'll notify you shortly.
          </Text>

          <Card style={{ width: '100%', marginTop: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
              <View style={{ alignItems: 'center' }}>
                <Text variant="caption" color={palette.inkTertiary}>FROM</Text>
                <Text variant="bodyMd" weight="700">{scheduled.from.room?.room_number ?? '—'} · {scheduled.from.bed?.bed_number ?? '—'}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={palette.navy} />
              <View style={{ alignItems: 'center' }}>
                <Text variant="caption" color={palette.inkTertiary}>TO</Text>
                <Text variant="bodyMd" weight="700" color={palette.coralDark}>{scheduled.to.room?.room_number ?? '—'} · {scheduled.to.bed?.bed_number ?? '—'}</Text>
              </View>
            </View>
            <Divider style={{ marginVertical: spacing.md }} />
            <Text variant="caption" color={palette.inkTertiary} align="center">Requested on {formatDate(scheduled.requested_on)}</Text>
            {scheduled.reason ? <Text variant="bodySm" color={palette.inkSecondary} align="center" style={{ marginTop: 4 }}>"{scheduled.reason}"</Text> : null}
          </Card>

          <View style={{ width: '100%', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button label="Cancel request" variant="danger" icon="close-circle-outline" full onPress={() => setCancelOpen(true)} />
            <Button label="Back" variant="outline" full onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/stay'))} />
          </View>
        </View>

        <Sheet visible={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel request" scroll>
          <View style={{ gap: spacing.base }}>
            <Input
              label="Reason for cancelling"
              placeholder="Tell us why you're cancelling…"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
            />
            <Button
              label="Confirm cancellation"
              full
              size="lg"
              variant="danger"
              disabled={!cancelReason.trim()}
              loading={cancelling}
              onPress={confirmCancel}
            />
            <Button label="Keep request" variant="ghost" full onPress={() => setCancelOpen(false)} disabled={cancelling} />
          </View>
        </Sheet>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Room swap" subtitle="Request a change in room / bed" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + 110, gap: spacing.base }} showsVerticalScrollIndicator={false}>
        {roomNumber ? (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 46, height: 46, borderRadius: radius.md, backgroundColor: palette.navyTint, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="bed-outline" size={22} color={palette.navy} />
            </View>
            <View>
              <Text variant="overline" color={palette.inkTertiary}>CURRENT ROOM</Text>
              <Text variant="bodyMd" weight="700">Room {roomNumber}{bedNumber ? ` · Bed ${bedNumber}` : ''}</Text>
            </View>
          </Card>
        ) : null}

        {availableLayouts.length > 1 ? (
          <View>
            <Text variant="bodyMd" weight="600" style={{ marginBottom: spacing.sm }}>Filter by room type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              <Chip label="All" active={layoutFilter == null} onPress={() => setLayoutFilter(null)} />
              {availableLayouts.map((l) => (
                <Chip key={l} label={formatLayoutFallback(l)} active={layoutFilter === l} onPress={() => setLayoutFilter(l)} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View>
          {/* <Card style={{ marginBottom: spacing.base }}>
            <Text variant="bodyMd" weight="700" style={{ marginBottom: spacing.sm }}>Bed availability</Text>
            <BedLegend />
          </Card> */}
          <Text variant="bodyMd" weight="600" style={{ marginBottom: spacing.sm }}>Available rooms</Text>
          {roomsLoading ? (
            <ActivityIndicator color={palette.coral} style={{ marginTop: spacing.md }} />
          ) : roomsError ? (
            <EmptyState title="Couldn't load rooms" message={roomsError} actionLabel="Retry" onAction={loadRooms} />
          ) : filteredFloorGroups.length === 0 ? (
            <Text variant="bodySm" color={palette.inkTertiary}>No rooms available for swap right now.</Text>
          ) : (
            <View style={{ gap: spacing.base }}>
              {filteredFloorGroups.map((f) => (
                <View key={f.id} style={{ gap: spacing.sm }}>
                  <Text variant="overline" color={palette.inkTertiary}>{f.name.toUpperCase()}</Text>
                  {f.rooms.map((r) => (
                    <SwapRoomCard key={r.id} room={r} selectedBedId={selectedBedId} onSelectBed={(bed) => selectBed(r, bed)} />
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>

        {selectedRoom && selectedBedId ? (
          <>
            <Card style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
                <View style={{ alignItems: 'center' }}>
                  <Text variant="caption" color={palette.inkTertiary}>From</Text>
                  <Text variant="bodyMd" weight="700" color={palette.navy} style={{ marginTop: 2 }}>{roomNumber ?? '—'} · {bedNumber ?? '—'}</Text>
                </View>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: palette.navyTint, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="swap-horizontal" size={18} color={palette.navy} />
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text variant="caption" color={palette.inkTertiary}>To</Text>
                  <Text variant="bodyMd" weight="700" color={palette.navy} style={{ marginTop: 2 }}>
                    {selectedRoom.room_number} · {selectedRoom.beds.find((b) => b.id === selectedBedId)?.bed_number}
                  </Text>
                </View>
              </View>
              {rentDelta != null && currentRent != null && selectedRoom.monthly_rent != null ? (
                <>
                  <Divider />
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text variant="bodySm" color={palette.inkSecondary}>Rent impact</Text>
                    <Text variant="bodySm" weight="700" color={palette.danger} mono>
                      {inr(currentRent)} → {inr(selectedRoom.monthly_rent)} ({rentDelta > 0 ? '+' : '-'}{inr(Math.abs(rentDelta))})
                    </Text>
                  </View>
                </>
              ) : null}
            </Card>
            <Input
              label="Reason for swap"
              placeholder="Tell us why (max 300 chars)"
              value={reason}
              onChangeText={setReason}
              multiline
              maxLength={300}
              style={{ height: 90, textAlignVertical: 'top' }}
            />
          </>
        ) : null}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
        <Button
          label="Submit request"
          disabled={!selectedBedId || !reason.trim()}
          loading={submitting}
          onPress={submit}
          full
          size="lg"
        />
      </View>
    </View>
  );
}

/** Mirrors `SelectableRoom`'s look (booking flow's room/bed picker) — round status-coded bed
 * tiles instead of the old pill-shaped "Bed X" chips, so both flows feel like the same UI. */
function SwapRoomCard({ room, selectedBedId, onSelectBed }: {
  room: ApiSwapRoom;
  selectedBedId: number | null;
  onSelectBed: (bed: ApiSwapBed) => void;
}) {
  // No MONTHLY rate card configured for this room's layout — nothing to charge, so its beds
  // can't be picked (`SelectableBed` only allows a press when `status === 'available'`).
  const priceUnavailable = room.monthly_rent == null;
  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.md, gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyMd" weight="700">Room {room.room_number}</Text>
          <Text variant="caption" color={palette.inkSecondary} style={{ marginTop: 2 }}>
            {formatLayoutFallback(room.layout)}{room.is_ac ? ' · AC' : ' · Non-AC'} · {room.available_count} bed{room.available_count === 1 ? '' : 's'} available
          </Text>
        </View>
        {room.monthly_rent != null ? (
          <Text variant="bodySm" weight="700" color={palette.navy} mono>{inr(room.monthly_rent)}<Text variant="caption" color={palette.inkTertiary}>/mo</Text></Text>
        ) : (
          <Text variant="caption" weight="600" color={palette.inkTertiary}>Price not set</Text>
        )}
      </View>
      {/* {priceUnavailable ? (
        <Text variant="caption" color={palette.warning}>Monthly pricing isn't set up for this room yet, so it can't be selected.</Text>
      ) : null} */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {room.beds.map((bd) => {
          const bed: Bed = {
            id: String(bd.id),
            label: bd.bed_number,
            status: priceUnavailable ? 'blocked' : (BED_STATUS_MAP[bd.status] ?? 'occupied'),
            gender: 'Co-ed',
            rent: room.monthly_rent ?? 0,
          };
          return (
            <SelectableBed
              key={bd.id}
              bed={bed}
              selected={selectedBedId === bd.id}
              onPress={() => onSelectBed(bd)}
            />
          );
        })}
      </View>
    </View>
  );
}
