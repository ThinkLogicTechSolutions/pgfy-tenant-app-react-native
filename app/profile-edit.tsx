/** Edit profile — personal, guardian & emergency details (modal). */
import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Input, Button, Avatar, IconButton, Divider } from '@/components/ui';
import { USER } from '@/data';
import { haptic } from '@/lib/haptics';

export default function ProfileEdit() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(USER.name);
  const [email, setEmail] = useState(USER.email);
  const [gName, setGName] = useState(USER.guardianName);
  const [gPhone, setGPhone] = useState(USER.guardianPhone);
  const [gRel, setGRel] = useState(USER.guardianRelation);
  const [emergency, setEmergency] = useState(USER.emergencyContact);
  const [loading, setLoading] = useState(false);

  const save = () => {
    setLoading(true);
    haptic.success();
    setTimeout(() => { setLoading(false); router.back(); }, 600);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.base, paddingBottom: spacing.sm }}>
        <IconButton icon="close" onPress={() => router.back()} style={{ borderRadius: 21 }} />
        <Text variant="h3" style={{ flex: 1 }}>Edit profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + 100 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={{ alignItems: 'center', marginVertical: spacing.lg }}>
          <View>
            <Avatar name={name} uri={USER.avatar} size={92} ring />
            <View style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: palette.coral, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: palette.surface }}>
              <Ionicons name="camera" size={15} color={palette.white} />
            </View>
          </View>
          <Text variant="caption" color={palette.coralDark} weight="600" style={{ marginTop: spacing.sm }}>Change photo</Text>
        </View>

        <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>PERSONAL</Text>
        <View style={{ gap: spacing.base }}>
          <Input label="Full name" icon="person-outline" value={name} onChangeText={setName} />
          <Input label="Email" icon="mail-outline" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Mobile number" icon="call-outline" value={USER.phone} editable={false} hint="Changing your number requires OTP verification." />
        </View>

        <Divider style={{ marginVertical: spacing.lg }} />

        <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>GUARDIAN & EMERGENCY</Text>
        <View style={{ gap: spacing.base }}>
          <Input label="Guardian name" icon="people-outline" value={gName} onChangeText={setGName} />
          <Input label="Guardian mobile" icon="call-outline" value={gPhone} onChangeText={setGPhone} keyboardType="number-pad" />
          <Input label="Relationship" value={gRel} onChangeText={setGRel} />
          <Input label="Emergency contact" icon="medkit-outline" value={emergency} onChangeText={setEmergency} keyboardType="number-pad" />
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
        <Button label="Save changes" loadingLabel="Saving…" icon="checkmark" loading={loading} onPress={save} full size="lg" />
      </View>
    </KeyboardAvoidingView>
  );
}
