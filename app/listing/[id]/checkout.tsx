/** T-S16 — Checkout & payment (plan + method selection). */
import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Divider } from '@/components/ui';
import { inr } from '@/lib/format';
import { haptic } from '@/lib/haptics';

const METHODS = [
  { key: 'upi', label: 'UPI', sub: 'GPay, PhonePe, Paytm', icon: 'phone-portrait-outline' },
  { key: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: 'card-outline' },
  { key: 'netbanking', label: 'Net Banking', sub: 'All major banks', icon: 'business-outline' },
  { key: 'cash', label: 'Offline Cash', sub: 'Pay at property via OTP', icon: 'cash-outline' },
];

export default function Checkout() {
  const { id, amount } = useLocalSearchParams<{ id: string; amount: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const total = Number(amount ?? 39500);
  const [method, setMethod] = useState('upi');
  const [loading, setLoading] = useState(false);

  const payable = total;

  const pay = () => {
    setLoading(true); haptic.success();
    setTimeout(() => { setLoading(false); router.replace({ pathname: `/listing/${id}/success`, params: { amount: String(payable), method } }); }, 1100);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Checkout" subtitle="Secure payment" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: 130, gap: spacing.base }} showsVerticalScrollIndicator={false}>
        {/* Methods */}
        <View>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>PAYMENT METHOD</Text>
          <Card padded={false} style={{ paddingHorizontal: spacing.base }}>
            {METHODS.map((m, i) => (
              <View key={m.key}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
                  <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: palette.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={m.icon as any} size={20} color={palette.navy} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMd" weight="600">{m.label}</Text>
                    <Text variant="caption" color={palette.inkTertiary}>{m.sub}</Text>
                  </View>
                  <Ionicons name={method === m.key ? 'radio-button-on' : 'radio-button-off'} size={22} color={method === m.key ? palette.coral : palette.borderStrong} onPress={() => setMethod(m.key)} />
                </View>
                {i < METHODS.length - 1 ? <Divider /> : null}
              </View>
            ))}
          </Card>
        </View>

        {method === 'cash' ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, backgroundColor: palette.infoTint, padding: spacing.md, borderRadius: radius.md }}>
            <Ionicons name="information-circle" size={18} color={palette.info} />
            <Text variant="caption" color={palette.info} style={{ flex: 1 }}>A 6-digit OTP will be generated. Share it with the manager/warden when you pay cash.</Text>
          </View>
        ) : null}

        {/* Security */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
          <Badge2 icon="lock-closed" label="256-bit SSL" />
          <Badge2 icon="shield-checkmark" label="PCI-DSS" />
          <Badge2 icon="refresh" label="Auto-retry" />
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
        <View>
          <Text variant="caption" color={palette.inkTertiary}>Paying now</Text>
          <Text variant="h3" mono color={palette.navy}>{inr(payable)}</Text>
        </View>
        <Button label={`Pay ${inr(payable)}`} loadingLabel="Processing payment…" icon="lock-closed" loading={loading} onPress={pay} full size="lg" style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function Badge2({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={13} color={palette.inkTertiary} />
      <Text variant="caption" color={palette.inkTertiary}>{label}</Text>
    </View>
  );
}
