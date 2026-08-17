/** Review card + post-booking rows (invoice, visitor, ticket, notification). */
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/theme';
import { Text, Avatar, PressableScale, Card, Badge } from '@/components/ui';
import { StatusPill, statusTone } from './Badges';
import { inr, formatDate, formatDayMonth, timeAgo } from '@/lib/format';
import type { Review, Invoice, Visitor, Ticket, TicketCategory } from '@/data/types';
import type { ApiTenantNotification, TenantNotificationAction } from '@/lib/api';

/* Review */
export function ReviewCard({ review }: { review: Review }) {
  return (
    <View style={{ width: 260, backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.base, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Avatar name={review.author} uri={review.avatar} size={36} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyMd" weight="600">{review.author}</Text>
          <Text variant="caption" color={palette.inkTertiary}>{formatDate(review.date)}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Ionicons name="star" size={13} color={palette.star} />
          <Text variant="bodySm" weight="700">{review.rating.toFixed(1)}</Text>
        </View>
      </View>
      <Text variant="bodySm" color={palette.inkSecondary} numberOfLines={4} style={{ lineHeight: 19 }}>{review.text}</Text>
    </View>
  );
}

/* Invoice */
export function InvoiceRow({ invoice, onPress }: { invoice: Invoice; onPress?: () => void }) {
  const i = invoice;
  const color = i.status === 'Paid' ? palette.success : i.status === 'Partial' ? palette.warning : palette.danger;
  return (
    <PressableScale onPress={onPress} scaleTo={0.99} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
      <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: color + '1A', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="receipt-outline" size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyMd" weight="600" numberOfLines={1}>{i.label}</Text>
        <Text variant="caption" color={palette.inkTertiary}>{i.id} · due {formatDayMonth(i.dueDate)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text variant="bodyMd" weight="700" mono>{inr(i.amount)}</Text>
        <Text variant="caption" weight="600" color={color}>{i.status}</Text>
      </View>
    </PressableScale>
  );
}

/* Visitor */
export function VisitorCard({ visitor, onShare }: { visitor: Visitor; onShare?: () => void }) {
  const v = visitor;
  const active = v.status === 'Pending';
  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: active ? palette.coral : palette.border, padding: spacing.base, gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyMd" weight="600">{v.name}</Text>
          <Text variant="caption" color={palette.inkTertiary}>{v.phone} · {formatDayMonth(v.visitDate)} {v.visitTime}</Text>
        </View>
        <StatusPill status={v.status} small dot />
      </View>
      {active ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: palette.coralTint, borderRadius: radius.md, padding: spacing.md }}>
          <View>
            <Text variant="caption" color={palette.coralDark}>VISITOR OTP</Text>
            <Text variant="h2" mono color={palette.coralDark} style={{ letterSpacing: 4 }}>{v.otp}</Text>
          </View>
          <PressableScale onPress={onShare} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: palette.coral, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md }}>
            <Ionicons name="share-social-outline" size={15} color={palette.white} />
            <Text variant="bodySm" weight="600" color={palette.white}>Share</Text>
          </PressableScale>
        </View>
      ) : (
        <Text variant="caption" color={palette.inkTertiary}>In {v.inTime ?? '—'} · Out {v.outTime ?? '—'}</Text>
      )}
    </View>
  );
}

/* Ticket */
const CAT_ICON: Record<TicketCategory, keyof typeof Ionicons.glyphMap> = {
  Electrical: 'flash-outline', Plumbing: 'water-outline', Housekeeping: 'sparkles-outline',
  'Wi-Fi': 'wifi-outline', Food: 'restaurant-outline', 'Water supply': 'water-outline',
  'AC / cooling': 'snow-outline', Security: 'shield-checkmark-outline', 'Noise complaint': 'volume-mute-outline',
  'Room maintenance': 'hammer-outline', Other: 'construct-outline',
  'KYC verification issue': 'shield-checkmark-outline',
  'Invoice issue': 'receipt-outline',
  'Login or account issue': 'person-circle-outline',
  'Delete account request': 'trash-outline',
};

