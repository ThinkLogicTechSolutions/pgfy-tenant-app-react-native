/** T-S24 — Room swap request. */
import { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Input, Chip, PressableScale, Divider } from '@/components/ui';
import { SuccessBurst } from '@/components/illustrations';
import { ACTIVE_BOOKING, AVAILABLE_SWAP_ROOMS } from '@/data';
import { inr } from '@/lib/format';
import { haptic } from '@/lib/haptics';

const TARGETS = ['Single', 'Double', 'Triple', '4-sharing'] as const;
const CURRENT_SHARING = ACTIVE_BOOKING.sharingType;

export default function RoomSwap() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [target, setTarget] = useState<string>(
    TARGETS.find((t) => t !== CURRENT_SHARING) ?? 'Single',
  );
  const [room, setRoom] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const matching = useMemo(() => AVAILABLE_SWAP_ROOMS.filter((r) => r.sharing === target), [target]);
  const selectedRoom = useMemo(() => matching.find((r) => r.room === room) ?? null, [matching, room]);

  const billingImpact = useMemo(() => {
    if (!selectedRoom) return null;

    const oldRent = ACTIVE_BOOKING.monthlyRent;
    const newRent = selectedRoom.rent;
    const extraCharges = newRent - oldRent;

    return { oldRent, newRent, extraCharges };
  }, [selectedRoom]);

  if (done) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <SuccessBurst size={170} />
        <Text variant="h1" align="center" style={{ marginTop: spacing.lg }}>Request submitted</Text>
        <Text variant="bodyLg" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.sm, maxWidth: 300 }}>
          Your room-swap request is pending manager approval. On approval, billing & a new agreement are auto-triggered.
        </Text>
        <Button label="Back to stay" onPress={() => router.replace('/(tabs)/stay')} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Room swap" subtitle="Request a change in room / sharing" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + 110, gap: spacing.base }} showsVerticalScrollIndicator={false}>
        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>CURRENT ROOM</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 46, height: 46, borderRadius: radius.md, backgroundColor: palette.navyTint, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="bed-outline" size={22} color={palette.navy} />
            </View>
            <View>
              <Text variant="bodyMd" weight="700">Room {ACTIVE_BOOKING.roomNumber} · Bed {ACTIVE_BOOKING.bedLabel}</Text>
              <Text variant="caption" color={palette.inkSecondary}>{ACTIVE_BOOKING.sharingType} · {inr(ACTIVE_BOOKING.monthlyRent)}/mo</Text>
            </View>
          </View>
        </Card>

        <View>
          <Text variant="bodyMd" weight="600" style={{ marginBottom: spacing.sm }}>Target sharing type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {TARGETS.map((t) => {
              const isCurrent = t === CURRENT_SHARING;
              return (
                <Chip
                  key={t}
                  label={isCurrent ? `${t} (current)` : t}
                  active={target === t}
                  onPress={isCurrent ? undefined : () => { setTarget(t); setRoom(null); }}
                  style={isCurrent ? { opacity: 0.45 } : undefined}
                />
              );
            })}
          </View>
        </View>

        <View>
          <Text variant="bodyMd" weight="600" style={{ marginBottom: spacing.sm }}>Available rooms</Text>
          {matching.length ? matching.map((r) => (
            <PressableScale key={r.room} onPress={() => setRoom(r.room)} scaleTo={0.99} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.base, borderRadius: radius.md, borderWidth: 1.5, borderColor: room === r.room ? palette.coral : palette.border, backgroundColor: room === r.room ? palette.coralTint : palette.surface, marginBottom: spacing.sm }}>
              <Ionicons name={room === r.room ? 'radio-button-on' : 'radio-button-off'} size={20} color={room === r.room ? palette.coral : palette.borderStrong} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyMd" weight="600">Room {r.room}</Text>
                <Text variant="caption" color={palette.inkSecondary}>{r.sharing} · {r.available} available</Text>
              </View>
              <Text variant="bodyMd" weight="700" mono color={palette.navy}>{inr(r.rent)}<Text variant="caption" color={palette.inkTertiary}>/mo</Text></Text>
            </PressableScale>
          )) : (
            <Text variant="bodySm" color={palette.inkTertiary}>No rooms available for this sharing type right now.</Text>
          )}
        </View>

        <Input label="Reason for swap" placeholder="Tell us why (max 300 chars)" multiline maxLength={300} style={{ height: 90, textAlignVertical: 'top' }} />

        {billingImpact ? (
          <Card>
            <BillRow k="Old rent" v={`${inr(billingImpact.oldRent)}/mo`} />
            <BillRow k={`New rent · Room ${selectedRoom!.room}`} v={`${inr(billingImpact.newRent)}/mo`} />
            <BillRow
              k={billingImpact.extraCharges > 0 ? 'Extra charges' : billingImpact.extraCharges < 0 ? 'Less charges' : 'Extra charges'}
              v={
                billingImpact.extraCharges === 0
                  ? inr(0)
                  : `${billingImpact.extraCharges > 0 ? '+ ' : '− '}${inr(Math.abs(billingImpact.extraCharges))}/mo`
              }
              bold
              last
              accent={billingImpact.extraCharges > 0 ? palette.danger : billingImpact.extraCharges < 0 ? palette.success : palette.ink}
            />
          </Card>
        ) : null}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
        <Button label="Submit request" disabled={!room} onPress={() => { haptic.success(); setDone(true); }} full size="lg" />
      </View>
    </View>
  );
}

function BillRow({
  k,
  v,
  bold,
  last,
  accent,
}: {
  k: string;
  v: string;
  bold?: boolean;
  last?: boolean;
  accent?: string;
}) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm }}>
        <Text
          variant={bold ? 'bodyMd' : 'bodySm'}
          weight={bold ? '700' : '400'}
          color={bold ? palette.ink : palette.inkSecondary}
          style={{ flex: 1, paddingRight: spacing.sm }}
        >
          {k}
        </Text>
        <Text variant={bold ? 'bodyMd' : 'bodySm'} weight={bold ? '700' : '600'} mono color={accent ?? (bold ? palette.navy : palette.ink)}>
          {v}
        </Text>
      </View>
      {!last ? <Divider /> : null}
    </View>
  );
}
