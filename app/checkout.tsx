/** T-S16 — Unified checkout for every transaction type (monthly/daily/hourly booking,
 *  extend, monthly invoice). Driven by a CheckoutIntent param. Shows the platform-fee +
 *  GST + coupon breakdown, lets monthly payers set up UPI Autopay or pay once, and
 *  simulates a Razorpay payment. */
import { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Divider, Input, PressableScale, Badge, EmptyState } from '@/components/ui';
import { COUPONS, resolveCoupon } from '@/data';
import { computeCheckout, type CheckoutIntent } from '@/lib/billing';
import { inr } from '@/lib/format';
import { haptic } from '@/lib/haptics';

const METHODS = [
  { key: 'upi', label: 'UPI', sub: 'GPay, PhonePe, Paytm', icon: 'phone-portrait-outline' },
  { key: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: 'card-outline' },
  { key: 'netbanking', label: 'Net Banking', sub: 'All major banks', icon: 'business-outline' },
  { key: 'cash', label: 'Offline Cash', sub: 'Pay at property via OTP', icon: 'cash-outline' },
] as const;

function parseIntent(raw?: string): CheckoutIntent | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as CheckoutIntent; } catch { return null; }
}

export default function Checkout() {
  const { intent: intentRaw, coupon: couponParam } = useLocalSearchParams<{ intent?: string; coupon?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const intent = useMemo(() => parseIntent(intentRaw), [intentRaw]);

  const [couponInput, setCouponInput] = useState(couponParam ?? '');
  const [appliedCode, setAppliedCode] = useState<string | null>(couponParam && resolveCoupon(couponParam) ? couponParam.toUpperCase() : null);
  const [couponError, setCouponError] = useState(false);
  const [autopay, setAutopay] = useState(false);
  const [method, setMethod] = useState<string>('upi');
  const [loading, setLoading] = useState(false);

  const quote = useMemo(() => (intent ? computeCheckout(intent, appliedCode ?? undefined) : null), [intent, appliedCode]);

  if (!intent || !quote) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
        <ScreenHeader title="Checkout" />
        <EmptyState title="Nothing to pay" message="This checkout link is missing its details." />
      </View>
    );
  }

  const applyCoupon = () => {
    const c = resolveCoupon(couponInput);
    if (c) { setAppliedCode(c.code); setCouponInput(c.code); setCouponError(false); haptic.success(); }
    else { setAppliedCode(null); setCouponError(true); haptic.error(); }
  };

  // Monthly bookings & invoices can set up UPI Autopay; offline cash forces one-time.
  const payMethod = autopay ? 'upi' : method;
  const payLabel = autopay ? `Set up Autopay · ${inr(quote.total)}` : `Pay ${inr(quote.total)}`;

  const pay = () => {
    setLoading(true); haptic.success();
    setTimeout(() => {
      setLoading(false);
      router.replace({
        pathname: '/payment-success',
        params: {
          amount: String(quote.total),
          method: autopay ? 'UPI Autopay' : payMethod,
          title: intent.title,
          kind: intent.kind,
          autopay: autopay ? '1' : '0',
        },
      });
    }, 1100);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Checkout" subtitle="Secure payment · Razorpay" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: 150, gap: spacing.base }} showsVerticalScrollIndicator={false}>
        {/* Order summary */}
        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>ORDER SUMMARY</Text>
          <Text variant="bodyMd" weight="700">{intent.title}</Text>
          {intent.subtitle ? <Text variant="caption" color={palette.inkSecondary} style={{ marginTop: 2 }}>{intent.subtitle}</Text> : null}
          <Divider style={{ marginVertical: spacing.sm }} />
          {quote.lines.map((l, i) => (
            <View key={`${l.label}-${i}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
              <Text variant="bodySm" color={l.tone === 'muted' ? palette.inkTertiary : l.tone === 'discount' ? palette.success : palette.inkSecondary} style={{ flex: 1 }}>{l.label}</Text>
              <Text variant="bodySm" weight="600" mono color={l.tone === 'discount' ? palette.success : palette.ink}>{l.amount < 0 ? `− ${inr(-l.amount)}` : inr(l.amount)}</Text>
            </View>
          ))}
          <Divider style={{ marginVertical: spacing.sm }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="bodyMd" weight="700">Total payable</Text>
            <Text variant="bodyMd" weight="700" mono color={palette.navy}>{inr(quote.total)}</Text>
          </View>
        </Card>

        {/* Coupon */}
        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>COUPON</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Input containerStyle={{ flex: 1 }} placeholder="Enter coupon code" value={couponInput} onChangeText={(v) => { setCouponInput(v); setCouponError(false); }} autoCapitalize="characters" icon="pricetag-outline" />
            <Button label="Apply" variant="subtle" onPress={applyCoupon} />
          </View>
          {couponError ? (
            <Text variant="caption" color={palette.danger} style={{ marginTop: spacing.sm }}>That coupon code isn’t valid.</Text>
          ) : appliedCode && quote.couponDiscount > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm }}>
              <Ionicons name="checkmark-circle" size={16} color={palette.success} />
              <Text variant="caption" color={palette.success}>{appliedCode} applied — you saved {inr(quote.couponDiscount)}!</Text>
            </View>
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginTop: spacing.md }}>
            {COUPONS.slice(0, 5).map((c) => {
              const active = appliedCode === c.code;
              return (
                <PressableScale key={c.code} onPress={() => { setCouponInput(c.code); setAppliedCode(c.code); setCouponError(false); haptic.success(); }} haptics={false}
                  style={{ width: 200, backgroundColor: active ? palette.coralTint : palette.surfaceRaised, borderRadius: radius.md, borderWidth: 1, borderColor: active ? palette.coral : palette.border, padding: spacing.md, gap: 4 }}>
                  <Text variant="bodySm" weight="700">{c.title}</Text>
                  <Text variant="caption" color={palette.inkSecondary} numberOfLines={2}>{c.description}</Text>
                  <Text variant="caption" mono weight="700" color={palette.navy} style={{ marginTop: spacing.xs }}>{c.code}</Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        </Card>

        {/* Autopay vs one-time (monthly bookings & invoices) */}
        {intent.allowAutopay ? (
          <Card padded={false} style={{ paddingHorizontal: spacing.base }}>
            <Text variant="overline" color={palette.inkTertiary} style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>HOW WOULD YOU LIKE TO PAY?</Text>
            <PayChoice
              icon="repeat-outline" label="Set up UPI Autopay" sub="Auto-debit rent every month — never miss a due date"
              active={autopay} onPress={() => setAutopay(true)}
            />
            <Divider />
            <PayChoice
              icon="card-outline" label="Pay once" sub="Pay this amount now via Razorpay"
              active={!autopay} onPress={() => setAutopay(false)}
            />
          </Card>
        ) : null}

        {/* Payment method (one-time only) */}
        {!autopay ? (
          <View>
            <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>PAYMENT METHOD</Text>
            <Card padded={false} style={{ paddingHorizontal: spacing.base }}>
              {METHODS.map((m, i) => (
                <View key={m.key}>
                  <PressableScale onPress={() => setMethod(m.key)} haptics={false} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
                    <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: palette.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={m.icon as any} size={20} color={palette.navy} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMd" weight="600">{m.label}</Text>
                      <Text variant="caption" color={palette.inkTertiary}>{m.sub}</Text>
                    </View>
                    <Ionicons name={method === m.key ? 'radio-button-on' : 'radio-button-off'} size={22} color={method === m.key ? palette.coral : palette.borderStrong} />
                  </PressableScale>
                  {i < METHODS.length - 1 ? <Divider /> : null}
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        {!autopay && method === 'cash' ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, backgroundColor: palette.infoTint, padding: spacing.md, borderRadius: radius.md }}>
            <Ionicons name="information-circle" size={18} color={palette.info} />
            <Text variant="caption" color={palette.info} style={{ flex: 1 }}>A 6-digit OTP will be generated. Share it with the manager/warden when you pay cash.</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
          <SecBadge icon="lock-closed" label="256-bit SSL" />
          <SecBadge icon="shield-checkmark" label="PCI-DSS" />
          <SecBadge icon="flash" label="Powered by Razorpay" />
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
        <View>
          <Text variant="caption" color={palette.inkTertiary}>{autopay ? 'First debit' : 'Paying now'}</Text>
          <Text variant="h3" mono color={palette.navy}>{inr(quote.total)}</Text>
        </View>
        <Button label={payLabel} loadingLabel="Contacting Razorpay…" icon="lock-closed" loading={loading} onPress={pay} full size="lg" style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function PayChoice({ icon, label, sub, active, onPress }: { icon: any; label: string; sub: string; active: boolean; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} haptics={false} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
      <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: active ? palette.coralTint : palette.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={20} color={active ? palette.coral : palette.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyMd" weight="600">{label}</Text>
        <Text variant="caption" color={palette.inkTertiary}>{sub}</Text>
      </View>
      <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? palette.coral : palette.borderStrong} />
    </PressableScale>
  );
}

function SecBadge({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={13} color={palette.inkTertiary} />
      <Text variant="caption" color={palette.inkTertiary}>{label}</Text>
    </View>
  );
}
