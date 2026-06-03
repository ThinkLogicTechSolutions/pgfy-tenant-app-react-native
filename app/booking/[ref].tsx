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
  const status = isActive ? b.stayStatus : b.status;
  const paidAmount = amount ? Number(amount) : isActive ? b.monthlyRent + b.deposit : b.totalPaid;

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
          {!isActive && 'checkOutDate' in b ? (
            <DetailRow label="Check-out" value={formatDate(b.checkOutDate)} last />
          ) : (
            <DetailRow label="Lease status" value={LEASE.status} last />
          )}
        </Card>

        <Card>
          <Text variant="h3" style={{ marginBottom: spacing.md }}>Payment summary</Text>
          {isActive ? (
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
            <Button label="View check-in pass" icon="qr-code-outline" variant="outline" full onPress={() => router.push('/pass')} />
            <Button label="Go to My Stay" icon="bed-outline" variant="subtle" full onPress={() => router.replace('/(tabs)/stay')} />
          </View>
        ) : (
          <Button label="View property" icon="home-outline" variant="outline" full onPress={() => router.push(`/listing/${b.listingId}`)} />
        )}
      </ScrollView>
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
