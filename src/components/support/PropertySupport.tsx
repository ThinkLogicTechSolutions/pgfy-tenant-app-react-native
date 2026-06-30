/** Property support — maintenance and stay-related issues for the current property. */
import { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Button, Sheet, Input, EmptyState, Dropdown } from '@/components/ui';
import { TicketRow } from '@/components/domain';
import { EmptyTickets } from '@/components/illustrations';
import { ACTIVE_BOOKING, TICKETS, getListing, type Ticket, type TicketCategory } from '@/data';
import { haptic } from '@/lib/haptics';
import { isHouseWiseEnabled, createHouseWiseComplaint } from '@/lib/housewise';
import { TicketDetailSheet, OptionalImagePicker } from './shared';

const PROPERTY_CATEGORIES = [
  'Electrical',
  'Plumbing',
  'Housekeeping',
  'Wi-Fi',
  'Food',
  'Water supply',
  'AC / cooling',
  'Security',
  'Noise complaint',
  'Room maintenance',
  'Other',
] as const;

type PropertyCategory = (typeof PROPERTY_CATEGORIES)[number];

const PROPERTY_CATEGORY_OPTIONS = PROPERTY_CATEGORIES.map((t) => ({ label: t, value: t }));

export function PropertySupport() {
  const insets = useSafeAreaInsets();
  const listing = getListing(ACTIVE_BOOKING.listingId);
  const houseWiseEnabled = isHouseWiseEnabled(ACTIVE_BOOKING.listingId);
  const [create, setCreate] = useState(false);
  const [cat, setCat] = useState<PropertyCategory | null>(null);
  const [desc, setDesc] = useState('');
  const [created, setCreated] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const openTickets = [
    ...created,
    ...TICKETS.filter((t) => t.supportKind === 'property' && t.status !== 'Resolved'),
  ];
  const resolvedTickets = TICKETS.filter((t) => t.supportKind === 'property' && t.status === 'Resolved');

  const submitComplaint = () => {
    const id = `TKT-${Math.floor(4100 + Math.random() * 899)}`;
    const now = new Date().toISOString();
    // Auto-create the complaint in HouseWise when this PG is enrolled.
    const housewise = houseWiseEnabled ? createHouseWiseComplaint(id) : undefined;
    const ticket: Ticket = {
      id,
      supportKind: 'property',
      category: (cat ?? 'Other') as TicketCategory,
      description: desc.trim() || 'Issue reported for the property.',
      status: 'Open',
      createdAt: now,
      images: [],
      timeline: [{ status: 'Open', at: now, ...(housewise ? { note: `Sent to HouseWise · ${housewise.complaintId}` } : {}) }],
      housewise,
    };
    setCreated((prev) => [ticket, ...prev]);
    haptic.success();
    setCreate(false);
    setCat(null);
    setDesc('');
    Alert.alert(
      'Complaint raised',
      housewise
        ? `Your issue has been sent to HouseWise for servicing (ref ${housewise.complaintId}). The property team will close it once resolved.`
        : 'Your issue has been logged. The property team will pick it up.',
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Property support" subtitle="Raise maintenance and stay-related issues for your current property" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'], gap: spacing.base, paddingTop: spacing.sm }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm, marginLeft: 4 }}>RAISE A QUERY</Text>
          <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.base }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: palette.coralTint, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="construct-outline" size={22} color={palette.coralDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMd" weight="700">Need help with your stay?</Text>
                <Text variant="bodySm" color={palette.inkSecondary} style={{ marginTop: 2 }}>
                  Report maintenance, facilities, food, security, or other stay-related issues for your current property.
                </Text>
                <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: 8 }}>
                  {ACTIVE_BOOKING.propertyName} · Room {ACTIVE_BOOKING.roomNumber} · Bed {ACTIVE_BOOKING.bedLabel}
                </Text>
              </View>
            </View>
            <Button label="Raise property issue" icon="paper-plane-outline" full style={{ marginTop: spacing.base }} onPress={() => setCreate(true)} />
          </View>
        </View>

        <View>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm, marginLeft: 4 }}>OPEN PROPERTY TICKETS</Text>
          {openTickets.length ? (
            <View style={{ gap: spacing.md }}>
              {openTickets.map((item) => <TicketRow key={item.id} ticket={item} onPress={() => setSelected(item)} />)}
            </View>
          ) : (
            <EmptyState
              illustration={<EmptyTickets />}
              title="No active property issues"
              message="Raise an issue and the property team will pick it up."
              actionLabel="Raise property issue"
              onAction={() => setCreate(true)}
            />
          )}
        </View>

        <View>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm, marginLeft: 4 }}>RESOLVED PROPERTY TICKETS</Text>
          {resolvedTickets.length ? (
            <View style={{ gap: spacing.md }}>
              {resolvedTickets.map((item) => <TicketRow key={item.id} ticket={item} onPress={() => setSelected(item)} />)}
            </View>
          ) : (
            <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.base }}>
              <Text variant="bodySm" color={palette.inkSecondary}>No resolved property issues yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Sheet visible={create} onClose={() => setCreate(false)} title="Raise a property issue" scroll>
        <View style={{ gap: spacing.base }}>
          <Dropdown
            label="Issue type"
            placeholder="Select issue type"
            value={cat}
            options={PROPERTY_CATEGORY_OPTIONS}
            onChange={setCat}
            pickerTitle="Select issue type"
          />
          <View style={{ backgroundColor: palette.surfaceRaised, borderRadius: radius.md, padding: spacing.base }}>
            <Text variant="bodySm" weight="600">{ACTIVE_BOOKING.propertyName}</Text>
            <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: 4 }}>
              {listing?.locality ?? ACTIVE_BOOKING.locality} · Room {ACTIVE_BOOKING.roomNumber} · Bed {ACTIVE_BOOKING.bedLabel}
            </Text>
          </View>
          <Input label="Description" placeholder="Describe the issue in your property (max 500 chars)" value={desc} onChangeText={setDesc} multiline maxLength={500} style={{ height: 100, textAlignVertical: 'top' }} />
          <OptionalImagePicker />
          {houseWiseEnabled ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.coralTint, borderRadius: radius.md, padding: spacing.base }}>
              <Ionicons name="construct" size={18} color={palette.coralDark} />
              <Text variant="caption" color={palette.inkSecondary} style={{ flex: 1, lineHeight: 18 }}>
                This property uses HouseWise. Your complaint will be sent to their team for servicing.
              </Text>
            </View>
          ) : null}
          <Button label="Submit" icon="paper-plane-outline" onPress={submitComplaint} full size="lg" />
        </View>
      </Sheet>

      <TicketDetailSheet ticket={selected} visible={!!selected} onClose={() => setSelected(null)} />
    </View>
  );
}
