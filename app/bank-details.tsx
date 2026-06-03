/** Bank details for deposit refund — account section. */
import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { Text, IconButton } from '@/components/ui';
import { BankDetailsForm } from '@/components/profile/BankDetailsForm';
import { useBank } from '@/store/bank';
import { haptic } from '@/lib/haptics';

export default function BankDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bank = useBank();
  const [loading, setLoading] = useState(false);

  const save = (details: Parameters<typeof bank.set>[0]) => {
    setLoading(true);
    bank.set(details);
    haptic.success();
    setTimeout(() => {
      setLoading(false);
      router.back();
    }, 400);
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
        <BankDetailsForm initial={bank.details} onSubmit={save} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
