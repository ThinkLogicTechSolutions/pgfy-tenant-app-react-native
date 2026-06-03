/** T-S4 — Mobile number entry. */
import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { Text, Input, Button, PressableScale, IconButton } from '@/components/ui';
import { PgfyMark } from '@/components/illustrations';

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('98765 43210');
  const digits = phone.replace(/\D/g, '');
  const valid = digits.length === 10;
  const [loading, setLoading] = useState(false);

  const getOtp = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); router.push({ pathname: '/(auth)/verify-otp', params: { phone: digits } }); }, 600);
  };

  const skip = () => router.replace('/(tabs)');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + spacing.base, paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.xl }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton icon="chevron-back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/landing'))} style={{ borderRadius: 21 }} />
          <PressableScale onPress={skip} haptics={false}>
            <Text variant="bodySm" weight="600" color={palette.coralDark}>Skip</Text>
          </PressableScale>
        </View>

        <View style={{ alignItems: 'center', marginTop: spacing['2xl'], marginBottom: spacing['2xl'] }}>
          <PgfyMark size={72} variant="tile" />
          <Text variant="h1" style={{ marginTop: spacing.lg }}>Enter your mobile number</Text>
          <Text variant="bodyMd" color={palette.inkSecondary} align="center" style={{ marginTop: 4 }}>
            We'll send a 6-digit OTP to verify it's you.
          </Text>
        </View>

        <Input label="Mobile number" icon="call-outline" prefix="+91" keyboardType="number-pad" value={phone} onChangeText={setPhone} maxLength={11} placeholder="98765 43210" />
        <Button label="Get OTP" onPress={getOtp} loading={loading} disabled={!valid} full size="lg" iconRight="arrow-forward" style={{ marginTop: spacing.xl }} />

        <View style={{ flex: 1 }} />
        <Text variant="caption" color={palette.inkTertiary} align="center" style={{ marginTop: spacing['2xl'] }}>
          By continuing you agree to our{' '}
          <Text variant="caption" color={palette.coralDark}>Terms</Text> &{' '}
          <Text variant="caption" color={palette.coralDark}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
