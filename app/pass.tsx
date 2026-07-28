/** T-S18 — Booking QR / digital pass. Shows a pre-arrival "check-in pass" until the tenant
 *  actually checks in, then switches to an ongoing "PG pass" — real, fetched either from
 *  `GET /tenant/booking/:id` (via `id` param) or `GET /tenant/my-stay?bed_id=` (via `bedId`
 *  param, used by the My Stay screen). When the my-stay response includes a pre-rendered
 *  `check_in_qr` image, that's shown instead of a client-generated QR; otherwise the QR
 *  encodes `PGFY|<booking code>|<6-digit OTP>`. */
import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Platform, Share } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { palette, spacing, radius } from '@/theme';
import { Text, IconButton, Button, Divider, EmptyState } from '@/components/ui';
import { bookingApi, stayApi, errorMessage, type BookingStatusApi, type ApiMyStayResponse } from '@/lib/api';
import { bookingStatusLabel, buildCheckInPassPayload } from '@/lib/bookingDisplay';
import { formatDate } from '@/lib/format';
import { alert } from '@/lib/alertDialog';

interface PassView {
  code: string;
  status: BookingStatusApi;
  checkedIn: boolean;
  checkInDate: string;
  propertyName: string;
  propertyLocality: string;
  roomNumber: string;
  bedNumber: string;
  checkInOtp: string | null;
  /** A real, pre-rendered QR image from the backend — preferred over a client-built QR. */
  checkInQrUri: string | null;
}

function passViewFromMyStay(data: ApiMyStayResponse): PassView {
  const b = data.booking;
  return {
    code: b.code,
    status: b.status,
    checkedIn: b.status === 'CHECKED_IN',
    checkInDate: b.check_in_date,
    propertyName: b.property.name,
    propertyLocality: b.property.locality,
    roomNumber: b.room.room_number,
    bedNumber: b.bed.bed_number,
    checkInOtp: b.check_in_otp,
    checkInQrUri: b.check_in_qr?.link ?? null,
  };
}

/** Parse the `stay` param the My Stay screen passes when it already has this bed's detail
 * loaded — malformed/absent JSON just falls back to fetching, so this never throws. */
function parsePreloadedStay(raw?: string): ApiMyStayResponse | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiMyStayResponse;
  } catch {
    return null;
  }
}

export default function Pass() {
  const { id, bedId, stay } = useLocalSearchParams<{ id?: string; bedId?: string; stay?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const numericBedId = Number(bedId);
  const bookingId = Number(id);
  const useBed = Number.isFinite(numericBedId);
  const preloaded = parsePreloadedStay(stay);

  const [pass, setPass] = useState<PassView | null>(preloaded ? passViewFromMyStay(preloaded) : null);
  const [loading, setLoading] = useState(!preloaded);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const ticketRef = useRef<View>(null);

  const load = () => {
    if (useBed) {
      setLoading(true);
      setError(null);
      stayApi.getMyStay(numericBedId)
        .then((data) => setPass(passViewFromMyStay(data)))
        .catch((e) => setError(errorMessage(e)))
        .finally(() => setLoading(false));
      return;
    }
    if (!Number.isFinite(bookingId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    bookingApi.getBooking(bookingId)
      .then((b) => {
        setPass({
          code: b.code,
          status: b.status,
          checkedIn: b.status === 'CHECKED_IN' || !!b.actual_check_in,
          checkInDate: b.check_in_date,
          propertyName: b.property.name,
          propertyLocality: b.property.locality,
          roomNumber: b.room_number,
          bedNumber: b.bed_number,
          checkInOtp: b.check_in_otp,
          checkInQrUri: b.check_in_qr,
        });
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  };

  // Data already handed in via `stay` (My Stay already fetched it) — skip the refetch entirely.
  useEffect(() => {
    if (preloaded) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, numericBedId, useBed]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.white} />
      </View>
    );
  }

  if ((!useBed && !Number.isFinite(bookingId)) || !pass) {
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

  const b = pass;
  const checkedIn = b.checkedIn;
  const qrPayload = b.checkInOtp ? buildCheckInPassPayload(b.code, b.checkInOtp) : null;

  const shareCaption = `My ${checkedIn ? 'PG pass' : 'check-in pass'} for ${b.propertyName} (${b.propertyLocality}) — booking ${b.code}. PGfy.`;

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
            <Text variant="h2" color={palette.white} style={{ marginTop: 4 }}>{b.propertyName}</Text>
            <Text variant="bodySm" color="rgba(255,255,255,0.8)">{b.propertyLocality}</Text>
          </LinearGradient>

          {/* perforation */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: palette.navy, marginLeft: -12 }} />
            <View style={{ flex: 1, borderBottomWidth: 2, borderColor: palette.border, borderStyle: 'dashed' }} />
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: palette.navy, marginRight: -12 }} />
          </View>

          <View style={{ padding: spacing.lg, alignItems: 'center' }}>
            <View style={{ width: 180, height: 180, borderRadius: radius.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.border, overflow: 'hidden' }}>
              {b.checkInQrUri ? (
                <Image source={{ uri: b.checkInQrUri }} style={{ width: 180, height: 180 }} contentFit="contain" />
              ) : qrPayload ? (
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
              <Detail label="Room / Bed" value={`${b.roomNumber} · ${b.bedNumber}`} />
            </View>
            <Divider style={{ marginVertical: spacing.md, width: '100%' }} />
            <View style={{ flexDirection: 'row', width: '100%' }}>
              <Detail label="Check-in date" value={formatDate(b.checkInDate)} />
              <Detail label="Status" value={bookingStatusLabel(b.status)} />
            </View>

            {b.checkInOtp ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.lg, backgroundColor: palette.surfaceRaised, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill }}>
                <Ionicons name="key-outline" size={14} color={palette.inkSecondary} />
                <Text variant="caption" color={palette.inkSecondary}>Fallback code: {b.checkInOtp}</Text>
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
