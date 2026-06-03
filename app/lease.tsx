/** T-S19 — Digital lease agreement (view & e-sign). */
import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Divider, Sheet } from '@/components/ui';
import { StatusPill } from '@/components/domain';
import { SuccessBurst } from '@/components/illustrations';
import { LEASE, ACTIVE_BOOKING } from '@/data';
import { inr, formatDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';

export default function LeaseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [signOpen, setSignOpen] = useState(false);
  const [signed, setSigned] = useState(LEASE.status === 'Signed');

  const doSign = () => { haptic.success(); setSigned(true); setSignOpen(false); };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Lease agreement" subtitle={LEASE.id} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + 110, gap: spacing.base }} showsVerticalScrollIndicator={false}>
        {/* Status banner */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: signed ? palette.successTint : palette.warningTint, borderRadius: radius.lg, padding: spacing.base }}>
          <Ionicons name={signed ? 'checkmark-circle' : 'time'} size={24} color={signed ? palette.success : palette.warning} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyMd" weight="700" color={signed ? palette.success : '#B26A00'}>{signed ? 'Signed & active' : 'Pending your signature'}</Text>
            <Text variant="caption" color={signed ? palette.success : '#B26A00'}>{signed ? 'Your agreement is legally active.' : 'Review and e-sign to activate your stay.'}</Text>
          </View>
        </View>

        {/* Summary */}
        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>AGREEMENT SUMMARY</Text>
          <Row k="Property" v={ACTIVE_BOOKING.propertyName} />
          <Row k="Room / Bed" v={`${ACTIVE_BOOKING.roomNumber} · ${ACTIVE_BOOKING.bedLabel}`} />
          <Row k="Start date" v={formatDate(LEASE.startDate)} />
          <Row k="End date" v={formatDate(LEASE.endDate)} />
          <Row k="Monthly rent" v={inr(ACTIVE_BOOKING.monthlyRent)} />
          <Row k="Security deposit" v={inr(ACTIVE_BOOKING.deposit)} />
          <Row k="Lock-in period" v={`${LEASE.lockInMonths} months`} />
          <Row k="Notice period" v={`${LEASE.noticeDays} days`} />
          <Row k="Early-exit penalty" v={inr(LEASE.earlyExitPenalty)} last />
        </Card>

        {/* Document preview */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 48, height: 60, borderRadius: radius.sm, backgroundColor: palette.dangerTint, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="document-text" size={26} color={palette.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMd" weight="600">PGfy_Lease_{LEASE.id}.pdf</Text>
              <Text variant="caption" color={palette.inkTertiary}>8 pages · e-sign via Cashfree</Text>
            </View>
            <Ionicons name="eye-outline" size={22} color={palette.navy} />
          </View>
        </Card>

        {signed && LEASE.daysToExpiry <= 60 ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, backgroundColor: palette.warningTint, padding: spacing.md, borderRadius: radius.md }}>
            <Ionicons name="alert-circle" size={18} color={palette.warning} />
            <Text variant="caption" color="#B26A00" style={{ flex: 1 }}>Your agreement expires in {LEASE.daysToExpiry} days. Renew to continue your stay.</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
        <Button label="Download" variant="outline" icon="download-outline" style={{ flex: 1 }} full />
        {signed ? (
          <Button label="Renew lease" icon="refresh" style={{ flex: 1.4 }} full />
        ) : (
          <Button label="Review & Sign" icon="create-outline" onPress={() => setSignOpen(true)} style={{ flex: 1.4 }} full />
        )}
      </View>

      <Sheet visible={signOpen} onClose={() => setSignOpen(false)} title="E-sign agreement">
        {signed ? null : (
          <View style={{ gap: spacing.base }}>
            <Text variant="bodySm" color={palette.inkSecondary}>You're signing the lease for {ACTIVE_BOOKING.propertyName}. This is legally binding and powered by Cashfree e-sign.</Text>
            <View style={{ height: 90, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: palette.borderStrong, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceRaised }}>
              <Ionicons name="finger-print-outline" size={28} color={palette.inkTertiary} />
              <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: 4 }}>Tap to authenticate with Aadhaar e-sign</Text>
            </View>
            <Button label="Confirm & Sign" icon="checkmark" onPress={doSign} full size="lg" />
          </View>
        )}
      </Sheet>
    </View>
  );
}

function Row({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm }}>
        <Text variant="bodySm" color={palette.inkTertiary}>{k}</Text>
        <Text variant="bodySm" weight="600">{v}</Text>
      </View>
      {!last ? <Divider /> : null}
    </View>
  );
}
