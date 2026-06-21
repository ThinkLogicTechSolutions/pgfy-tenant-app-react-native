/** T-S6 — Basic registration (minimal first-login profile). */
import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { Text, Input, Button } from '@/components/ui';
import { session } from '@/lib/session';
import { haptic } from '@/lib/haptics';

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('Aarav Sharma');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true); haptic.success();
    await session.login();
    setTimeout(() => router.replace('/(tabs)'), 500);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + spacing['3xl'], paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.xl }} keyboardShouldPersistTaps="handled">
        <Text variant="h1">Welcome! Tell us your name</Text>
        <Text variant="bodyMd" color={palette.inkSecondary} style={{ marginTop: 6, marginBottom: spacing.xl }}>
          You can complete your full profile & KYC later, before booking.
        </Text>
        <View style={{ gap: spacing.base }}>
          <Input label="Full name" icon="person-outline" value={name} onChangeText={setName} maxLength={60} placeholder="Your name" />
          <Input label="Email (optional)" icon="mail-outline" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
        </View>
        <Button label="Save & Continue" loadingLabel="Saving…" onPress={save} loading={loading} disabled={!name.trim()} full size="lg" style={{ marginTop: spacing.xl }} />
        <View style={{ flex: 1 }} />
        <Text variant="caption" color={palette.inkTertiary} align="center" style={{ marginTop: spacing.xl }}>
          A SnapKYC-verified profile is required before you can confirm a booking.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
