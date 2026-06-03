/** Countdown banner for the active bed hold (shown in the booking flow). */
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Button } from '@/components/ui';
import { useHold, formatHold } from '@/store/hold';

export function HoldBanner({ onPick }: { onPick?: () => void }) {
  const hold = useHold();

  if (hold.expired) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.base, marginBottom: spacing.sm, backgroundColor: palette.dangerTint, borderRadius: radius.md, padding: spacing.md }}>
        <Ionicons name="timer-outline" size={20} color={palette.danger} />
        <View style={{ flex: 1 }}>
          <Text variant="bodySm" weight="700" color={palette.danger}>Your hold expired</Text>
          <Text variant="caption" color={palette.danger}>The bed was released. Pick again to continue.</Text>
        </View>
        {onPick ? <Button label="Pick again" size="sm" variant="danger" onPress={onPick} /> : null}
      </View>
    );
  }

  if (!hold.active) return null;
  const low = hold.secondsLeft <= 60;
  const fg = low ? palette.danger : '#B26A00';
  const bg = low ? palette.dangerTint : palette.warningTint;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.base, marginBottom: spacing.sm, backgroundColor: bg, borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
      <Ionicons name="timer-outline" size={18} color={fg} />
      <Text variant="bodySm" color={fg} style={{ flex: 1 }}>
        Bed {hold.roomNumber}-{hold.bedLabel} is held for you
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: fg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill }}>
        <Text variant="caption" weight="700" mono color={palette.white}>{formatHold(hold.secondsLeft)}</Text>
      </View>
    </View>
  );
}
