/** T-S19 — Lease agreement detail. Real `GET /tenant/lease-agreements/:id` (opened via `id`,
 * e.g. from the lease-agreements list) or the latest lease for a booking (via `bookingId`,
 * e.g. from My Stay's "Lease" quick action). */
import { useEffect, useState } from 'react';
import { View, ScrollView, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Divider, EmptyState, Skeleton, PressableScale } from '@/components/ui';
import { EmptyGeneric } from '@/components/illustrations';
import { leaseApi, errorMessage, type LeaseAgreement } from '@/lib/api';
import { leaseStatusLabel, leaseSigningUrl } from '@/lib/leaseDisplay';
import { formatDate } from '@/lib/format';
import { showAlert } from '@/lib/alert';
import { haptic } from '@/lib/haptics';

const STATUS_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  SIGNED: 'checkmark-circle',
  PENDING_TENANT: 'time',
  CANCELLED: 'close-circle',
  EXPIRED: 'close-circle',
};

const STATUS_TONE_COLOR: Record<string, { bg: string; fg: string }> = {
  SIGNED: { bg: palette.successTint, fg: palette.success },
  PENDING_TENANT: { bg: palette.warningTint, fg: '#B26A00' },
  CANCELLED: { bg: palette.surfaceRaised, fg: palette.inkSecondary },
  EXPIRED: { bg: palette.dangerTint, fg: palette.danger },
};

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

async function openUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    showAlert('Unable to open', 'Please try again in a moment.');
  }
}

export default function LeaseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, bookingId } = useLocalSearchParams<{ id?: string; bookingId?: string }>();

  const [lease, setLease] = useState<LeaseAgreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetch = id
      ? leaseApi.getLeaseAgreement(Number(id))
      : bookingId
        ? leaseApi.getLeaseAgreementForBooking(Number(bookingId))
        : Promise.resolve(null);
    fetch
      .then(setLease)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id, bookingId]);

  if (loading) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
        <ScreenHeader title="Lease agreement" />
        <View style={{ paddingHorizontal: spacing.base, gap: spacing.base }}>
          <Skeleton width="100%" height={72} rounded={radius.lg} />
          <Skeleton width="100%" height={220} rounded={radius.lg} />
          <Skeleton width="100%" height={80} rounded={radius.lg} />
        </View>
      </View>
    );
  }

  if (error || !lease) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
        <ScreenHeader title="Lease agreement" />
        <EmptyState
          illustration={<EmptyGeneric />}
          title={error ? "Couldn't load this lease" : 'No lease agreement yet'}
          message={error ?? "This booking doesn't have a lease agreement on file yet."}
          actionLabel={!error && !id ? 'View all lease agreements' : undefined}
          onAction={!error && !id ? () => router.push('/lease-agreements') : undefined}
        />
      </View>
    );
  }

  const tone = STATUS_TONE_COLOR[lease.status] ?? STATUS_TONE_COLOR.CANCELLED;
  const icon = STATUS_ICON[lease.status] ?? 'document-text';
  const downloadUrl = lease.signed_pdf_url ?? lease.agreement_url;
  const signingUrl = lease.status === 'PENDING_TENANT' ? leaseSigningUrl(lease.lease_signing_urls) : null;
  const expiringSoon = lease.status === 'SIGNED' && daysUntil(lease.lease_end_date) <= 60 && daysUntil(lease.lease_end_date) >= 0;

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Lease agreement" subtitle={lease.booking.code} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + 110, gap: spacing.base }} showsVerticalScrollIndicator={false}>
        {/* Status banner */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: tone.bg, borderRadius: radius.lg, padding: spacing.base }}>
          <Ionicons name={icon} size={24} color={tone.fg} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyMd" weight="700" color={tone.fg}>{leaseStatusLabel(lease.status)}</Text>
            <Text variant="caption" color={tone.fg}>
              {lease.status === 'SIGNED'
                ? 'Your agreement is legally active.'
                : lease.status === 'PENDING_TENANT'
                  ? 'Review and e-sign to activate your stay.'
                  : `Lease #${lease.id}`}
            </Text>
          </View>
        </View>

        {/* Summary */}
        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>AGREEMENT SUMMARY</Text>
          <Row k="Property" v={lease.property.name} />
          {lease.room && lease.bed ? <Row k="Room / Bed" v={`${lease.room.room_number} · ${lease.bed.bed_number}`} /> : null}
          <Row k="Start date" v={formatDate(lease.lease_start_date)} />
          <Row k="End date" v={formatDate(lease.lease_end_date)} />
          <Row k="Lock-in period" v={`${lease.booking.lock_in_period_months} months`} />
          <Row k="Notice period" v={`${lease.notice_period_days} days`} last />
        </Card>

        {/* Document */}
        <Card>
          {downloadUrl ? (
            <PressableScale onPress={() => openUrl(downloadUrl)} scaleTo={0.99} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 48, height: 60, borderRadius: radius.sm, backgroundColor: palette.dangerTint, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="document-text" size={26} color={palette.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMd" weight="600">PGfy_Lease_{lease.id}.pdf</Text>
                <Text variant="caption" color={palette.inkTertiary}>Tap to view the agreement</Text>
              </View>
              <Ionicons name="eye-outline" size={22} color={palette.navy} />
            </PressableScale>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 48, height: 60, borderRadius: radius.sm, backgroundColor: palette.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="document-outline" size={26} color={palette.inkTertiary} />
              </View>
              <Text variant="bodySm" color={palette.inkTertiary} style={{ flex: 1 }}>The document isn't available yet.</Text>
            </View>
          )}
        </Card>

        {expiringSoon ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, backgroundColor: palette.warningTint, padding: spacing.md, borderRadius: radius.md }}>
            <Ionicons name="alert-circle" size={18} color={palette.warning} />
            <Text variant="caption" color="#B26A00" style={{ flex: 1 }}>Your agreement expires in {daysUntil(lease.lease_end_date)} days.</Text>
          </View>
        ) : null}
      </ScrollView>

      {downloadUrl || signingUrl ? (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
          {downloadUrl ? (
            <Button label="Download" variant="outline" icon="download-outline" style={{ flex: 1 }} full onPress={() => openUrl(downloadUrl)} />
          ) : null}
          {signingUrl ? (
            <Button
              label="Review & Sign"
              icon="create-outline"
              style={{ flex: 1.4 }}
              full
              onPress={() => { haptic.select(); openUrl(signingUrl); }}
            />
          ) : null}
        </View>
      ) : null}
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
