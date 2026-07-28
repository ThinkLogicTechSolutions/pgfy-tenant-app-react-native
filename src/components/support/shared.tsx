/** Shared UI for platform and property support screens. */
import { useState } from 'react';
import { View, Linking, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Sheet, PressableScale, Card, Badge, Button, Divider } from '@/components/ui';
import { statusTone } from '@/components/domain';
import type { Ticket } from '@/data';
import { timeAgo } from '@/lib/format';

const CANCELLABLE: Ticket['status'][] = ['Open', 'Assigned', 'In Progress'];

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <View>
      <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm, marginLeft: 4 }}>
        FAQS
      </Text>
      <View style={{ gap: spacing.sm }}>
        {items.map((item, index) => {
          const open = openIndex === index;
          return (
            <View
              key={item.q}
              style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border }}
            >
              <PressableScale
                onPress={() => setOpenIndex(open ? null : index)}
                scaleTo={0.99}
                haptics={false}
                style={{ paddingHorizontal: spacing.base, paddingVertical: spacing.base }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Text variant="bodyMd" weight="600" style={{ flex: 1 }}>
                    {item.q}
                  </Text>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={palette.inkTertiary} />
                </View>
              </PressableScale>
              {open ? (
                <View style={{ paddingHorizontal: spacing.base, paddingBottom: spacing.base }}>
                  <Text variant="bodySm" color={palette.inkSecondary} style={{ lineHeight: 21 }}>
                    {item.a}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function TicketDetailSheet({
  ticket,
  visible,
  onClose,
  onCancel,
}: {
  ticket: Ticket | null;
  visible: boolean;
  onClose: () => void;
  /** When provided, a "Cancel ticket" action is offered while the ticket is still open. */
  onCancel?: (ticket: Ticket) => void;
}) {
  const cancellable = !!onCancel && !!ticket && CANCELLABLE.includes(ticket.status);

  const confirmCancel = () => {
    if (!ticket || !onCancel) return;
    Alert.alert('Cancel this ticket?', 'The property team will no longer act on this issue.', [
      { text: 'Keep ticket', style: 'cancel' },
      { text: 'Cancel ticket', style: 'destructive', onPress: () => onCancel(ticket) },
    ]);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={ticket ? `${ticket.category} · ${ticket.id}` : ''} scroll>
      {ticket ? (
        <View style={{ gap: spacing.base }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Badge label={ticket.status} tone={statusTone(ticket.status)} />
            <Text variant="caption" color={palette.inkTertiary}>Raised {timeAgo(ticket.createdAt)}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 32, height: 32, borderRadius: radius.sm, backgroundColor: palette.coralTint, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="pricetag-outline" size={16} color={palette.coral} />
            </View>
            <Text variant="bodySm" weight="600">{ticket.category}</Text>
          </View>

          <View>
            <Text variant="caption" color={palette.inkTertiary} style={{ marginBottom: 4 }}>DESCRIPTION</Text>
            <Card style={{ backgroundColor: palette.surfaceRaised }}>
              <Text variant="bodySm" color={palette.inkSecondary} style={{ lineHeight: 20 }}>{ticket.description}</Text>
            </Card>
          </View>

          {ticket.images.length ? (
            <View>
              <Text variant="caption" color={palette.inkTertiary} style={{ marginBottom: spacing.xs }}>PHOTOS</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {ticket.images.map((uri) => (
                  <Image key={uri} source={{ uri }} style={{ width: 72, height: 72, borderRadius: radius.md }} contentFit="cover" />
                ))}
              </View>
            </View>
          ) : null}

          {ticket.response ? (
            <View style={{ backgroundColor: palette.infoTint, borderRadius: radius.md, padding: spacing.base, flexDirection: 'row', gap: spacing.sm }}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={palette.info} />
              <Text variant="bodySm" color={palette.info} style={{ flex: 1 }}>{ticket.response}</Text>
            </View>
          ) : null}
          {ticket.housewise ? (
            <View style={{ borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, padding: spacing.base, gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Ionicons name="construct-outline" size={16} color={palette.coralDark} />
                <Text variant="bodyMd" weight="700" style={{ flex: 1 }}>HouseWise</Text>
              </View>
              <Text variant="bodySm" color={palette.inkSecondary}>
                Sent to HouseWise for servicing · {ticket.housewise.complaintId}
              </Text>
              <PressableScale
                onPress={() => Linking.openURL(ticket.housewise!.url).catch(() => Alert.alert('Cannot open', 'Unable to open HouseWise.'))}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
              >
                <Ionicons name="open-outline" size={16} color={palette.info} />
                <Text variant="bodySm" weight="600" color={palette.info}>View in HouseWise</Text>
              </PressableScale>
            </View>
          ) : null}
          <View>
            <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>TIMELINE</Text>
            {ticket.timeline.map((ev, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: palette.coral, marginTop: 3 }} />
                  {i < ticket.timeline.length - 1 ? (
                    <View style={{ width: 2, flex: 1, backgroundColor: palette.border, marginVertical: 2 }} />
                  ) : null}
                </View>
                <View style={{ flex: 1, paddingBottom: spacing.md }}>
                  <Text variant="bodyMd" weight="600">{ev.status}</Text>
                  {ev.note ? <Text variant="bodySm" color={palette.inkSecondary}>{ev.note}</Text> : null}
                  <Text variant="caption" color={palette.inkTertiary}>{timeAgo(ev.at)}</Text>
                </View>
              </View>
            ))}
          </View>

          {onCancel ? (
            <>
              <Divider />
              {cancellable ? (
                <Button label="Cancel ticket" variant="outline" icon="close-circle-outline" full onPress={confirmCancel} />
              ) : ticket.status === 'Cancelled' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm }}>
                  <Ionicons name="close-circle" size={18} color={palette.danger} />
                  <Text variant="bodyMd" weight="600" color={palette.danger}>Ticket cancelled</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm }}>
                  <Ionicons name="checkmark-circle" size={18} color={palette.success} />
                  <Text variant="bodyMd" weight="600" color={palette.success}>Resolved</Text>
                </View>
              )}
            </>
          ) : null}
        </View>
      ) : null}
    </Sheet>
  );
}

export function OptionalImagePicker() {
  return (
    <View>
      <Text variant="caption" color={palette.inkSecondary} style={{ marginBottom: spacing.sm }}>Optional images (up to 3)</Text>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: 64,
              height: 64,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: palette.border,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: palette.surface,
            }}
          >
            <Ionicons name="camera-outline" size={22} color={palette.inkTertiary} />
          </View>
        ))}
      </View>
    </View>
  );
}
