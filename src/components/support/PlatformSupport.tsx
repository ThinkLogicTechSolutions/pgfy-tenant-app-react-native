/** Platform support — FAQs, account queries, and platform tickets. */
import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Button, Sheet, Input, EmptyState, Dropdown } from '@/components/ui';
import { TicketRow } from '@/components/domain';
import { EmptyTickets } from '@/components/illustrations';
import { TICKETS, type Ticket } from '@/data';
import { haptic } from '@/lib/haptics';
import { FaqAccordion, TicketDetailSheet, OptionalImagePicker } from './shared';

const PLATFORM_CATEGORIES = [
  'KYC verification issue',
  'Invoice issue',
  'Login or account issue',
  'Delete account request',
  'Other',
] as const;

type PlatformCategory = (typeof PLATFORM_CATEGORIES)[number];

const PLATFORM_CATEGORY_OPTIONS = PLATFORM_CATEGORIES.map((t) => ({ label: t, value: t }));

const FAQS = [
  {
    q: 'How do I complete my KYC?',
    a: 'Go to Profile and tap Complete your KYC. Review the prefilled Aadhaar details and submit them to unlock booking.',
  },
  {
    q: 'How do I book a bed?',
    a: 'Open a property, choose an occupancy, tap Choose Room/Bed, pick an available bed, then review and pay.',
  },
  {
    q: 'Can I change my check-in and check-out dates?',
    a: 'Yes. On the Review booking page, use the stay date selector to edit your check-in and check-out before payment.',
  },
  {
    q: 'How do I raise a query?',
    a: 'Use the Raise query section below. Choose a category, add a description, optionally attach images, and submit.',
  },
  {
    q: 'Where can I see my invoices?',
    a: 'Open Billing & invoices from My Stay or Profile and use the available date filters to narrow your invoice history.',
  },
];

export function PlatformSupport() {
  const insets = useSafeAreaInsets();
  const [create, setCreate] = useState(false);
  const [cat, setCat] = useState<PlatformCategory | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const openTickets = TICKETS.filter((t) => t.supportKind === 'platform' && t.status !== 'Resolved');
  const resolvedTickets = TICKETS.filter((t) => t.supportKind === 'platform' && t.status === 'Resolved');

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Support & FAQs" subtitle="Platform help, account queries, and FAQs" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'], gap: spacing.base, paddingTop: spacing.sm }}
        showsVerticalScrollIndicator={false}
      >
        <FaqAccordion items={FAQS} />

        <View>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm, marginLeft: 4 }}>RAISE A QUERY</Text>
          <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.base }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: palette.coralTint, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="help-buoy-outline" size={22} color={palette.coralDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMd" weight="700">Need help with the platform?</Text>
                <Text variant="bodySm" color={palette.inkSecondary} style={{ marginTop: 2 }}>
                  Report login issues, account access problems, delete account requests, KYC issues, invoice issues, and other platform-related problems.
                </Text>
              </View>
            </View>
            <Button label="Raise query" icon="paper-plane-outline" full style={{ marginTop: spacing.base }} onPress={() => setCreate(true)} />
          </View>
        </View>

        <View>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm, marginLeft: 4 }}>GENERATED SUPPORTS</Text>
          {openTickets.length ? (
            <View style={{ gap: spacing.md }}>
              {openTickets.map((item) => <TicketRow key={item.id} ticket={item} onPress={() => setSelected(item)} />)}
            </View>
          ) : (
            <EmptyState
              illustration={<EmptyTickets />}
              title="No active queries"
              message="Raise a query and we'll get on it."
              actionLabel="Raise query"
              onAction={() => setCreate(true)}
            />
          )}
        </View>

        <View>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm, marginLeft: 4 }}>RESOLVED SUPPORTS</Text>
          {resolvedTickets.length ? (
            <View style={{ gap: spacing.md }}>
              {resolvedTickets.map((item) => <TicketRow key={item.id} ticket={item} onPress={() => setSelected(item)} />)}
            </View>
          ) : (
            <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.base }}>
              <Text variant="bodySm" color={palette.inkSecondary}>No resolved supports yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Sheet visible={create} onClose={() => setCreate(false)} title="Raise a query" scroll>
        <View style={{ gap: spacing.base }}>
          <Dropdown
            label="Category"
            placeholder="Select category"
            value={cat}
            options={PLATFORM_CATEGORY_OPTIONS}
            onChange={setCat}
            pickerTitle="Select category"
          />
          <Input label="Description" placeholder="Describe the platform issue (max 500 chars)" multiline maxLength={500} style={{ height: 100, textAlignVertical: 'top' }} />
          <OptionalImagePicker onChange={setImages} />
          <Button label="Submit" icon="paper-plane-outline" onPress={() => { haptic.success(); setCreate(false); }} full size="lg" />
        </View>
      </Sheet>

      <TicketDetailSheet ticket={selected} visible={!!selected} onClose={() => setSelected(null)} />
    </View>
  );
}
