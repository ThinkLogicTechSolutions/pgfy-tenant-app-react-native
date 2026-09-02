/** T-S4 — Mobile number entry. */
import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Input, Button, PressableScale, IconButton } from '@/components/ui';
import { PgfyMark } from '@/components/illustrations';
import { useAuth } from '@/context/AuthContext';
import { errorMessage } from '@/lib/api';

const TERMS_URL = 'https://pgfy.in/pages/terms-conditions.html';
const PRIVACY_URL = 'https://pgfy.in/pages/privacy-policy.html';

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { guestBlocked } = useLocalSearchParams<{ guestBlocked?: string }>();
  const skipDisabled = guestBlocked === '1';
  const { sendOtp, continueAsGuest } = useAuth();
  const [phone, setPhone] = useState('');
  const digits = phone.replace(/\D/g, '');
  const valid = digits.length === 10;
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open link', 'Please try again in a moment.');
    }
  };

  const getOtp = async () => {
    setLoading(true);
    try {
      await sendOtp(digits);
      router.push({ pathname: '/(auth)/verify-otp', params: { phone: digits } });
    } catch (e) {
      Alert.alert('Could not send OTP', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const skip = async () => {
    setGuestLoading(true);
    try {
      await continueAsGuest();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Could not continue as guest', errorMessage(e));
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + spacing.base, paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.xl }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton icon="chevron-back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/landing'))} style={{ borderRadius: 21 }} />
          {!skipDisabled ? (
            <PressableScale onPress={skip} disabled={guestLoading} haptics={false}>
              <Text variant="bodySm" weight="600" color={palette.coralDark}>{guestLoading ? 'Please wait…' : 'Skip'}</Text>
            </PressableScale>
          ) : null}
        </View>

        {skipDisabled ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.coralTint, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg }}>
            <Ionicons name="lock-closed" size={18} color={palette.coralDark} />
            <Text variant="bodySm" weight="600" color={palette.coralDark} style={{ flex: 1 }}>
              Please login to continue.
            </Text>
          </View>
        ) : null}

        <View style={{ alignItems: 'center', marginTop: spacing['2xl'], marginBottom: spacing['2xl'] }}>
          <PgfyMark size={72} variant="tile" />
          <Text variant="h1" style={{ marginTop: spacing.lg }}>Enter your mobile number</Text>
          <Text variant="bodyMd" color={palette.inkSecondary} align="center" style={{ marginTop: 4 }}>
            We'll send a 6-digit OTP to verify it's you.
          </Text>
        </View>

        <Input label="Mobile number" icon="call-outline" prefix="+91" keyboardType="number-pad" value={phone} onChangeText={setPhone} maxLength={11} placeholder="98765 43210" />
        <Button label="Get OTP" loadingLabel="Sending OTP…" onPress={getOtp} loading={loading} disabled={!valid} full size="lg" iconRight="arrow-forward" style={{ marginTop: spacing.xl }} />

        <View style={{ flex: 1 }} />
        <Text variant="caption" color={palette.inkTertiary} align="center" style={{ marginTop: spacing['2xl'] }}>
          By continuing you agree to our{' '}
          <Text variant="caption" color={palette.coralDark} onPress={() => openLink(TERMS_URL)}>Terms</Text> &{' '}
          <Text variant="caption" color={palette.coralDark} onPress={() => openLink(PRIVACY_URL)}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
