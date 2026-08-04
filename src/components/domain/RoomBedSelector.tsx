/** Room & bed selection grid (T-S14) — tap an available bed to select it. */
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing, bedStatus } from '@/theme';
import type { BedStatusKey } from '@/theme/colors';
import { Text, PressableScale } from '@/components/ui';
import { compatibilityTone } from '@/lib/compatibility';
import type { Room, Bed } from '@/data/types';

const COMPAT_COLOR: Record<'success' | 'warning' | 'danger', { fg: string; bg: string }> = {
  success: { fg: palette.success, bg: palette.successTint },
  warning: { fg: '#B26A00', bg: palette.warningTint },
  danger: { fg: palette.danger, bg: palette.dangerTint },
};

export interface RoomCompatibility {
  score: number;
  answered: number;
}

const ORDER: BedStatusKey[] = ['available', 'occupied', 'reserved', 'pending'];

export function BedLegend() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, rowGap: spacing.sm }}>
      {ORDER.map((k) => (
        <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: bedStatus[k].solid }} />
          <Text variant="caption" color={palette.inkSecondary}>{bedStatus[k].label}</Text>
        </View>
      ))}
    </View>
  );
}

function displayBedLabel(bed: Bed, index: number) {
  return /^B\d+$/i.test(bed.label) ? bed.label.toUpperCase() : `B${index + 1}`;
}

export function SelectableBed({ bed, selected, onPress }: { bed: Bed; selected: boolean; onPress: () => void }) {
  const isAvailable = bed.status === 'available';
  const s = selected ? bedStatus.pending : bedStatus[bed.status];
  return (
    <PressableScale
      onPress={isAvailable ? onPress : undefined}
      scaleTo={isAvailable ? 0.88 : 1}
      haptics={isAvailable}
      style={{
        width: 48, height: 48, borderRadius: radius.bed, alignItems: 'center', justifyContent: 'center',
        backgroundColor: selected ? bedStatus.pending.solid : s.tint,
        borderWidth: selected ? 0 : 1,
        borderColor: s.solid + '55',
        opacity: isAvailable || selected ? 1 : 0.85,
      }}
    >
      <Text variant="bodyMd" weight="700" color={selected ? palette.white : s.ink}>{bed.label}</Text>
    </PressableScale>
  );
}

export function SelectableRoom({
  room, selectedBedId, onSelectBed, priceOverride, subtitleOverride, compatibility, onCompatPress,
}: {
  room: Room;
  selectedBedId: string | null;
  onSelectBed: (bed: Bed, room: Room) => void;
  priceOverride?: number;
  subtitleOverride?: string;
  compatibility?: RoomCompatibility;
  onCompatPress?: () => void;
}) {
  const occupied = room.beds.filter((b) => b.status === 'occupied').length;
  const available = room.beds.filter((b) => b.status === 'available').length;
  const hasAc = room.amenities.includes('AC');
  const roomRent = priceOverride ?? room.rent;
  const compat = compatibility && compatibility.answered > 0 ? COMPAT_COLOR[compatibilityTone(compatibility.score)] : null;
  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.md, gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyMd" weight="700">Room {room.number}</Text>
          <Text variant="caption" color={palette.inkSecondary} style={{ marginTop: 2 }}>
            {subtitleOverride ?? `${room.sharingType} · ${hasAc ? 'AC' : 'Non-AC'} · ${available} available`}
          </Text>
          {compat && compatibility ? (
            <PressableScale
              onPress={onCompatPress}
              haptics={false}
              scaleTo={onCompatPress ? 0.96 : 1}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, alignSelf: 'flex-start', backgroundColor: compat.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}
            >
              <Ionicons name="people" size={12} color={compat.fg} />
              <Text variant="caption" weight="700" color={compat.fg}>{compatibility.score}% roommate match</Text>
              {onCompatPress ? <Ionicons name="information-circle-outline" size={13} color={compat.fg} /> : null}
            </PressableScale>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="caption" color={palette.inkTertiary}>{occupied}/{room.capacity} filled</Text>
          <Text variant="bodySm" weight="700" color={palette.navy} style={{ marginTop: 2 }}>
            ₹{roomRent.toLocaleString('en-IN')}/mo
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {room.beds.map((b, i) => (
          <SelectableBed
            key={b.id}
            bed={{ ...b, label: displayBedLabel(b, i) }}
            selected={selectedBedId === b.id}
            onPress={() => onSelectBed({ ...b, label: displayBedLabel(b, i) }, room)}
          />
        ))}
      </View>
    </View>
  );
}
