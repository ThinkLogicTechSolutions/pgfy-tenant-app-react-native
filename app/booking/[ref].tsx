/** Booking details — real `/tenant/booking/:id`. A cancellable booking can be cancelled
 *  here; the API's refund breakdown then carries through to the cancelled screen. */
import { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Linking, Share, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Divider, EmptyState, Sheet, Input, Badge, Skeleton } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { bookingApi, errorMessage, type ApiBookingDetail, type ApiBookingRefund, type ApiStayExtension, type BookingStatusApi } from '@/lib/api';
import { bookingStatusLabel, bookingStatusTone, bookingModeLabel, bookingCoverImage, isCheckedIn, isUnitBooking, latestConfirmedExtension, extensionBannerMessage } from '@/lib/bookingDisplay';
import { isUnitPropertyType } from '@/lib/listingAdapter';
import { inr, formatDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { alert } from '@/lib/alertDialog';

/** Every status that precedes check-in — a booking stays cancellable right up until the
 *  tenant actually checks in (`CHECKED_IN` and everything after it is not cancellable). */
const CANCELLABLE_STATUSES = ['PENDING_PAYMENT',  "PENDING_APPROVAL",'CONFIRMED'];

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
  const [retrying, setRetrying] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [sharingInvoice, setSharingInvoice] = useState(false);
  // Authoritative refund breakdown for the cancel sheet — fetched from the API's preview
  // mode rather than estimated client-side, so the charge shown is the charge applied.
  const [refundPreview, setRefundPreview] = useState<ApiBookingRefund | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

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
  const isUnit = isUnitBooking(b) || isUnitPropertyType(b.property);
  const extension = latestConfirmedExtension(b.extensions);
  const isProrated = b.booking_mode === 'MONTHLY' && b.prorated_days != null && b.days_in_month != null && b.prorated_days < b.days_in_month;
  const sortedExtensions = [...(b.extensions ?? [])].sort(
    (x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime(),
  );
  const pendingPayment = b.status === 'PENDING_PAYMENT';

  const retryPayment = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      // Re-fetch first — the payment link can be minted after the hold, and may have
      // rotated since this screen last loaded.
      const fresh = await bookingApi.getBooking(b.id);
      setBooking(fresh);
      const link = fresh.transaction?.payment_link;
      if (!link) {
        alert('Payment link unavailable', 'We couldn’t find an active payment link for this booking. Please contact support to complete your payment.');
        return;
      }
      await Linking.openURL(link);
    } catch (e) {
      alert('Unable to open payment', errorMessage(e));
    } finally {
      setRetrying(false);
    }
  };

  const openInvoice = async () => {
    if (downloadingInvoice) return;
    setDownloadingInvoice(true);
    try {
      // Fetched on demand rather than trusted from `b.receipt_url` — the invoice is minted
      // asynchronously post-payment, so this is the authoritative, always-fresh source.
      const invoice = await bookingApi.getBookingInvoice(b.id);
      await Linking.openURL(invoice.invoice_link);
    } catch (e) {
      alert('Unable to open invoice', errorMessage(e));
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const shareInvoice = async () => {
    if (sharingInvoice) return;
    setSharingInvoice(true);
    try {
      const invoice = await bookingApi.getBookingInvoice(b.id);
      const message = `Booking invoice for ${b.property.name} — booking ${b.code}. ${invoice.invoice_link}`;
      // iOS can carry the link separately from the message; Android folds it into the text.
      await Share.share(Platform.OS === 'ios' ? { url: invoice.invoice_link, message } : { message });
    } catch (e) {
      alert('Could not share invoice', errorMessage(e));
    } finally {
      setSharingInvoice(false);
    }
  };

  /** Opens the cancel sheet and pulls the real charge/refund breakdown for it. */
  const openCancelSheet = () => {
    setSheetOpen(true);
    setRefundPreview(null);
    setPreviewError(null);
    bookingApi.previewCancellation(b.id)
      .then((res) => setRefundPreview(res.refund))
      .catch((e) => setPreviewError(errorMessage(e)));
  };

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

        {extension ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.infoTint, borderRadius: radius.md, padding: spacing.md }}>
            <Ionicons name="information-circle" size={20} color={palette.info} />
            <Text variant="bodySm" weight="600" color={palette.info} style={{ flex: 1 }}>
              {extensionBannerMessage(extension)}
            </Text>
          </View>
        ) : null}

        <Card>
          <Text variant="h3" style={{ marginBottom: spacing.md }}>Stay details</Text>
          <DetailRow label="Booking reference" value={b.code} />
          {isUnit ? (
            <DetailRow label="Booking" value={`${b.guest_count ? ` · ${b.guest_count} guest${b.guest_count > 1 ? 's' : ''}` : ''}`} />
          ) : (
            <>
              <DetailRow label="Room / Bed" value={`${b.room_number} · Bed ${b.bed_number}`} />
              <DetailRow label="Room layout" value={b.room_layout} />
            </>
          )}
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
          {isProrated ? (
            <DetailRow label={`First month rent (${b.prorated_days} days)`} value={inr(b.move_in_rent ?? b.base_rent)} />
          ) : null}
          <DetailRow label={isHourly ? 'Hourly rate' : b.booking_mode === 'DAILY' ? 'Daily rate' : 'Monthly rent'} value={inr(b.base_rent)} />
          {/* Daily/hourly stays don't collect a security deposit — only monthly does. */}
          {b.booking_mode === 'MONTHLY' ? <DetailRow label="Security deposit" value={inr(b.security_deposit)} /> : null}
          {amount ? <DetailRow label="Amount paid now" value={inr(paidAmount)} bold /> : b.total_paid != null ? <DetailRow label="Total paid" value={inr(b.total_paid)} /> : null}
          {b.next_rent_due ? <DetailRow label="Next rent due" value={formatDate(b.next_rent_due)} last /> : null}
        </Card>

        {pendingPayment ? (
          <Button
            label="Retry Payment"
            icon="card-outline"
            full
            loading={retrying}
            onPress={retryPayment}
          />
        ) : null}

        {b.has_check_in_pass ? (
          <Button
            label={isCheckedIn(b) ? 'View PG pass' : 'View check-in pass'}
            icon="qr-code-outline"
            variant="outline"
            full
            onPress={() => router.push({ pathname: '/pass', params: { id: String(b.id) } })}
          />
        ) : null}

        {/* Invoice — only once the booking has actually been paid for; fetched on demand
            from `/tenant/booking-invoice` when tapped, not preloaded. */}
        {!pendingPayment ? (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button
              label="Download invoice"
              icon="download-outline"
              variant="outline"
              style={{ flex: 1 }}
              loading={downloadingInvoice}
              onPress={openInvoice}
            />
            <Button
              label="Share"
              icon="share-social-outline"
              variant="outline"
              style={{ flex: 1 }}
              loading={sharingInvoice}
              onPress={shareInvoice}
            />
          </View>
        ) : null}

        {cancellable ? (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button
              label="Need help?"
              icon="help-buoy-outline"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/support', params: { kind: 'platform' } })}
            />
            <Button label="Cancel booking" icon="close-circle-outline" variant="danger" style={{ flex: 1 }} onPress={openCancelSheet} />
          </View>
        ) : (
          <Button
            label="Need help?"
            icon="help-buoy-outline"
            variant="outline"
            full
            onPress={() => router.push({ pathname: '/support', params: { kind: 'platform' } })}
          />
        )}

        {/* Extension history — a booking can be extended more than once, most recent first */}
        {sortedExtensions.map((ext) => (
          <ExtensionCard key={ext.id} extension={ext} />
        ))}
      </ScrollView>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Cancel booking" scroll>
        <View style={{ gap: spacing.base }}>
          <Text variant="bodySm" color={palette.inkSecondary}>
            Cancelling before check-in refunds your payment minus any applicable cancellation charge.
          </Text>

          {/* Charge/refund breakdown straight from the API — the same numbers that will be
              applied on confirm, so there's no gap between preview and outcome. */}
          {previewError ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.warningTint, borderRadius: radius.md, padding: spacing.md }}>
              <Ionicons name="alert-circle-outline" size={18} color={palette.warning} />
              <Text variant="caption" color={palette.warning} style={{ flex: 1 }}>
                Couldn&apos;t load the refund breakdown. You can still cancel — the exact charge will be confirmed on the next screen.
              </Text>
            </View>
          ) : refundPreview ? (
            <Card>
              <DetailRow label="Amount paid" value={inr(refundPreview.amount_paid)} />
              <DetailRow
                label={
                  refundPreview.cancellation_charge_type === 'PERCENTAGE' && refundPreview.cancellation_charge_value != null
                    ? `${refundPreview.cancellation_charge_label} (${refundPreview.cancellation_charge_value}%)`
                    : refundPreview.cancellation_charge_label
                }
                value={`− ${inr(refundPreview.cancellation_charge)}`}
              />
              <DetailRow label="Refund to you" value={inr(refundPreview.refund_to_tenant)} bold last />
            </Card>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {[0, 1, 2].map((i) => <Skeleton key={i} width="100%" height={20} rounded={radius.sm} />)}
            </View>
          )}

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

