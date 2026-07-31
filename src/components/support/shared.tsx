/** Shared UI for platform and property support screens. */
import { useState } from 'react';
import { View, Linking, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Sheet, PressableScale } from '@/components/ui';
import { StatusPill } from '@/components/domain';
import type { Ticket } from '@/data';
import { timeAgo } from '@/lib/format';
import { uploadApi, errorMessage } from '@/lib/api';
import { alert } from '@/lib/alertDialog';

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
}: {
  ticket: Ticket | null;
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={ticket ? `${ticket.category} · ${ticket.id}` : ''} scroll>
      {ticket ? (
        <View style={{ gap: spacing.base }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="caption" color={palette.inkTertiary}>Raised {timeAgo(ticket.createdAt)}</Text>
            <StatusPill status={ticket.status} small />
          </View>
          <View style={{ backgroundColor: palette.surfaceRaised, borderRadius: radius.md, padding: spacing.base }}>
            <Text variant="body" color={palette.inkSecondary}>{ticket.description}</Text>
          </View>
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
        </View>
      ) : null}
    </Sheet>
  );
}

interface ImageSlot {
  id: string;
  localUri: string;
  status: 'uploading' | 'done' | 'error';
  link: string | null;
}

/** Picks up to `max` photos from the gallery, uploads each immediately, and reports the
 * uploaded links (only the successfully-uploaded ones) back to the parent — a ticket is
 * submitted with whatever finished uploading, not the raw local URIs. */
export function OptionalImagePicker({
  onChange,
  max = 3,
  uploader = uploadApi.uploadMaintenanceImage,
}: {
  onChange: (links: string[]) => void;
  max?: number;
  /** Defaults to the maintenance-ticket uploader; pass a different `uploadApi.*` wrapper for
   *  other photo-attachment contexts (e.g. `uploadPropertyLeadImage`). */
  uploader?: (uri: string) => Promise<{ link: string }>;
}) {
  const [slots, setSlots] = useState<ImageSlot[]>([]);

  const emit = (next: ImageSlot[]) => {
    onChange(next.filter((s) => s.status === 'done' && s.link).map((s) => s.link as string));
  };

  const pick = async () => {
    const remaining = max - slots.length;
    if (remaining <= 0) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Permission required', 'Allow gallery access to attach photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: remaining > 1,
      selectionLimit: remaining,
    });
    if (result.canceled || !result.assets.length) return;

    const picked = result.assets.slice(0, remaining);
    const newSlots: ImageSlot[] = picked.map((a, i) => ({
      id: `${Date.now()}-${i}`,
      localUri: a.uri,
      status: 'uploading',
      link: null,
    }));
    setSlots((prev) => [...prev, ...newSlots]);

    for (const slot of newSlots) {
      try {
        const uploaded = await uploader(slot.localUri);
        setSlots((prev) => {
          const next = prev.map((s) => (s.id === slot.id ? { ...s, status: 'done' as const, link: uploaded.link } : s));
          emit(next);
          return next;
        });
      } catch (e) {
        setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, status: 'error' as const } : s)));
        alert("Couldn't upload photo", errorMessage(e));
      }
    }
  };

  const remove = (id: string) => {
    setSlots((prev) => {
      const next = prev.filter((s) => s.id !== id);
      emit(next);
      return next;
    });
  };

  return (
    <View>
      <Text variant="caption" color={palette.inkSecondary} style={{ marginBottom: spacing.sm }}>Optional images (up to {max})</Text>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {slots.map((slot) => (
          <View
            key={slot.id}
            style={{ width: 64, height: 64, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: slot.status === 'error' ? palette.danger : palette.border }}
          >
            <Image source={{ uri: slot.localUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            {slot.status === 'uploading' ? (
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={palette.white} size="small" />
              </View>
            ) : null}
            <PressableScale
              onPress={() => remove(slot.id)}
              scaleTo={0.85}
              style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={13} color={palette.white} />
            </PressableScale>
            {slot.status === 'error' ? (
              <View style={{ position: 'absolute', bottom: 2, left: 2 }}>
                <Ionicons name="alert-circle" size={14} color={palette.danger} />
              </View>
            ) : null}
          </View>
        ))}
        {slots.length < max ? (
          <PressableScale
            onPress={pick}
            scaleTo={0.95}
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
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}
