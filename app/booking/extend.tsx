/** Extend a Daily/Hourly checked-in stay. Real `GET/POST /tenant/extend-stay`: preview the
 *  booking → pick a quantity → check availability (live price) → pay via the unified
 *  checkout, which calls `POST /tenant/extend-stay` for real. Monthly stays can't extend. */
import { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Divider, Badge, PressableScale, EmptyState, Skeleton } from '@/components/ui';
import { extendStayApi, errorMessage, type ApiExtendStayPreview, type ApiExtendStayAvailability } from '@/lib/api';
import { computeCheckout, type CheckoutIntent, type GstRate } from '@/lib/billing';
import { inr, formatDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';

function minutesToTime(m: number | null): string | null {
  if (m == null) return null;
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(min).padStart(2, '0')} ${suffix}`;
}

export default function ExtendBooking() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const id = Number(bookingId);

  const [preview, setPreview] = useState<ApiExtendStayPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [availability, setAvailability] = useState<ApiExtendStayAvailability | null>(null);
  const [checking, setChecking] = useState(false);

  const load = () => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    extendStayApi.getExtendStayPreview(id)
      .then((data) => {
        setPreview(data);
        setQuantity((q) => Math.max(1, Math.min(data.max_allowed, q)));
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const setQuantitySafe = (n: number) => {
    if (!preview) return;
    setQuantity(Math.max(1, Math.min(preview.max_allowed, n)));
    setAvailability(null); // duration changed → re-check
  };

  const checkAvailability = () => {
    if (!preview) return;
    haptic.select();
    setChecking(true);
    extendStayApi.checkExtensionAvailability({ booking_id: String(id), quantity, coupon_code: null })
      .then(setAvailability)
      .catch((e) => setAvailability({
        available: false,
        reason: errorMessage(e),
        max_allowed: preview.max_allowed,
        quantity,
        extension_mode: preview.extension_mode,
        new_check_out_date: null,
        new_hourly_end_slot: null,
        new_duration_hours: null,
        bill_summary: { rate_label: '', unit_rate: 0, quantity, base_amount: 0, gst_rate: 0, gst_amount: 0, coupon_discount: 0, total_payable: 0 },
      }))
      .finally(() => setChecking(false));
  };

  if (!Number.isFinite(id) || (!loading && !preview) || error) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
        <ScreenHeader title="Extend stay" />
        <EmptyState
          title={error ? "Couldn't load this booking" : "Can't extend this stay"}
          message={error ?? 'This booking could not be found.'}
          actionLabel={error ? 'Retry' : undefined}
          onAction={error ? load : undefined}
        />
      </View>
    );
  }

  if (loading || !preview) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
        <ScreenHeader title="Extend stay" />
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm, gap: spacing.base }}>
          <Skeleton width="100%" height={110} rounded={radius.lg} />
          <Skeleton width="100%" height={140} rounded={radius.lg} />
        </View>
      </View>
    );
  }

  if (!preview.can_extend) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
        <ScreenHeader title="Extend stay" />
        <EmptyState
          title="Can't extend this stay"
          message="This booking isn't eligible for an extension right now."
        />
      </View>
    );
  }

  const b = preview.booking;
  const isHourly = preview.extension_mode === 'HOURLY';
  const unitLabel = isHourly ? (quantity === 1 ? 'hour' : 'hours') : (quantity === 1 ? 'day' : 'days');
  const maxUnitLabel = isHourly ? (preview.max_allowed === 1 ? 'hour' : 'hours') : (preview.max_allowed === 1 ? 'day' : 'days');

  const currentWindow = isHourly
    ? `${formatDate(b.check_in_date)}${minutesToTime(b.hourly_start_slot) ? ` · ${minutesToTime(b.hourly_start_slot)}` : ''}${minutesToTime(b.hourly_end_slot) ? `–${minutesToTime(b.hourly_end_slot)}` : ''}`
    : `${formatDate(b.check_in_date)} → ${b.check_out_date ? formatDate(b.check_out_date) : '—'}`;

  const available = availability?.available === true;
  const bill = availability?.bill_summary;

  const newEndLabel = available
    ? isHourly
      ? (availability?.new_hourly_end_slot != null ? `until ${minutesToTime(availability.new_hourly_end_slot)}` : '')
      : (availability?.new_check_out_date ? `until ${formatDate(availability.new_check_out_date)}` : '')
    : '';

  const intent: CheckoutIntent | null = bill ? {
    kind: 'extend',
    title: `Extend stay · ${preview.property.name}`,
    subtitle: `${b.code} · +${quantity} ${unitLabel}${newEndLabel ? ` (${newEndLabel})` : ''}`,
    billingMode: isHourly ? 'hourly' : 'daily',
    baseAmount: bill.base_amount,
    unitRate: bill.unit_rate,
    allowAutopay: false,
    applyPlatformFee: false,
    applyGst: true,
    // Trust the server's own GST rate rather than re-deriving it client-side.
    gstConfig: { mode: 'manual', manual: { monthly: 0, daily: bill.gst_rate as GstRate, hourly: bill.gst_rate as GstRate } },
    extension: { bookingId: id, quantity },
  } : null;

  const previewQuote = intent ? computeCheckout(intent) : null;

  const proceed = () => {
    if (!intent) return;
    haptic.success();
    router.push({ pathname: '/checkout', params: { intent: JSON.stringify(intent) } });
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Extend stay" subtitle={preview.property.name} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing['3xl'], gap: spacing.base }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current stay */}
        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>CURRENT STAY</Text>
          <Row k="Booking" v={b.code} />
          <Row k="Room / Bed" v={`${b.room_number} · Bed ${b.bed_number}`} />
          <Row k={isHourly ? 'Stay window' : 'Stay dates'} v={currentWindow} last />
        </Card>

        {/* Duration */}
        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>
            {isHourly ? 'EXTEND BY (HOURS)' : 'EXTEND BY (DAYS)'}
          </Text>
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
              backgroundColor: palette.surfaceRaised, borderRadius: radius.md, borderWidth: 1.5, borderColor: palette.border,
            }}
          >
            <CounterButton icon="remove" disabled={quantity <= 1} onPress={() => setQuantitySafe(quantity - 1)} />
            <Text variant="h2" style={{ textAlign: 'center', flex: 1 }}>{quantity} {unitLabel}</Text>
            <CounterButton icon="add" disabled={quantity >= preview.max_allowed} onPress={() => setQuantitySafe(quantity + 1)} />
          </View>
          <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: spacing.sm }}>
            Up to {preview.max_allowed} {maxUnitLabel} allowed by this property.
          </Text>
          {availability === null ? (
            <Button label="Check availability" icon="search-outline" variant="subtle" full loading={checking} style={{ marginTop: spacing.md }} onPress={checkAvailability} />
          ) : available ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, backgroundColor: palette.successTint, padding: spacing.md, borderRadius: radius.md }}>
              <Ionicons name="checkmark-circle" size={18} color={palette.success} />
              <Text variant="bodySm" color={palette.success} style={{ flex: 1 }}>Available! Review the price below to confirm.</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, backgroundColor: palette.warningTint, padding: spacing.md, borderRadius: radius.md }}>
              <Ionicons name="alert-circle" size={18} color={palette.warning} />
              <Text variant="bodySm" color="#B26A00" style={{ flex: 1 }}>{availability?.reason ?? 'This extension is not available.'}</Text>
            </View>
          )}
        </Card>

        {available && previewQuote ? (
          <>
            {/* Bill */}
            <Card>
              <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>BILL SUMMARY</Text>
              <Row k={bill?.rate_label || `${isHourly ? 'Hourly' : 'Daily'} rate × ${quantity}`} v={inr(previewQuote.base)} />
              <Row k={previewQuote.gstRate === 0 ? 'GST (exempt)' : `GST (${previewQuote.gstRate}%)`} v={inr(previewQuote.gst)} />
              <Divider style={{ marginVertical: spacing.sm }} />
              <Row k="Payable now" v={inr(previewQuote.total)} bold last />
            </Card>

            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
              <Badge label="Secure payment · Razorpay" tone="info" icon="lock-closed" small />
            </View>
          </>
        ) : null}
      </ScrollView>

      {available && previewQuote ? (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
          <View>
            <Text variant="caption" color={palette.inkTertiary}>Payable</Text>
            <Text variant="h3" mono color={palette.navy}>{inr(previewQuote.total)}</Text>
          </View>
          <Button label="Proceed to Pay" icon="lock-closed" onPress={proceed} full size="lg" style={{ flex: 1 }} />
        </View>
      ) : null}
    </View>
  );
}

function CounterButton({ icon, disabled, onPress }: { icon: 'add' | 'remove'; disabled: boolean; onPress: () => void }) {
  return (
    <PressableScale
      onPress={disabled ? undefined : onPress}
      scaleTo={disabled ? 1 : 0.9}
      style={{
        width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center',
        backgroundColor: disabled ? palette.border : palette.navyTint, opacity: disabled ? 0.4 : 1,
      }}
    >
      <Ionicons name={icon} size={24} color={disabled ? palette.inkTertiary : palette.navy} />
    </PressableScale>
  );
}

function Row({ k, v, bold, last }: { k: string; v: string; bold?: boolean; last?: boolean }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, gap: spacing.md }}>
        <Text variant={bold ? 'bodyMd' : 'bodySm'} weight={bold ? '700' : '400'} color={bold ? palette.ink : palette.inkSecondary} style={{ flex: 1 }}>{k}</Text>
        <Text variant={bold ? 'bodyMd' : 'bodySm'} weight={bold ? '700' : '600'} mono color={bold ? palette.navy : palette.ink} style={{ textAlign: 'right' }}>{v}</Text>
      </View>
      {!last && !bold ? <Divider /> : null}
    </View>
  );
}
