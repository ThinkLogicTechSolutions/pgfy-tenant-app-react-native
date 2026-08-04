/** T-S16 — Unified checkout for every transaction type (monthly/daily/hourly booking,
 *  extend, monthly invoice). Driven by a CheckoutIntent param. Shows the platform-fee +
 *  GST breakdown, lets monthly payers set up UPI Autopay or pay once, and opens the real
 *  Razorpay checkout for a genuine new-booking payment. */
import { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Divider, PressableScale, EmptyState } from '@/components/ui';
import { computeCheckout, type CheckoutIntent, type AppliedCoupon } from '@/lib/billing';
import { inr } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { bookingApi, billingApi, extendStayApi, errorMessage, type PaymentMethod, type ApiBookingCreateResponse, type ApiPayRentResponse, type ApiCreateExtensionResponse } from '@/lib/api';
import { alert } from '@/lib/alertDialog';
import { useAuth } from '@/context/AuthContext';
import { RazorpayCheckout, type RazorpayOrder, type RazorpaySuccess } from '@/components/booking';

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
  const { user } = useAuth();
  const intent = useMemo(() => parseIntent(intentRaw), [intentRaw]);

  // A coupon applied (and already resolved to a ₹ amount) on the previous screen still
  // prices in here — this screen just doesn't let you edit it anymore.
  const appliedCoupon = useMemo<AppliedCoupon | undefined>(() => {
    if (!couponParam) return undefined;
    try { return JSON.parse(couponParam) as AppliedCoupon; } catch { return undefined; }
  }, [couponParam]);
  // An auto-applied referral discount rides on `appliedCoupon` (same shape, for consistent
  // pricing math) but carries a `label` and isn't a real coupon code — the backend already
  // knows the tenant is a referred user and applies it itself, so it must never be sent as
  // `coupon_code` (a fake "REFERRAL" code would either no-op or fail coupon validation).
  const realCouponCode = appliedCoupon && !appliedCoupon.label ? appliedCoupon.code : null;
  const [autopay, setAutopay] = useState(false);
  const [method, setMethod] = useState<string>('upi');
  const [loading, setLoading] = useState(false);
  const [rzpVisible, setRzpVisible] = useState(false);
  const [rzpOrder, setRzpOrder] = useState<RazorpayOrder | null>(null);
  // 'mandate' only follows 'invoice' — an AUTOPAY pay-rent needs a second, separate Razorpay
  // order to authorize the recurring mandate after the invoice's own payment succeeds.
  const [rzpStep, setRzpStep] = useState<'booking' | 'invoice' | 'mandate' | 'extension' | null>(null);
  const [pendingCreated, setPendingCreated] = useState<ApiBookingCreateResponse | null>(null);
  const [pendingInvoicePay, setPendingInvoicePay] = useState<ApiPayRentResponse | null>(null);
  const [pendingExtension, setPendingExtension] = useState<ApiCreateExtensionResponse | null>(null);

  const quote = useMemo(() => (intent ? computeCheckout(intent, appliedCoupon) : null), [intent, appliedCoupon]);

  if (!intent || !quote) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
        <ScreenHeader title="Checkout" />
        <EmptyState title="Nothing to pay" message="This checkout link is missing its details." />
      </View>
    );
  }

  // Monthly bookings & invoices can set up UPI Autopay; offline cash forces one-time.
  const payMethod = autopay ? 'upi' : method;
  const payLabel = autopay ? `Set up Autopay · ${inr(quote.total)}` : `Pay ${inr(quote.total)}`;

  const goToBookingSuccess = (created: ApiBookingCreateResponse) => {
    router.replace({
      pathname: '/payment-success',
      params: {
        amount: String(created.total_payable),
        method: autopay ? 'UPI Autopay' : created.payment_method,
        title: intent.title,
        kind: intent.kind,
        autopay: autopay ? '1' : '0',
        bookingId: String(created.id),
        bookingCode: created.code,
      },
    });
  };

  const goToInvoicePaySuccess = (res: ApiPayRentResponse) => {
    router.replace({
      pathname: '/payment-success',
      params: {
        amount: String(res.amount_due),
        method: autopay ? 'UPI Autopay' : res.payment_method,
        title: intent.title,
        kind: intent.kind,
        autopay: autopay ? '1' : '0',
        note: res.payment_hint?.note,
      },
    });
  };

  const goToExtensionSuccess = (res: ApiCreateExtensionResponse) => {
    router.replace({
      pathname: '/payment-success',
      params: {
        amount: String(res.extension.total_payable),
        method: payMethod.toUpperCase(),
        title: intent.title,
        kind: intent.kind,
        bookingId: intent.extension ? String(intent.extension.bookingId) : undefined,
        bookingCode: res.extension.code,
        note: res.payment_hint?.note,
      },
    });
  };

  const pay = async () => {
    // The branches below hit a real endpoint (booking_api.md / billing_api.md / stay
    // extension); anything else (a mock-listing booking) has nothing real to create, so
    // stays simulated.
    if (intent.extension) {
      setLoading(true);
      try {
        const res = await extendStayApi.createExtension({
          booking_id: String(intent.extension.bookingId),
          quantity: intent.extension.quantity,
          payment_method: payMethod.toUpperCase() as PaymentMethod,
          coupon_code: realCouponCode,
        });

        const tx = res.transaction;
        const isOnlineGateway = payMethod !== 'cash' && !!tx?.key && !!tx?.gateway_transaction_id;
        if (isOnlineGateway) {
          setPendingExtension(res);
          setRzpStep('extension');
          setRzpOrder({
            key: tx!.key!,
            orderId: tx!.gateway_transaction_id!,
            amountPaise: Math.round((tx!.total_amount ?? res.extension.total_payable) * 100),
            name: 'PGfy',
            description: intent.title,
            prefill: { name: user?.name, email: user?.email ?? undefined, contact: user?.phone },
          });
          setRzpVisible(true);
          setLoading(false);
          return;
        }

        // Offline methods (cash / no gateway) — nothing left to collect here; the extension
        // confirms once the owner marks the STAY_EXTENSION invoice paid.
        haptic.success();
        goToExtensionSuccess(res);
      } catch (e) {
        haptic.error();
        alert('Could not extend stay', errorMessage(e));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (intent.booking) {
      setLoading(true);
      try {
        const created = await bookingApi.createBooking({
          property_id: intent.booking.propertyId,
          booking_mode: intent.booking.bookingMode,
          check_in_date: intent.booking.checkInDate,
          check_out_date: intent.booking.checkOutDate ?? null,
          duration_hours: intent.booking.durationHours ?? null,
          payment_method: (autopay ? 'UPI' : payMethod.toUpperCase()) as PaymentMethod,
          payment_frequency: autopay ? 'AUTOPAY' : 'PAY_ONCE',
          coupon_code: realCouponCode,
          // Flat/Home stay: whole-unit booking with named guests, no room/bed/layout.
          ...(intent.booking.guests
            ? { guests: intent.booking.guests, guest_count: intent.booking.guestCount }
            : {
                room_id: intent.booking.roomId,
                bed_id: intent.booking.bedId,
                floor_id: intent.booking.floorId,
                is_ac: intent.booking.isAc,
                has_food: intent.booking.hasFood,
                room_layout: intent.booking.roomLayout,
              }),
        });

        const tx = created.transaction;
        const isOnlineGateway = payMethod !== 'cash' && !!tx?.key && !!tx?.gateway_transaction_id;
        if (isOnlineGateway) {
          // The booking hold now exists server-side (status PENDING_PAYMENT) — open the
          // real Razorpay checkout to actually collect payment against it.
          setPendingCreated(created);
          setRzpStep('booking');
          setRzpOrder({
            key: tx!.key!,
            orderId: tx!.gateway_transaction_id!,
            amountPaise: Math.round((tx!.total_amount ?? created.total_payable) * 100),
            name: 'PGfy',
            description: intent.title,
            prefill: { name: user?.name, email: user?.email ?? undefined, contact: user?.phone },
          });
          setRzpVisible(true);
          setLoading(false);
          return;
        }

        // Offline methods (cash / no gateway on this transaction) — nothing left to collect here.
        haptic.success();
        goToBookingSuccess(created);
      } catch (e) {
        haptic.error();
        alert('Could not complete booking', errorMessage(e));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (intent.invoicePayment) {
      setLoading(true);
      try {
        const res = await billingApi.payRent({
          invoice_id: String(intent.invoicePayment.invoiceId),
          payment_method: (autopay ? 'UPI' : payMethod.toUpperCase()) as PaymentMethod,
          payment_frequency: autopay ? 'AUTOPAY' : 'PAY_ONCE',
        });

        const tx = res.transaction;
        const isOnlineGateway = payMethod !== 'cash' && !!tx?.key && !!tx?.gateway_transaction_id;
        if (isOnlineGateway) {
          setPendingInvoicePay(res);
          setRzpStep('invoice');
          setRzpOrder({
            key: tx!.key!,
            orderId: tx!.gateway_transaction_id!,
            amountPaise: Math.round((tx!.total_amount ?? res.amount_due) * 100),
            name: 'PGfy',
            description: intent.title,
            prefill: { name: user?.name, email: user?.email ?? undefined, contact: user?.phone },
          });
          setRzpVisible(true);
          setLoading(false);
          return;
        }

        // CASH — nothing to collect online; the owner verifies via collect-rent OTP.
        haptic.success();
        goToInvoicePaySuccess(res);
      } catch (e) {
        haptic.error();
        alert('Could not process payment', errorMessage(e));
      } finally {
        setLoading(false);
      }
      return;
    }

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

  const closeRazorpay = () => {
    setRzpVisible(false);
    setRzpOrder(null);
  };

  const onRazorpaySuccess = (_result: RazorpaySuccess) => {
    if (rzpStep === 'booking') {
      closeRazorpay();
      setRzpStep(null);
      if (!pendingCreated) return;
      haptic.success();
      goToBookingSuccess(pendingCreated);
      return;
    }

    if (rzpStep === 'extension') {
      closeRazorpay();
      setRzpStep(null);
      if (!pendingExtension) return;
      haptic.success();
      goToExtensionSuccess(pendingExtension);
      return;
    }

    if (rzpStep === 'invoice' && pendingInvoicePay) {
      const mandateAuth = pendingInvoicePay.autopay?.razorpay;
      if (mandateAuth) {
        // Invoice paid — now authorize the recurring mandate (a separate, tiny Razorpay
        // order) before considering this checkout fully done.
        setRzpStep('mandate');
        setRzpOrder({
          key: mandateAuth.key,
          orderId: mandateAuth.order_id,
          amountPaise: Math.round(mandateAuth.amount * 100),
          name: 'PGfy Autopay',
          description: 'Authorize Autopay for future rent',
          prefill: { name: mandateAuth.name, contact: mandateAuth.contact },
        });
        return;
      }
      closeRazorpay();
      setRzpStep(null);
      haptic.success();
      goToInvoicePaySuccess(pendingInvoicePay);
      return;
    }

    if (rzpStep === 'mandate' && pendingInvoicePay) {
      closeRazorpay();
      setRzpStep(null);
      haptic.success();
      goToInvoicePaySuccess(pendingInvoicePay);
    }
  };

  const onRazorpayExit = (message?: string) => {
    closeRazorpay();
    const step = rzpStep;
    setRzpStep(null);
    if (message) haptic.error();

    if (step === 'booking') {
      // The booking already exists (PENDING_PAYMENT) — route to its detail page rather than
      // re-calling createBooking (which would open a second hold).
      const bookingId = pendingCreated?.id;
      setPendingCreated(null);
      alert(
        message ? 'Payment failed' : 'Payment not completed',
        message ?? 'Your booking is on hold — you can complete payment from the booking details page.',
      );
      if (bookingId) router.replace(`/booking/${bookingId}`);
      return;
    }

    if (step === 'invoice') {
      setPendingInvoicePay(null);
      alert(
        message ? 'Payment failed' : 'Payment not completed',
        message ?? 'You can try paying this invoice again from Billing & invoices.',
      );
      router.back();
      return;
    }

    if (step === 'extension') {
      // The extension request already exists (PENDING_PAYMENT) with its own invoice — route
      // to the booking rather than re-calling createExtension (which would open a second one).
      const bookingId = intent.extension?.bookingId;
      setPendingExtension(null);
      alert(
        message ? 'Payment failed' : 'Payment not completed',
        message ?? 'Your extension request is on hold — you can complete payment from the booking details page.',
      );
      if (bookingId) router.replace(`/booking/${bookingId}`);
      return;
    }

    if (step === 'mandate') {
      // The invoice itself was already paid — only the recurring mandate failed to authorize.
      const paid = pendingInvoicePay;
      setPendingInvoicePay(null);
      alert(
        'Autopay not set up',
        'Your payment went through, but Autopay could not be authorized. You can set it up again next time you pay.',
      );
      if (paid) goToInvoicePaySuccess(paid);
    }
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
        <Button label={payLabel} loadingLabel="Loading…" icon="lock-closed" loading={loading} onPress={pay} full size="lg" style={{ flex: 1 }} />
      </View>

      <RazorpayCheckout
        key={rzpOrder?.orderId}
        visible={rzpVisible}
        order={rzpOrder}
        onSuccess={onRazorpaySuccess}
        onDismiss={() => onRazorpayExit()}
        onError={(message) => onRazorpayExit(message)}
      />
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
