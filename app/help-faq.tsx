/** T-S28 — FAQs page from profile support section. */
import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, PressableScale, Button } from '@/components/ui';

const FAQS = [
  {
    q: 'How do I complete my KYC?',
    a: 'Go to Profile and tap "Complete your KYC". Review your Aadhaar details and submit them to unlock booking.',
  },
  {
    q: 'How do I book a bed?',
    a: 'Open a property, select your occupancy, tap Choose Room/Bed, pick an available bed, review the booking and complete payment.',
  },
  {
    q: 'Can I change my check-in and check-out dates?',
    a: 'Yes. On the Review booking page, use the stay dates selector to update your check-in and check-out before payment.',
  },
  {
    q: 'Where can I see my invoices?',
    a: 'Open Billing & invoices from My Stay or Profile. You can filter invoices by preset date ranges or a custom range.',
  },
  {
    q: 'How do I raise a maintenance issue?',
    a: 'Go to Support from Quick actions or the Support page and submit a ticket with the issue category and description.',
  },
  {
    q: 'How do I get directions to my property?',
    a: 'Open My Stay and tap "Get directions" to launch maps with your property location.',
  },
];

export default function HelpFaq() {
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="FAQs" subtitle="Answers to common questions" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing['3xl'], gap: spacing.base }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm, marginLeft: 4 }}>
            FREQUENTLY ASKED QUESTIONS
          </Text>
          <View style={{ gap: spacing.sm }}>
            {FAQS.map((item, index) => {
              const open = openIndex === index;
              return (
                <Card key={item.q} padded={false}>
                  <PressableScale
                    onPress={() => setOpenIndex(open ? null : index)}
                    scaleTo={0.99}
                    haptics={false}
                    style={{ paddingHorizontal: spacing.base, paddingVertical: spacing.base }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyMd" weight="600">
                          {item.q}
                        </Text>
                        {open ? (
                          <Text variant="bodySm" color={palette.inkSecondary} style={{ marginTop: spacing.sm, lineHeight: 21 }}>
                            {item.a}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={palette.inkTertiary}
                      />
                    </View>
                  </PressableScale>
                </Card>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
