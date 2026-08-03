/** T-S6 — Basic registration (minimal first-login profile). */
import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { Text, Input, Button } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { useAuth } from '@/context/AuthContext';
import { errorMessage } from '@/lib/api';

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await updateProfile({ name: name.trim() });
      haptic.success();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Could not save your profile', errorMessage(e));
    } finally {
      setLoading(false);
    }
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
