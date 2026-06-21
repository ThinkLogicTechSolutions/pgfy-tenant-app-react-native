/** T-S — Extend an hourly/daily stay (checked-in tenants). Pick duration → check
 *  availability → pay. Monthly stays cannot be extended. */
import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Divider, Badge, PressableScale, EmptyState } from '@/components/ui';
import { SuccessBurst } from '@/components/illustrations';
import {
  getBookingByRef,
  maxExtensionUnits,
  extensionUnitLabel,
  extensionRate,
  checkExtensionAvailability,
  priceExtension,
  type AvailabilityResult,
} from '@/data';
import { inr, formatDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';

const METHODS = [
  { key: 'upi', label: 'UPI', sub: 'GPay, PhonePe, Paytm', icon: 'phone-portrait-outline' },
  { key: 'card', label: 'Card', sub: 'Visa, Mastercard, RuPay', icon: 'card-outline' },
  { key: 'cash', label: 'Offline Cash', sub: 'Pay at property via OTP', icon: 'cash-outline' },
] as const;

function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${suffix}`;
}

function addHours(hhmm: string, hours: number) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + (m || 0) + hours * 60;
  const nh = Math.floor(total / 60) % 24;
  return `${String(nh).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ExtendBooking() {
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const record = getBookingByRef(String(ref ?? ''));

  const [units, setUnits] = useState(1);
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [method, setMethod] = useState<string>('upi');
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);

  if (!record || record.kind !== 'active' || record.booking.bookingMode === 'monthly') {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
        <ScreenHeader title="Extend stay" />
        <EmptyState
          title="Can't extend this stay"
          message="Only checked-in hourly or daily stays can be extended."
        />
      </View>
    );
  }

  const b = record.booking;
  const isHourly = b.bookingMode === 'hourly';
  const max = maxExtensionUnits(b);
  const rate = extensionRate(b);
  const price = priceExtension(rate, units);
  const available = availability?.available === true;

  const setUnitsSafe = (n: number) => {
    setUnits(Math.max(1, Math.min(max, n)));
    setAvailability(null); // duration changed → re-check
  };

  const currentEnd = isHourly
    ? `${b.checkInDate ? formatDate(b.checkInDate) + ' · ' : ''}${b.startTime ? fmtTime(b.startTime) : ''}–${b.endTime ? fmtTime(b.endTime) : ''}`
    : `${formatDate(b.checkInDate)} → ${b.checkOutDate ? formatDate(b.checkOutDate) : ''}`;

  const newEnd = isHourly
    ? `until ${fmtTime(addHours(b.endTime ?? '00:00', units))}`
    : `until ${formatDate(addDays(b.checkOutDate ?? b.checkInDate, units))}`;

  const pay = () => {
    setPaying(true);
    haptic.success();
    setTimeout(() => {
      setPaying(false);
      setDone(true);
    }, 1100);
  };

  if (done) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <SuccessBurst size={170} />
        <Text variant="h1" align="center" style={{ marginTop: spacing.lg }}>Stay extended!</Text>
        <Text variant="bodyLg" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.sm, maxWidth: 320 }}>
          Your {b.bookingMode} stay at {b.propertyName} is now extended by {extensionUnitLabel(b, units)} ({newEnd}).
        </Text>
        <Button
          label="Back to booking"
          full
          size="lg"
          style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/stay'))}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Extend stay" subtitle={b.propertyName} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing['3xl'], gap: spacing.base }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current stay */}
        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>CURRENT STAY</Text>
          <Row k="Booking" v={b.ref} />
          <Row k="Room / Bed" v={`${b.roomNumber} · Bed ${b.bedLabel}`} />
          <Row k={isHourly ? 'Stay window' : 'Stay dates'} v={currentEnd} last />
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
            <CounterButton icon="remove" disabled={units <= 1} onPress={() => setUnitsSafe(units - 1)} />
            <Text variant="h2" style={{ textAlign: 'center', flex: 1 }}>{extensionUnitLabel(b, units)}</Text>
            <CounterButton icon="add" disabled={units >= max} onPress={() => setUnitsSafe(units + 1)} />
          </View>
          <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: spacing.sm }}>
            Up to {extensionUnitLabel(b, max)} allowed by this property. New stay {newEnd}.
          </Text>
          {availability === null ? (
            <Button label="Check availability" icon="search-outline" variant="subtle" full style={{ marginTop: spacing.md }} onPress={() => { haptic.select(); setAvailability(checkExtensionAvailability(b, units)); }} />
          ) : available ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, backgroundColor: palette.successTint, padding: spacing.md, borderRadius: radius.md }}>
              <Ionicons name="checkmark-circle" size={18} color={palette.success} />
              <Text variant="bodySm" color={palette.success} style={{ flex: 1 }}>Available! Review the price below to confirm.</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, backgroundColor: palette.warningTint, padding: spacing.md, borderRadius: radius.md }}>
              <Ionicons name="alert-circle" size={18} color={palette.warning} />
              <Text variant="bodySm" color="#B26A00" style={{ flex: 1 }}>{availability?.reason}</Text>
            </View>
          )}
        </Card>

        {available ? (
          <>
            {/* Bill */}
            <Card>
              <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>BILL SUMMARY</Text>
              <Row k={`${isHourly ? 'Hourly' : 'Daily'} rate × ${units}`} v={inr(price.base)} />
              <Row k="GST (18%)" v={inr(price.gst)} />
              <Divider style={{ marginVertical: spacing.sm }} />
              <Row k="Payable now" v={inr(price.total)} bold last />
            </Card>

            {/* Payment method */}
            <Card padded={false} style={{ paddingHorizontal: spacing.base }}>
              <Text variant="overline" color={palette.inkTertiary} style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>PAYMENT METHOD</Text>
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

            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
              <Badge label="Instant confirmation" tone="success" icon="flash" small />
              <Badge label="Secure payment" tone="info" icon="lock-closed" small />
            </View>
          </>
        ) : null}
      </ScrollView>

      {available ? (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
          <View>
            <Text variant="caption" color={palette.inkTertiary}>Payable</Text>
            <Text variant="h3" mono color={palette.navy}>{inr(price.total)}</Text>
          </View>
          <Button label={`Pay ${inr(price.total)}`} loadingLabel="Processing payment…" icon="lock-closed" loading={paying} onPress={pay} full size="lg" style={{ flex: 1 }} />
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
