/** T-S21 — Billing ledger & invoice history, real `GET /tenant/billing-rent`. */
import { useEffect, useMemo, useState } from 'react';
import { View, FlatList, ScrollView, RefreshControl, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Sheet, Button, Divider, Chip, AnimatedListItem, Skeleton, EmptyState, PressableScale } from '@/components/ui';
import { StayDateRangeField } from '@/components/search';
import { EmptyInvoices } from '@/components/illustrations';
import { billingApi, errorMessage, type ApiInvoice, type ApiBillingSummary } from '@/lib/api';
import type { CheckoutIntent } from '@/lib/billing';
import { toLocalIso } from '@/lib/dates';
import { inr, formatDate, formatDayMonth } from '@/lib/format';

type FilterKey = 'this_month' | 'last_month' | 'this_year' | 'custom';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'this_year', label: 'This year' },
  { key: 'custom', label: 'Custom' },
];

/** How far back a custom range can start. */
const CUSTOM_RANGE_MAX_YEARS_BACK = 2;

function toIso(date: Date) {
  return toLocalIso(date);
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function shiftMonth(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function presetRange(filter: Exclude<FilterKey, 'custom'>) {
  const base = new Date();
  if (filter === 'this_month') {
    return { start: toIso(monthStart(base)), end: toIso(monthEnd(base)) };
  }
  if (filter === 'last_month') {
    const target = shiftMonth(base, -1);
    return { start: toIso(monthStart(target)), end: toIso(monthEnd(target)) };
  }
  return { start: toIso(new Date(base.getFullYear(), 0, 1)), end: toIso(new Date(base.getFullYear(), 11, 31)) };
}

/** Custom range default: last month's start through today. */
function defaultCustomRange() {
  const today = new Date();
  return { start: toIso(monthStart(shiftMonth(today, -1))), end: toIso(today) };
}

/** Custom range bounds: up to 2 years back, never past today. */
function customRangeBounds() {
  const today = new Date();
  const min = new Date(today.getFullYear() - CUSTOM_RANGE_MAX_YEARS_BACK, today.getMonth(), today.getDate());
  return { minDate: min, maxDate: today };
}

/** `due_date[$gte]`/`due_date[$lte]` want full ISO datetime bounds, not bare dates. */
function toDueDateBounds(start: string, end: string) {
  return { fromIso: `${start}T00:00:00.000Z`, toIso: `${end}T23:59:59.999Z` };
}

function billingMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function invoiceStatusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function invoiceStatusTone(status: string): string {
  if (status === 'PAID') return palette.success;
  if (status === 'PARTIAL') return palette.warning;
  return palette.danger;
}

function invoiceTitle(invoice: ApiInvoice): string {
  if (invoice.billing_month) return `Rent · ${billingMonthLabel(invoice.billing_month)}`;
  if (invoice.type === 'MOVE_IN') return 'Move-in payment';
  return invoice.type.charAt(0) + invoice.type.slice(1).toLowerCase().replace(/_/g, ' ');
}

export default function Billing() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState<ApiInvoice | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('this_month');
  const [customRange, setCustomRange] = useState(defaultCustomRange);
  const { minDate: customMinDate, maxDate: customMaxDate } = customRangeBounds();

  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [summary, setSummary] = useState<ApiBillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRange = filter === 'custom' ? customRange : presetRange(filter);

  const selectFilter = (key: FilterKey) => {
    // Reset to the intended default the moment Custom is entered, rather than fetching
    // whatever stale range happened to be sitting in state from a previous session/filter.
    if (key === 'custom' && filter !== 'custom') setCustomRange(defaultCustomRange());
    setFilter(key);
  };

  const load = (isRefresh = false) => {
    const { fromIso, toIso: toIsoBound } = toDueDateBounds(activeRange.start, activeRange.end);
    (isRefresh ? setRefreshing : setLoading)(true);
    setError(null);
    billingApi.listBillingRent({ fromIso, toIso: toIsoBound, limit: 100 })
      .then((res) => {
        setInvoices(res.data);
        setSummary(res.summary);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => (isRefresh ? setRefreshing : setLoading)(false));
  };

  useEffect(load, [activeRange.start, activeRange.end]);

  // Route an invoice payment into the unified checkout, which calls `POST /tenant/pay-rent`
  // for real (billing_api.md). Invoice amounts already include GST, so fees are not
  // re-added (applyPlatformFee / applyGst default off for 'invoice').
  const payInvoice = (invoice: ApiInvoice) => {
    if (invoice.outstanding <= 0) return;
    const intent: CheckoutIntent = {
      kind: 'invoice',
      title: invoiceTitle(invoice),
      subtitle: `${invoice.property.name} · ${invoice.invoice_number}`,
      billingMode: 'monthly',
      baseAmount: invoice.outstanding,
      unitRate: invoice.outstanding,
      allowAutopay: true,
      invoicePayment: { invoiceId: invoice.id },
    };
    setSelected(null);
    router.push({ pathname: '/checkout', params: { intent: JSON.stringify(intent) } });
  };

  // The list response often still has `pdf_attachment: null` even once the PDF exists —
  // fetch the invoice fresh so a just-generated PDF is picked up.
  const downloadPdf = async (invoice: ApiInvoice) => {
    setDownloading(true);
    try {
      const fresh = invoice.pdf_attachment ? invoice : await billingApi.getBillingRentInvoice(invoice.id);
      if (!fresh.pdf_attachment?.link) {
        Alert.alert('Not available yet', "This invoice's PDF hasn't been generated yet.");
        return;
      }
      await Linking.openURL(fresh.pdf_attachment.link);
    } catch (e) {
      Alert.alert('Could not open PDF', errorMessage(e));
    } finally {
      setDownloading(false);
    }
  };

  const outstanding = summary?.due ?? 0;
  const paidInRange = summary?.collected ?? 0;

  const skeletonRows = useMemo(() => [0, 1, 2, 3], []);

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Billing & invoices" subtitle="Your payment history" />
      {loading ? (
        <View style={{ paddingHorizontal: spacing.base, gap: spacing.base }}>
          <Skeleton width="100%" height={78} rounded={radius.lg} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {[0, 1, 2].map((i) => <Skeleton key={i} width={100} height={32} rounded={radius.pill} />)}
          </View>
          {skeletonRows.map((i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
              <Skeleton width={40} height={40} rounded={radius.md} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="40%" height={11} />
              </View>
              <Skeleton width={64} height={28} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={palette.coral} colors={[palette.coral]} />}
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
                    <Text variant="caption" color={palette.inkTertiary}>PAID</Text>
                    <Text variant="numLg" mono>{inr(paidInRange)}</Text>
                  </View>
                </View>
                {summary ? (
                  <>
                    <Divider style={{ marginVertical: spacing.sm }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text variant="caption" color={palette.inkTertiary}>{summary.collection_rate}% collected</Text>
                      <Text variant="caption" color={palette.inkTertiary}>
                        {summary.counts.paid} paid · {summary.counts.partial} partial · {summary.counts.unpaid} unpaid
                      </Text>
                    </View>
                  </>
                ) : null}
              </Card>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.base }}
              >
                {FILTERS.map((item) => (
                  <Chip key={item.key} label={item.label} active={filter === item.key} onPress={() => selectFilter(item.key)} />
                ))}
              </ScrollView>
              {filter === 'custom' ? (
                <Card style={{ marginBottom: spacing.base }}>
                  <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>CUSTOM DATE RANGE</Text>
                  <StayDateRangeField
                    checkIn={customRange.start}
                    checkOut={customRange.end}
                    onChange={({ checkIn, checkOut }) => setCustomRange({ start: checkIn, end: checkOut })}
                    checkInLabel="From"
                    checkOutLabel="To"
                    sheetTitle="Select invoice date range"
                    applyLabel="Apply range"
                    minDate={customMinDate}
                    maxDate={customMaxDate}
                  />
                </Card>
              ) : null}
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
          ListEmptyComponent={
            <EmptyState
              illustration={<EmptyInvoices />}
              title={error ? "Couldn't load invoices" : 'No invoices in this range'}
              message={error ?? 'Try a different date range.'}
              actionLabel={error ? 'Retry' : undefined}
              onAction={error ? () => load() : undefined}
            />
          }
        />
      )}

      {/* Invoice detail */}
      <Sheet visible={!!selected} onClose={() => setSelected(null)} title={selected ? invoiceTitle(selected) : undefined} scroll>
        {selected ? (
          <View style={{ gap: spacing.base }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="bodySm" color={palette.inkTertiary}>{selected.invoice_number}</Text>
              <Text variant="bodySm" weight="600" color={invoiceStatusTone(selected.status)}>{invoiceStatusLabel(selected.status)}</Text>
            </View>
            <Card style={{ backgroundColor: palette.surfaceRaised }}>
              <Row label="Property" value={selected.property.name} />
              <Row label="Room" value={selected.room.room_number} />
              <Row label="Booking ref" value={selected.booking.code} />
              <Divider style={{ marginVertical: spacing.sm }} />
              <Row label="Amount" value={inr(selected.amount)} />
              {selected.paid > 0 ? <Row label="Paid" value={inr(selected.paid)} /> : null}
              {selected.outstanding > 0 ? <Row label="Outstanding" value={inr(selected.outstanding)} /> : null}
              <Divider style={{ marginVertical: spacing.sm }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="bodyMd" weight="700">Total</Text>
                <Text variant="bodyMd" weight="700" mono color={palette.navy}>{inr(selected.amount)}</Text>
              </View>
            </Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="caption" color={palette.inkTertiary}>Due date</Text>
              <Text variant="caption" weight="600">{formatDate(selected.due_date)}</Text>
            </View>
            {selected.paid_on ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="caption" color={palette.inkTertiary}>Paid on</Text>
                <Text variant="caption" weight="600">{formatDate(selected.paid_on)}</Text>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button label="Download PDF" variant="outline" icon="download-outline" full loading={downloading} style={{ flex: 1 }} onPress={() => downloadPdf(selected)} />
              {selected.status !== 'PAID' ? <Button label="Pay now" icon="flash" full style={{ flex: 1 }} onPress={() => payInvoice(selected)} /> : null}
            </View>
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}

function InvoiceRow({ invoice, onPress }: { invoice: ApiInvoice; onPress?: () => void }) {
  const tone = invoiceStatusTone(invoice.status);
  return (
    <PressableScale onPress={onPress} scaleTo={0.99} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
      <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: tone + '1A', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="receipt-outline" size={20} color={tone} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyMd" weight="600" numberOfLines={1}>{invoiceTitle(invoice)}</Text>
        <Text variant="caption" color={palette.inkTertiary} numberOfLines={1}>
          {invoice.property.name} · due {formatDayMonth(invoice.due_date)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text variant="bodyMd" weight="700" mono>{inr(invoice.amount)}</Text>
        <Text variant="caption" weight="600" color={tone}>{invoiceStatusLabel(invoice.status)}</Text>
      </View>
    </PressableScale>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
      <Text variant="bodySm" color={palette.inkSecondary}>{label}</Text>
      <Text variant="bodySm" weight="600" mono numberOfLines={1} style={{ maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
    </View>
  );
}
