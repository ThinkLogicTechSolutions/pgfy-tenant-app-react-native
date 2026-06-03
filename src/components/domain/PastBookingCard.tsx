/** A previous (completed / moved-out / cancelled) stay. */
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/theme';
import { Text, PressableScale } from '@/components/ui';
import { StatusPill } from './Badges';
import { inr, formatDayMonth } from '@/lib/format';
import type { PastBooking } from '@/data/types';

export function PastBookingCard({ booking, onPress }: { booking: PastBooking; onPress?: () => void }) {
  const b = booking;
  const cancelled = b.status === 'Cancelled';
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.99}
      style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' }}
    >
      <View style={{ flexDirection: 'row', padding: spacing.md, gap: spacing.md }}>
        <Image source={{ uri: b.propertyImage }} style={{ width: 72, height: 72, borderRadius: radius.md, opacity: cancelled ? 0.55 : 1 }} contentFit="cover" />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
            <Text variant="bodyMd" weight="700" numberOfLines={1} style={{ flex: 1 }}>{b.propertyName}</Text>
            <StatusPill status={b.status} small />
          </View>
          <Text variant="caption" color={palette.inkTertiary} numberOfLines={1} style={{ marginTop: 2 }}>
            {b.locality} · {b.type}{!cancelled ? ` · ${b.roomNumber}/${b.bedLabel}` : ''}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <Ionicons name="calendar-outline" size={12} color={palette.inkTertiary} />
            <Text variant="caption" color={palette.inkSecondary}>
              {cancelled ? `Cancelled · ${formatDayMonth(b.checkInDate)}` : `${formatDayMonth(b.checkInDate)} – ${formatDayMonth(b.checkOutDate)} · ${b.durationMonths} mo`}
            </Text>
          </View>
        </View>
      </View>

      {!cancelled ? (
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: palette.border }}>
          <Foot label="Rent" value={`${inr(b.monthlyRent)}/mo`} />
          <View style={{ width: 1, backgroundColor: palette.border }} />
          <Foot label="Total paid" value={inr(b.totalPaid)} />
          <View style={{ width: 1, backgroundColor: palette.border }} />
          <Foot label="You rated" value={b.rating ? `${b.rating}.0 ★` : '—'} accent={b.rating ? palette.star : undefined} />
        </View>
      ) : null}
    </PressableScale>
  );
}

function Foot({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.sm }}>
      <Text variant="bodySm" weight="700" mono color={accent ?? palette.ink}>{value}</Text>
      <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: 1 }}>{label}</Text>
    </View>
  );
}
