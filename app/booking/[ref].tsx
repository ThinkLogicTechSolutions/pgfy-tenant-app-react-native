/** Booking details — active or past stay summary. */
import { View, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Divider, EmptyState } from '@/components/ui';
import { StatusPill } from '@/components/domain';
import { getBookingByRef, getListing, LEASE } from '@/data';
import { inr, formatDate } from '@/lib/format';

export default function BookingDetails() {
  const { ref, amount } = useLocalSearchParams<{ ref: string; amount?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const status = 'bookingMode' in b ? b.stayStatus : b.status;
  const paidAmount = amount ? Number(amount) : 'bookingMode' in b ? b.monthlyRent + b.deposit : b.totalPaid;

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

        {isActive ? (
          <View style={{ gap: spacing.sm }}>
            {'bookingMode' in b && b.bookingMode !== 'monthly' ? (
              <Button label="Extend stay" icon="time-outline" full onPress={() => router.push({ pathname: '/booking/extend', params: { ref: b.ref } })} />
            ) : null}
            <Button label="View check-in pass" icon="qr-code-outline" variant="outline" full onPress={() => router.push('/pass')} />
          </View>
        ) : null}
      </ScrollView>
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