function ExtensionCard({ extension: ext }: { extension: ApiStayExtension }) {
  const isHourly = ext.extension_mode === 'HOURLY';
  const extendedBy = isHourly
    ? `${ext.quantity} hour${ext.quantity === 1 ? '' : 's'}`
    : `${ext.quantity} day${ext.quantity === 1 ? '' : 's'}`;
  const newCheckOutLabel = isHourly ? 'New check-out time' : 'New check-out date';
  const newCheckOutValue = isHourly
    ? minutesToTime(ext.new_hourly_end_slot) ?? '—'
    : ext.new_check_out_date ? formatDate(ext.new_check_out_date) : '—';

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.xs }}>
        <Text variant="h3">Extension details</Text>
        <Badge label={bookingStatusLabel(ext.status as BookingStatusApi)} tone={bookingStatusTone(ext.status as BookingStatusApi)} small />
      </View>
      <Text variant="bodySm" weight="700" color={palette.ink}>{ext.code}</Text>
      <Text variant="caption" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>{formatDate(ext.created_at)}</Text>
      <DetailRow label="Extended by" value={extendedBy} />
      <DetailRow label={newCheckOutLabel} value={newCheckOutValue} />
      <DetailRow label="Base amount" value={inr(ext.base_amount)} />
      <DetailRow label={`GST (${ext.gst_rate}%)`} value={inr(ext.gst_amount)} />
      <DetailRow label="Total payable" value={inr(ext.total_payable)} bold last />
    </Card>
  );
}
