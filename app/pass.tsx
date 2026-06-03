/** T-S18 — Booking QR / digital pass & check-in (modal). */
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, spacing, radius } from '@/theme';
import { Text, IconButton, Button, Divider } from '@/components/ui';
import { ACTIVE_BOOKING } from '@/data';
import { formatDate } from '@/lib/format';

export default function Pass() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const b = ACTIVE_BOOKING;

  return (
    <View style={{ flex: 1, backgroundColor: palette.navy }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.base }}>
        <IconButton icon="close" color={palette.white} bg="rgba(255,255,255,0.14)" style={{ borderColor: 'transparent' }} onPress={() => router.back()} />
        <Text variant="h3" color={palette.white}>Booking pass</Text>
        <IconButton icon="share-social-outline" color={palette.white} bg="rgba(255,255,255,0.14)" style={{ borderColor: 'transparent' }} />
      </View>

      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl }}>
        {/* Ticket */}
        <View style={{ backgroundColor: palette.surface, borderRadius: radius.xl, overflow: 'hidden' }}>
          <LinearGradient colors={[palette.navy, palette.navyDark]} style={{ padding: spacing.lg, alignItems: 'center' }}>
            <Text variant="overline" color="rgba(255,255,255,0.7)">PGfy CHECK-IN PASS</Text>
            <Text variant="h2" color={palette.white} style={{ marginTop: 4 }}>{b.propertyName}</Text>
            <Text variant="bodySm" color="rgba(255,255,255,0.8)">{b.locality}</Text>
          </LinearGradient>

          {/* perforation */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: palette.navy, marginLeft: -12 }} />
            <View style={{ flex: 1, borderBottomWidth: 2, borderColor: palette.border, borderStyle: 'dashed' }} />
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: palette.navy, marginRight: -12 }} />
          </View>

          <View style={{ padding: spacing.lg, alignItems: 'center' }}>
            <View style={{ width: 180, height: 180, borderRadius: radius.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.border }}>
              <Ionicons name="qr-code" size={150} color={palette.navy} />
            </View>
            <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: spacing.sm }}>Scan at the property to check in</Text>

            <View style={{ flexDirection: 'row', width: '100%', marginTop: spacing.lg }}>
              <Detail label="Booking ref" value={b.ref} />
              <Detail label="Room / Bed" value={`${b.roomNumber} · ${b.bedLabel}`} />
            </View>
            <Divider style={{ marginVertical: spacing.md, width: '100%' }} />
            <View style={{ flexDirection: 'row', width: '100%' }}>
              <Detail label="Check-in date" value={formatDate(b.checkInDate)} />
              <Detail label="Status" value={b.status} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.lg, backgroundColor: palette.surfaceRaised, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill }}>
              <Ionicons name="key-outline" size={14} color={palette.inkSecondary} />
              <Text variant="caption" color={palette.inkSecondary}>Fallback code: {b.qrToken}</Text>
            </View>
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
