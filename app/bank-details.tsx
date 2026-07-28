/** Bank details for deposit refund — account section. */
import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { Text, IconButton } from '@/components/ui';
import { BankDetailsForm } from '@/components/profile/BankDetailsForm';
import { useAuth } from '@/context/AuthContext';
import { alert } from '@/lib/alertDialog';
import { errorMessage, type BankDetails } from '@/lib/api';
import { haptic } from '@/lib/haptics';

export default function BankDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const save = async (details: BankDetails) => {
    setLoading(true);
    try {
      await updateProfile({ bank_details: details });
      haptic.success();
      router.back();
    } catch (e) {
      haptic.error();
      alert("Couldn't save bank details", errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.base, paddingBottom: spacing.sm }}>
        <IconButton icon="close" onPress={() => router.back()} style={{ borderRadius: 21 }} />
        <Text variant="h3" style={{ flex: 1 }}>Bank details</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing['3xl'] }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text variant="bodySm" color={palette.inkSecondary} style={{ marginBottom: spacing.lg, lineHeight: 22 }}>
          Add the bank account where your security deposit refund should be credited after move-out.
        </Text>
        <BankDetailsForm initial={user?.bank_details ?? {}} onSubmit={save} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
