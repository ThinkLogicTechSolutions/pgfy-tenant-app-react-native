/** T-S7 — Verify Aadhaar details after SnapKYC consent. */
import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Button, Input, Card, IconButton } from '@/components/ui';
import { KycShield } from '@/components/illustrations';
import { haptic } from '@/lib/haptics';
import { setKyc } from '@/store/kyc';

const PREFILLED_AADHAAR = {
  fullName: 'Aarav Sharma',
  aadhaarNo: 'XXXX XXXX 4281',
  dob: '14 Feb 2002',
  gender: 'Male',
  mobile: '+91 98765 43210',
  address: '12, 3rd Cross, HSR Layout, Bengaluru, Karnataka 560102',
} as const;

export default function Kyc() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const finish = () => {
    setLoading(true);
    haptic.success();
    // Aadhaar verification alone completes KYC. The next step (occupation) is optional.
    setKyc('Verified');
    setTimeout(() => { setLoading(false); router.replace('/(auth)/kyc-occupation'); }, 700);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, marginBottom: spacing.base }}>
        <IconButton icon="close" onPress={() => router.back()} style={{ borderRadius: 21 }} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text variant="h3">Verify details</Text>
          <Text variant="caption" color={palette.inkSecondary}>Review your Aadhaar details and submit</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: spacing.base }}>
          <Card style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
            <KycShield size={120} />
            <Text variant="h3" style={{ marginTop: spacing.sm }}>Aadhaar details found</Text>
            <Text variant="bodySm" color={palette.inkSecondary} align="center" style={{ marginTop: 4 }}>
              SnapKYC has prefilled your Aadhaar details. These fields are locked and ready for submission.
            </Text>
          </Card>

          <Input label="Full name" value={PREFILLED_AADHAAR.fullName} editable={false} icon="person-outline" />
          <Input label="Aadhaar number" value={PREFILLED_AADHAAR.aadhaarNo} editable={false} icon="card-outline" />
          <Input label="Date of birth" value={PREFILLED_AADHAAR.dob} editable={false} icon="calendar-outline" />
          <Input label="Gender" value={PREFILLED_AADHAAR.gender} editable={false} icon="male-female-outline" />
          <Input label="Registered mobile" value={PREFILLED_AADHAAR.mobile} editable={false} icon="call-outline" />
          <Input
            label="Aadhaar address"
            value={PREFILLED_AADHAAR.address}
            editable={false}
            icon="home-outline"
            multiline
            style={{ height: 78, textAlignVertical: 'top' }}
          />

          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', backgroundColor: palette.successTint, padding: spacing.md, borderRadius: radius.md }}>
            <Ionicons name="shield-checkmark" size={18} color={palette.success} />
            <Text variant="bodySm" color={palette.success} style={{ flex: 1 }}>
              Submit these verified Aadhaar details to complete your KYC.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.base, paddingTop: spacing.sm }}>
        <Button label="Submit" loadingLabel="Verifying…" loading={loading} onPress={finish} full size="lg" />
      </View>
    </View>
  );
}
