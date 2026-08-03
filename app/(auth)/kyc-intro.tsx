/** SnapKYC intro — verify identity before booking (owner-app identity-verification pattern). */
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Button, Card, IconButton } from '@/components/ui';

const STEPS = [
  'Tap "Start verification" below.',
  'Authenticate securely through the official Aadhaar app.',
  'SnapKYC validates your identity so you can confirm bookings.',
];

export default function KycIntro() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const startVerification = () => {
    Alert.alert(
      'Aadhaar verification',
      'For security, identity verification is completed via the official Aadhaar app and validated by SnapKYC.',
      [{ text: 'Continue', onPress: () => router.push('/(auth)/kyc') }],
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing.xl }}>
      <IconButton icon="close" onPress={() => router.back()} style={{ borderRadius: 21, marginBottom: spacing.lg }} />

      <View style={{ marginBottom: spacing.xl, gap: spacing.md }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.lg,
            backgroundColor: palette.coralTint,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          <Ionicons name="shield-checkmark-outline" size={26} color={palette.coral} />
        </View>
        <Text variant="h1">Complete your KYC</Text>
        <Text variant="bodyMd" color={palette.inkSecondary} style={{ lineHeight: 22 }}>
          Your identity verification is handled by our trusted partner SnapKYC — quick, secure, and fully digital.
        </Text>
      </View>

      <Card style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Ionicons name="checkmark-circle" size={16} color={palette.success} />
          <Text variant="bodySm" weight="700">
            Verification partner: SnapKYC
          </Text>
        </View>

        <Text variant="bodyMd" weight="700" style={{ marginTop: spacing.sm }}>
          Steps to complete
        </Text>
        {STEPS.map((step, index) => (
          <View key={step} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: palette.coral,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 1,
              }}
            >
              <Text variant="caption" color={palette.white} weight="700">
                {index + 1}
              </Text>
            </View>
            <Text variant="bodySm" color={palette.inkSecondary} style={{ flex: 1, lineHeight: 21 }}>
              {step}
            </Text>
          </View>
        ))}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
          <Ionicons name="phone-portrait-outline" size={14} color={palette.inkSecondary} />
          <Text variant="caption" color={palette.inkTertiary} style={{ flex: 1 }}>
            No Aadhaar details are stored directly in the PGfy app.
          </Text>
        </View>

        <Button label="Start verification" icon="arrow-forward" full size="lg" onPress={startVerification} style={{ marginTop: spacing.md }} />
      </Card>
    </View>
  );
}