export function TicketRow({ ticket, onPress }: { ticket: Ticket; onPress?: () => void }) {
  const t = ticket;
  return (
    <PressableScale onPress={onPress} scaleTo={0.99}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
          <Badge label={t.status} tone={statusTone(t.status)} />
          <Text variant="caption" color={palette.inkTertiary}>{timeAgo(t.createdAt)}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ width: 30, height: 30, borderRadius: radius.sm, backgroundColor: palette.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={CAT_ICON[t.category]} size={16} color={palette.inkSecondary} />
          </View>
          <Text variant="bodyMd" weight="700" numberOfLines={1} style={{ flex: 1 }}>{t.category}</Text>
        </View>
        <Text variant="bodySm" color={palette.inkSecondary} numberOfLines={2} style={{ marginTop: spacing.xs }}>{t.description}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }}>
          <Text variant="caption" color={palette.inkTertiary}>{t.id}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="bodySm" color={palette.info} weight="600">View details</Text>
            <Ionicons name="chevron-forward" size={16} color={palette.info} />
          </View>
        </View>
      </Card>
    </PressableScale>
  );
}

/* Notification */
const NOTIF_ICON: Record<string, { icon: keyof typeof Ionicons.glyphMap; tint: string }> = {
  PROFILE: { icon: 'person-outline', tint: palette.navy },
  SUPPORT: { icon: 'help-buoy-outline', tint: palette.success },
  BOOKING: { icon: 'calendar-outline', tint: palette.coral },
  INVOICE: { icon: 'receipt-outline', tint: palette.warning },
  MAINTENANCE: { icon: 'construct-outline', tint: palette.success },
  PAYOUT: { icon: 'cash-outline', tint: palette.success },
  LEASE: { icon: 'document-text-outline', tint: palette.navy },
  REWARD: { icon: 'gift-outline', tint: palette.coral },
  KYC: { icon: 'shield-checkmark-outline', tint: palette.info },
  ANNOUNCEMENT: { icon: 'megaphone-outline', tint: palette.info },
  BROADCAST: { icon: 'megaphone-outline', tint: palette.info },
  VISITOR: { icon: 'people-outline', tint: palette.info },
  MOVE_OUT: { icon: 'exit-outline', tint: palette.danger },
  BED_CHANGE: { icon: 'swap-horizontal-outline', tint: palette.navy },
  TRANSACTION: { icon: 'card-outline', tint: palette.success },
  SUBSCRIPTION: { icon: 'refresh-outline', tint: palette.navy },
};
const DEFAULT_NOTIF_ICON: { icon: keyof typeof Ionicons.glyphMap; tint: string } = { icon: 'notifications-outline', tint: palette.inkTertiary };

export function notificationIcon(action: TenantNotificationAction) {
  return NOTIF_ICON[action] ?? DEFAULT_NOTIF_ICON;
}

export function NotificationRow({ item, onPress }: { item: ApiTenantNotification; onPress?: () => void }) {
  const meta = notificationIcon(item.action);
  const unread = item.status === 'UNSEEN';
  return (
    <PressableScale onPress={onPress} scaleTo={0.99} style={{ flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.base, backgroundColor: unread ? palette.coralTint + '55' : 'transparent', borderRadius: radius.md }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: meta.tint + '1A', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={meta.icon} size={19} color={meta.tint} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text variant="bodyMd" weight="600" numberOfLines={1} style={{ flex: 1 }}>{item.title}</Text>
          {unread ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.coral }} /> : null}
        </View>
        <Text variant="bodySm" color={palette.inkSecondary} numberOfLines={2} style={{ marginTop: 1 }}>{item.message}</Text>
        <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: 3 }}>{timeAgo(item.created_at)}</Text>
      </View>
    </PressableScale>
  );
}
