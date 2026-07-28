/** Booking details — real `/tenant/booking/:id`. A cancellable booking can be cancelled
 *  here; the API's refund breakdown then carries through to the cancelled screen. */
import { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Divider, EmptyState, Sheet, Input, Badge } from '@/components/ui';
import { bookingApi, errorMessage, type ApiBookingDetail } from '@/lib/api';
import { bookingStatusLabel, bookingStatusTone, bookingModeLabel, bookingCoverImage, isCheckedIn } from '@/lib/bookingDisplay';
import { inr, formatDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';

/** Statuses where the hold hasn't converted into an active stay yet — cancellable. */
const CANCELLABLE_STATUSES = ['PENDING_PAYMENT', 'CONFIRMED'];

function minutesToTime(m: number | null): string | null {
  if (m == null) return null;
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(min).padStart(2, '0')} ${suffix}`;
}

export default function BookingDetails() {
  const { ref, amount } = useLocalSearchParams<{ ref: string; amount?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const id = Number(ref);

  const [booking, setBooking] = useState<ApiBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = () => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    bookingApi.getBooking(id)
      .then(setBooking)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (!Number.isFinite(id) || (!loading && !booking)) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
        <ScreenHeader title="Booking details" />
        <EmptyState
          title={error ? "Couldn't load booking" : 'Booking not found'}
          message={error ?? 'This booking could not be loaded.'}
          actionLabel={error ? 'Retry' : undefined}
          onAction={error ? load : undefined}
        />
      </View>
    );
  }

  if (loading || !booking) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }}>
        <ActivityIndicator color={palette.coral} />
      </View>
    );
  }

  const b = booking;
  const paidAmount = amount ? Number(amount) : b.total_paid ?? b.base_rent + b.security_deposit;
  const cancellable = CANCELLABLE_STATUSES.includes(b.status);
  const isHourly = b.booking_mode === 'HOURLY';

  const confirmCancel = async () => {
    if (!reason.trim() || cancelling) return;
    setCancelling(true);
    try {
      const res = await bookingApi.cancelBooking({ booking_id: b.id, cancellation_reason: reason.trim() });
      haptic.success();
      setSheetOpen(false);
      setReason('');
      router.replace({
        pathname: '/booking/cancelled',
        params: {
          ref: String(b.id),
          propertyName: b.property.name,
          amountPaid: String(res.refund.amount_paid),
          chargeAmount: String(res.refund.cancellation_charge),
          chargeLabel: res.refund.cancellation_charge_label,
          refundAmount: String(res.refund.refund_to_tenant),
          message: res.message,
        },
      });
    } catch (e) {
      haptic.error();
      setError(errorMessage(e));
      setSheetOpen(false);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader
        title="Booking details"
        subtitle={b.code}
        right={<Badge label={bookingStatusLabel(b.status)} tone={bookingStatusTone(b.status)} small />}
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing['3xl'], gap: spacing.base }}
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
          <Image source={{ uri: bookingCoverImage(b.property) }} style={{ width: 80, height: 80, borderRadius: radius.md }} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text variant="h3" numberOfLines={2}>{b.property.name}</Text>
            <Text variant="bodySm" color={palette.inkSecondary} style={{ marginTop: 4 }}>
              {b.property.locality}, {b.property.city}
            </Text>
            <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: 4 }}>{b.property.property_type}</Text>
          </View>
        </Card>

        <Card>
          <Text variant="h3" style={{ marginBottom: spacing.md }}>Stay details</Text>
          <DetailRow label="Booking reference" value={b.code} />
          <DetailRow label="Room / Bed" value={`${b.room_number} · Bed ${b.bed_number}`} />
          <DetailRow label="Room layout" value={b.room_layout} />
          <DetailRow label="Check-in" value={formatDate(b.check_in_date)} />
          {isHourly && (b.hourly_start_slot != null || b.hourly_end_slot != null) ? (
            <DetailRow label="Stay window" value={`${minutesToTime(b.hourly_start_slot) ?? '—'}–${minutesToTime(b.hourly_end_slot) ?? '—'}`} last />
          ) : b.check_out_date ? (
            <DetailRow label="Check-out" value={formatDate(b.check_out_date)} last />
          ) : b.actual_check_in ? (
            <DetailRow label="Checked in on" value={formatDate(b.actual_check_in)} last />
          ) : (
            <DetailRow label="Booking mode" value={bookingModeLabel(b.booking_mode)} last />
          )}
        </Card>

        <Card>
          <Text variant="h3" style={{ marginBottom: spacing.md }}>Payment summary</Text>
          <DetailRow label={isHourly ? 'Hourly rate' : b.booking_mode === 'DAILY' ? 'Daily rate' : 'Monthly rent'} value={inr(b.base_rent)} />
          <DetailRow label="Security deposit" value={inr(b.security_deposit)} />
          {amount ? <DetailRow label="Amount paid now" value={inr(paidAmount)} bold /> : b.total_paid != null ? <DetailRow label="Total paid" value={inr(b.total_paid)} /> : null}
          {b.next_rent_due ? <DetailRow label="Next rent due" value={formatDate(b.next_rent_due)} last /> : null}
        </Card>

        {b.has_check_in_pass ? (
          <Button
            label={isCheckedIn(b) ? 'View PG pass' : 'View check-in pass'}
            icon="qr-code-outline"
            variant="outline"
            full
            onPress={() => router.push({ pathname: '/pass', params: { id: String(b.id) } })}
          />
        ) : null}

        {cancellable ? (
          <Button label="Cancel booking" icon="close-circle-outline" variant="danger" full onPress={() => setSheetOpen(true)} />
        ) : null}
      </ScrollView>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Cancel booking" scroll>
        <View style={{ gap: spacing.base }}>
          <Text variant="bodySm" color={palette.inkSecondary}>
            Cancelling before check-in refunds your payment minus any applicable cancellation charge.
          </Text>
          <Input
            label="Reason for cancellation"
            placeholder="Tell us why you're cancelling…"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />
          <Button
            label="Confirm cancellation"
            full
            size="lg"
            disabled={!reason.trim()}
            loading={cancelling}
            onPress={confirmCancel}
          />
          <Button label="Keep my booking" variant="ghost" full onPress={() => setSheetOpen(false)} disabled={cancelling} />
        </View>
      </Sheet>
    </View>
  );
}

function DetailRow({ label, value, bold, last }: { label: string; value: string; bold?: boolean; last?: boolean }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.md }}>
        <Text variant="bodySm" color={palette.inkTertiary} style={{ flex: 1 }}>{label}</Text>
        <Text variant="bodySm" weight={bold ? '700' : '600'} style={{ textAlign: 'right' }}>{value}</Text>
      </View>
      {!last ? <Divider /> : null}
    </View>
  );
}
