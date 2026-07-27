/** T-S18 — Booking QR / digital pass. Shows a pre-arrival "check-in pass" until the tenant
 *  actually checks in, then switches to an ongoing "PG pass" — both real, fetched from
 *  `GET /tenant/booking/:id`. The QR encodes `PGFY|<booking code>|<6-digit OTP>`. */
import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Platform, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { palette, spacing, radius } from '@/theme';
import { Text, IconButton, Button, Divider, EmptyState } from '@/components/ui';
import { bookingApi, errorMessage, type ApiBookingDetail } from '@/lib/api';
import { bookingStatusLabel, buildCheckInPassPayload, isCheckedIn } from '@/lib/bookingDisplay';
import { formatDate } from '@/lib/format';
import { alert } from '@/lib/alertDialog';

export default function Pass() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bookingId = Number(id);

  const [booking, setBooking] = useState<ApiBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const ticketRef = useRef<View>(null);

  const load = () => {
    if (!Number.isFinite(bookingId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    bookingApi.getBooking(bookingId)
      .then(setBooking)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [bookingId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.white} />
      </View>
    );
  }

  if (!Number.isFinite(bookingId) || !booking) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingBottom: spacing.sm }}>
          <IconButton icon="close" onPress={() => router.back()} style={{ borderRadius: 21 }} />
        </View>
        <EmptyState
          title={error ? "Couldn't load pass" : 'Booking not found'}
          message={error ?? 'This booking pass could not be loaded.'}
          actionLabel={error ? 'Retry' : undefined}
          onAction={error ? load : undefined}
        />
      </View>
    );
  }

  const b = booking;
  const checkedIn = isCheckedIn(b);
  const qrPayload = b.check_in_otp ? buildCheckInPassPayload(b.code, b.check_in_otp) : null;

  const shareCaption = `My ${checkedIn ? 'PG pass' : 'check-in pass'} for ${b.property.name} (${b.property.locality}) — booking ${b.code}. PGfy.`;

  const onShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(ticketRef, { format: 'png', quality: 0.95 });
      if (Platform.OS === 'ios') {
        // iOS's native sheet can combine an image with a text message in one share.
        await Share.share({ url: uri, message: shareCaption });
      } else if (await Sharing.isAvailableAsync()) {
        // Android's Share module can't attach a local image file directly — expo-sharing
        // hands it to the OS chooser via a proper content URI instead.
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: shareCaption });
      } else {
        await Share.share({ message: shareCaption });
      }
    } catch (e) {
      alert('Could not share pass', errorMessage(e));
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.navy }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.base }}>
        <IconButton icon="close" color={palette.white} bg="rgba(255,255,255,0.14)" style={{ borderColor: 'transparent' }} onPress={() => router.back()} />
        <Text variant="h3" color={palette.white}>{checkedIn ? 'PG pass' : 'Check-in pass'}</Text>
        <IconButton
          icon="share-social-outline"
          color={palette.white}
          bg="rgba(255,255,255,0.14)"
          style={{ borderColor: 'transparent' }}
          onPress={onShare}
        />
      </View>

      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl }}>
        {/* Ticket — captured as an image for sharing, so needs an explicit ref and (on
            Android) collapsable={false} or view-shot can't find a native view to snapshot. */}
        <View ref={ticketRef} collapsable={false} style={{ backgroundColor: palette.surface, borderRadius: radius.xl, overflow: 'hidden' }}>
          <LinearGradient colors={[palette.navy, palette.navyDark]} style={{ padding: spacing.lg, alignItems: 'center' }}>
            <Text variant="overline" color="rgba(255,255,255,0.7)">{checkedIn ? 'PGFY PG PASS' : 'PGFY CHECK-IN PASS'}</Text>
            <Text variant="h2" color={palette.white} style={{ marginTop: 4 }}>{b.property.name}</Text>
            <Text variant="bodySm" color="rgba(255,255,255,0.8)">{b.property.locality}</Text>
          </LinearGradient>

          {/* perforation */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: palette.navy, marginLeft: -12 }} />
            <View style={{ flex: 1, borderBottomWidth: 2, borderColor: palette.border, borderStyle: 'dashed' }} />
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: palette.navy, marginRight: -12 }} />
          </View>

          <View style={{ padding: spacing.lg, alignItems: 'center' }}>
            <View style={{ width: 180, height: 180, borderRadius: radius.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.border }}>
              {qrPayload ? (
                <QRCode value={qrPayload} size={156} color={palette.navy} backgroundColor={palette.white} />
              ) : (
                <View style={{ alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md }}>
                  <Ionicons name="time-outline" size={40} color={palette.inkTertiary} />
                  <Text variant="caption" color={palette.inkTertiary} align="center">Your pass code isn't ready yet</Text>
                </View>
              )}
            </View>
            <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: spacing.sm }}>
              {checkedIn ? 'Scan at the property for entry' : 'Scan at the property to check in'}
            </Text>

            <View style={{ flexDirection: 'row', width: '100%', marginTop: spacing.lg }}>
              <Detail label="Booking ref" value={b.code} />
              <Detail label="Room / Bed" value={`${b.room_number} · ${b.bed_number}`} />
            </View>
            <Divider style={{ marginVertical: spacing.md, width: '100%' }} />
            <View style={{ flexDirection: 'row', width: '100%' }}>
              <Detail label="Check-in date" value={formatDate(b.check_in_date)} />
              <Detail label="Status" value={bookingStatusLabel(b.status)} />
            </View>

            {b.check_in_otp ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.lg, backgroundColor: palette.surfaceRaised, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill }}>
                <Ionicons name="key-outline" size={14} color={palette.inkSecondary} />
                <Text variant="caption" color={palette.inkSecondary}>Fallback code: {b.check_in_otp}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Button label="Add to wallet" variant="ghost" icon="wallet-outline" onPress={() => {}} full style={{ marginTop: spacing.lg, backgroundColor: 'rgba(255,255,255,0.14)' }} />
      </View>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="caption" color={palette.inkTertiary}>{label}</Text>
      <Text variant="bodyMd" weight="700" style={{ marginTop: 2 }}>{value}</Text>
    </View>
  );
}
