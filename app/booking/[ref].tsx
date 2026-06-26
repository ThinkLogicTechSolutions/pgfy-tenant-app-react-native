/** Booking details — active or past stay summary. A confirmed booking can be cancelled
 *  before check-in; the cancellation reason + refund breakdown then show here. */
import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Divider, EmptyState, Sheet, Input } from '@/components/ui';
import { StatusPill } from '@/components/domain';
import { getBookingByRef, getListing, LEASE, computeCancellationCharge, REFUND_ETA } from '@/data';
import { useBookingCancellations } from '@/store/bookingCancellations';
import { inr, formatDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';

export default function BookingDetails() {
  const { ref, amount } = useLocalSearchParams<{ ref: string; amount?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cancelStore = useBookingCancellations();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reason, setReason] = useState('');
  const record = getBookingByRef(String(ref ?? ''));

  if (!record) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
        <ScreenHeader title="Booking details" />
        <EmptyState title="Booking not found" message="This booking reference could not be loaded." />
      </View>
    );
  }

  const listing = getListing(record.booking.listingId);
  const isActive = record.kind === 'active';
  const b = record.booking;
  const cancellation = cancelStore.get(b.ref);
  // A confirmed booking the tenant hasn't checked into yet can still be cancelled.
  const isBeforeCheckIn = isActive && 'bookingMode' in b && (b.status === 'Confirmed' || b.status === 'Awaiting Approval');
  const status = cancellation ? 'Cancelled' : 'bookingMode' in b ? (isBeforeCheckIn ? b.status : b.stayStatus) : b.status;
  const paidAmount = amount ? Number(amount) : 'bookingMode' in b ? b.monthlyRent + b.deposit : b.totalPaid;

  const charge = 'bookingMode' in b ? computeCancellationCharge(b.bookingMode, paidAmount) : null;

  const confirmCancel = () => {
    if (!charge || !reason.trim()) return;
    cancelStore.cancel(b.ref, {
      reason: reason.trim(),
      cancelledOn: new Date().toISOString(),
      chargeType: charge.chargeType,
      chargeAmount: charge.chargeAmount,
      amountPaid: paidAmount,
      refundAmount: charge.refundAmount,
      refundEta: REFUND_ETA,
    });
    haptic.success();
    setSheetOpen(false);
    setReason('');
    router.replace({ pathname: '/booking/cancelled', params: { ref: b.ref } });
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader
        title="Booking details"
        subtitle={b.ref}
        right={<StatusPill status={status} small />}
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing['3xl'], gap: spacing.base }}
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
          <Image source={{ uri: b.propertyImage }} style={{ width: 80, height: 80, borderRadius: radius.md }} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text variant="h3" numberOfLines={2}>{b.propertyName}</Text>
            <Text variant="bodySm" color={palette.inkSecondary} style={{ marginTop: 4 }}>
              {b.locality}{listing?.city ? `, ${listing.city}` : ''}
            </Text>
            {!isActive && 'type' in b ? (
              <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: 4 }}>{b.type}</Text>
            ) : null}
          </View>
        </Card>

        <Card>
          <Text variant="h3" style={{ marginBottom: spacing.md }}>Stay details</Text>
          <DetailRow label="Booking reference" value={b.ref} />
          <DetailRow label="Room / Bed" value={`${b.roomNumber} · Bed ${b.bedLabel}`} />
          <DetailRow label="Sharing" value={b.sharingType} />
          <DetailRow label="Check-in" value={formatDate(b.checkInDate)} />
          {isActive && 'bookingMode' in b && b.bookingMode === 'hourly' ? (
            <DetailRow label="Stay window" value={`${b.startTime ? fmtTime(b.startTime) : ''}–${b.endTime ? fmtTime(b.endTime) : ''}`} last />
          ) : 'checkOutDate' in b && b.checkOutDate ? (
            <DetailRow label="Check-out" value={formatDate(b.checkOutDate)} last />
          ) : (
            <DetailRow label="Lease status" value={LEASE.status} last />
          )}
        </Card>

        <Card>
          <Text variant="h3" style={{ marginBottom: spacing.md }}>Payment summary</Text>
          {isActive && 'bookingMode' in b && b.bookingMode !== 'monthly' ? (
            <DetailRow
              label={b.bookingMode === 'hourly' ? 'Hourly rate' : 'Daily rate'}
              value={`${inr(b.bookingMode === 'hourly' ? b.ratePerHour ?? 0 : b.ratePerDay ?? 0)}${b.bookingMode === 'hourly' ? '/hr' : '/day'}`}
              last
            />
          ) : 'bookingMode' in b ? (
            <>
              <DetailRow label="Monthly rent" value={`${inr(b.monthlyRent)}/mo`} />
              <DetailRow label="Security deposit" value={inr(b.deposit)} />
              {amount ? <DetailRow label="Amount paid now" value={inr(paidAmount)} bold /> : null}
              <DetailRow label="Next rent due" value={formatDate(b.nextRentDue)} last />
            </>
          ) : (
            <>
              <DetailRow label="Monthly rent" value={`${inr(b.monthlyRent)}/mo`} />
              <DetailRow label="Total paid" value={inr(b.totalPaid)} />
              {'refundedDeposit' in b && b.refundedDeposit > 0 ? (
                <DetailRow label="Deposit refunded" value={inr(b.refundedDeposit)} last />
              ) : (
                <DetailRow label="Duration" value={`${b.durationMonths} months`} last />
              )}
            </>
          )}
        </Card>

        {cancellation ? (
          <Card style={{ borderWidth: 1, borderColor: palette.dangerTint }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
              <Ionicons name="close-circle" size={20} color={palette.danger} />
              <Text variant="h3">Booking cancelled</Text>
            </View>
            <View style={{ backgroundColor: palette.surfaceRaised, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md }}>
              <Text variant="caption" color={palette.inkTertiary}>Reason</Text>
              <Text variant="bodySm" weight="600" style={{ marginTop: 2 }}>{cancellation.reason}</Text>
            </View>
            <DetailRow label="Amount paid" value={inr(cancellation.amountPaid)} />
            <DetailRow label="Cancellation charge" value={`− ${inr(cancellation.chargeAmount)}`} />
            <DetailRow label="Refund amount" value={inr(cancellation.refundAmount)} bold last />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, backgroundColor: palette.successTint, borderRadius: radius.md, padding: spacing.md }}>
              <Ionicons name="cash-outline" size={18} color={palette.success} />
              <Text variant="bodySm" color={palette.inkSecondary} style={{ flex: 1 }}>
                {inr(cancellation.refundAmount)} will be refunded to your original payment method within {cancellation.refundEta}.
              </Text>
            </View>
          </Card>
        ) : isActive ? (
          <View style={{ gap: spacing.sm }}>
            {'bookingMode' in b && b.bookingMode !== 'monthly' ? (
              <Button label="Extend stay" icon="time-outline" full onPress={() => router.push({ pathname: '/booking/extend', params: { ref: b.ref } })} />
            ) : null}
            <Button label="View check-in pass" icon="qr-code-outline" variant="outline" full onPress={() => router.push('/pass')} />
            {isBeforeCheckIn ? (
              <Button label="Cancel booking" icon="close-circle-outline" variant="danger" full onPress={() => setSheetOpen(true)} />
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Cancel booking" scroll>
        <View style={{ gap: spacing.base }}>
          <Text variant="bodySm" color={palette.inkSecondary}>
            Cancel before check-in and we'll refund your payment minus the cancellation charge. Refunds reach your
            original payment method within {REFUND_ETA}.
          </Text>
          <Input
            label="Reason for cancellation"
            placeholder="Tell us why you're cancelling…"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />
          {charge ? (
            <View style={{ backgroundColor: palette.surfaceRaised, borderRadius: radius.md, padding: spacing.md }}>
              <DetailRow label="Amount paid" value={inr(paidAmount)} />
              <DetailRow label="Cancellation charge" value={`− ${inr(charge.chargeAmount)}`} />
              <DetailRow label="You'll be refunded" value={inr(charge.refundAmount)} bold last />
            </View>
          ) : null}
          <Button
            label="Confirm cancellation"
            full
            size="lg"
            disabled={!reason.trim()}
            onPress={confirmCancel}
          />
          <Button label="Keep my booking" variant="ghost" full onPress={() => setSheetOpen(false)} />
        </View>
      </Sheet>
    </View>
  );
}

function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${suffix}`;
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
