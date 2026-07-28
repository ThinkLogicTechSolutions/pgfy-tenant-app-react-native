/** T-S21 — Billing ledger & invoice history. */
import { useMemo, useState } from 'react';
import { View, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Sheet, Button, Divider, AnimatedListItem, DateRangePicker } from '@/components/ui';
import { InvoiceRow } from '@/components/domain';
import { INVOICES, type Invoice } from '@/data';
import type { CheckoutIntent } from '@/lib/billing';
import { inr, formatDate } from '@/lib/format';
import { defaultDateRange, type DateRangeValue } from '@/lib/dateRange';

export default function Billing() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [range, setRange] = useState<DateRangeValue>(defaultDateRange);

  // Route an invoice payment into the unified checkout. Invoice amounts already include
  // GST, so fees are not re-added (applyPlatformFee / applyGst default off for 'invoice').
  const payInvoice = (base: number, label: string) => {
    if (base <= 0) return;
    const intent: CheckoutIntent = {
      kind: 'invoice',
      title: label,
      subtitle: 'Monthly rent invoice',
      billingMode: 'monthly',
      baseAmount: base,
      unitRate: base,
      allowAutopay: true,
    };
    setSelected(null);
    setPayOpen(false);
    router.push({ pathname: '/checkout', params: { intent: JSON.stringify(intent) } });
  };

  const filteredInvoices = useMemo(
    () => INVOICES.filter((i) => i.dueDate >= range.from && i.dueDate <= range.to),
    [range],
  );
  const outstanding = filteredInvoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + (i.amount - i.paidAmount), 0);
  const paidYTD = filteredInvoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Billing & invoices" subtitle="Your payment history" />
      <FlatList
        data={filteredInvoices}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.sm }}>
            <Card style={{ marginBottom: spacing.base }}>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" color={palette.inkTertiary}>OUTSTANDING</Text>
                  <Text variant="numLg" mono color={outstanding > 0 ? palette.danger : palette.success}>{inr(outstanding)}</Text>
                </View>
                <View style={{ width: 1, backgroundColor: palette.border }} />
                <View style={{ flex: 1, paddingLeft: spacing.base }}>
                  <Text variant="caption" color={palette.inkTertiary}>PAID THIS YEAR</Text>
                  <Text variant="numLg" mono>{inr(paidYTD)}</Text>
                </View>
              </View>
            </Card>
            <View style={{ marginBottom: spacing.base }}>
              <DateRangePicker value={range} onChange={setRange} />
            </View>
            <Text variant="overline" color={palette.inkTertiary} style={{ marginLeft: 4 }}>ALL INVOICES</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card padded={false} style={{ paddingHorizontal: spacing.base, marginBottom: spacing.sm }}>
              <InvoiceRow invoice={item} onPress={() => setSelected(item)} />
            </Card>
          </AnimatedListItem>
        )}
      />

      {/* Invoice detail */}
      <Sheet visible={!!selected} onClose={() => setSelected(null)} title={selected?.label} scroll>
        {selected ? (
          <View style={{ gap: spacing.base }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="bodySm" color={palette.inkTertiary}>{selected.id}</Text>
              <Text variant="bodySm" weight="600" color={selected.status === 'Paid' ? palette.success : palette.danger}>{selected.status}</Text>
            </View>
            <Card style={{ backgroundColor: palette.surfaceRaised }}>
              {selected.breakdown.map((b) => (
                <View key={b.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
                  <Text variant="bodySm" color={palette.inkSecondary}>{b.label}</Text>
                  <Text variant="bodySm" weight="600" mono>{inr(b.amount)}</Text>
                </View>
              ))}
              <Divider style={{ marginVertical: spacing.sm }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="bodyMd" weight="700">Total</Text>
                <Text variant="bodyMd" weight="700" mono color={palette.navy}>{inr(selected.amount)}</Text>
              </View>
            </Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="caption" color={palette.inkTertiary}>Due date</Text>
              <Text variant="caption" weight="600">{formatDate(selected.dueDate)}</Text>
            </View>
            {selected.paidDate ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="caption" color={palette.inkTertiary}>Paid on</Text>
                <Text variant="caption" weight="600">{formatDate(selected.paidDate)}</Text>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button label="Download PDF" variant="outline" icon="download-outline" full style={{ flex: 1 }} />
              {selected.status !== 'Paid' ? <Button label="Pay now" icon="flash" full style={{ flex: 1 }} onPress={() => payInvoice(selected.amount - selected.paidAmount, selected.label)} /> : null}
            </View>
          </View>
        ) : null}
      </Sheet>

      {/* Pay */}
      <Sheet visible={payOpen} onClose={() => setPayOpen(false)} title="Pay rent">
        <View style={{ gap: spacing.base }}>
          <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
            <Text variant="caption" color={palette.inkTertiary}>AMOUNT PAYABLE</Text>
            <Text variant="display" mono color={palette.navy}>{inr(outstanding)}</Text>
          </View>
          {['Online pay', 'Offline pay'].map((m) => (
            <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: palette.border }}>
              <Ionicons name={m === 'Online pay' ? 'globe-outline' : 'cash-outline'} size={20} color={palette.navy} />
              <Text variant="bodyMd" style={{ flex: 1 }}>{m}</Text>
              <Ionicons name="chevron-forward" size={18} color={palette.inkTertiary} />
            </View>
          ))}
          <Button label={`Pay ${inr(outstanding)}`} icon="lock-closed" onPress={() => payInvoice(outstanding, 'Outstanding rent')} full size="lg" />
        </View>
      </Sheet>
    </View>
  );
}
