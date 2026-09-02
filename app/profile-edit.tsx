/** Edit profile — name, avatar, guardian & emergency details (modal). */
import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing } from '@/theme';
import { Text, Input, Button, Avatar, IconButton, Divider } from '@/components/ui';
import { alert } from '@/lib/alertDialog';
import { haptic } from '@/lib/haptics';
import { useAuth } from '@/context/AuthContext';
import { authApi, errorMessage, uploadApi, type ProfileAsset } from '@/lib/api';

export default function ProfileEdit() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuth();
  const personal = user?.personal_details ?? null;

  const [name, setName] = useState(user?.name ?? '');
  const [avatar, setAvatar] = useState<ProfileAsset | null>(user?.avatar ?? null);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [gName, setGName] = useState(personal?.guardian_name ?? '');
  const [gPhone, setGPhone] = useState(personal?.guardian_phone ?? '');
  const [gRel, setGRel] = useState(personal?.guardian_relation ?? '');
  const [emergency, setEmergency] = useState(personal?.emergency_phone ?? '');
  const [emergencyRel, setEmergencyRel] = useState(personal?.emergency_relation ?? '');
  const [loading, setLoading] = useState(false);

  const changePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Permission required', 'Allow gallery access to change your photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const localUri = result.assets[0].uri;
    setLocalAvatarUri(localUri);
    setUploadingAvatar(true);
    try {
      const uploaded = await uploadApi.uploadAvatar(localUri);
      setAvatar({ link: uploaded.link, type: uploaded.type, metadata: uploaded.metadata, thumbnail: uploaded.thumbnail });
      haptic.success();
    } catch (e) {
      haptic.error();
      alert("Couldn't upload photo", errorMessage(e));
    } finally {
      setLocalAvatarUri(null);
      setUploadingAvatar(false);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      alert('Name required', 'Please enter your name.');
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        name: name.trim(),
        ...(avatar && avatar.link !== user?.avatar?.link ? { avatar } : {}),
        personal_details: {
          ...personal,
          guardian_name: gName.trim() || null,
          guardian_phone: gPhone.trim() || null,
          guardian_relation: gRel.trim() || null,
          emergency_phone: emergency.trim() || null,
          emergency_relation: emergencyRel.trim() || null,
        },
      });
      haptic.success();
      router.back();
    } catch (e) {
      haptic.error();
      alert("Couldn't save profile", errorMessage(e));
    } finally {
      setLoading(false);
    }
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
            <Avatar name={name || user?.name || ''} uri={localAvatarUri ?? avatar?.thumbnail ?? avatar?.link ?? undefined} size={92} ring />
            {uploadingAvatar ? (
              <View
                style={{
                  position: 'absolute', top: 0, left: 0, width: 92, height: 92, borderRadius: 46,
                  alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)',
                }}
              >
                <Ionicons name="cloud-upload-outline" size={24} color={palette.white} />
              </View>
            ) : null}
            <View style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: palette.coral, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: palette.surface }}>
              <Ionicons name="camera" size={15} color={palette.white} />
            </View>
          </View>
          <Text
            variant="caption"
            weight="600"
            color={palette.coralDark}
            style={{ marginTop: spacing.sm }}
            onPress={uploadingAvatar ? undefined : changePhoto}
          >
            Change photo
          </Text>
        </View>

        <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>PERSONAL</Text>
        <View style={{ gap: spacing.base }}>
          <Input label="Full name" icon="person-outline" value={name} onChangeText={setName} />
          <ContactChangeField kind="email" current={user?.email ?? ''} />
          <ContactChangeField kind="phone" current={user?.phone ?? ''} />
        </View>

        <Divider style={{ marginVertical: spacing.lg }} />

        <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>GUARDIAN & EMERGENCY</Text>
        <View style={{ gap: spacing.base }}>
          <Input label="Guardian name" icon="people-outline" value={gName} onChangeText={setGName} />
          <Input label="Guardian mobile" icon="call-outline" value={gPhone} onChangeText={setGPhone} keyboardType="phone-pad" />
          <Input label="Guardian relationship" value={gRel} onChangeText={setGRel} />
          <Input label="Emergency contact" icon="medkit-outline" value={emergency} onChangeText={setEmergency} keyboardType="phone-pad" />
          <Input label="Emergency contact relationship" value={emergencyRel} onChangeText={setEmergencyRel} />
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
        <Button label="Save changes" loadingLabel="Saving…" icon="checkmark" loading={loading} onPress={save} full size="lg" />
      </View>
    </KeyboardAvoidingView>
  );
}

/**
 * Phone/email are OTP-gated: entering a new value only sends an OTP, and the value doesn't
 * take effect on the profile until that OTP is verified (which also mints a fresh access
 * token — `applyContactUpdate` adopts it and patches the field into the cached profile).
 */
function ContactChangeField({ kind, current }: { kind: 'phone' | 'email'; current: string }) {
  const { applyContactUpdate } = useAuth();
  const isPhone = kind === 'phone';

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const startEdit = () => {
    setValue('');
    setOtpSent(false);
    setOtp('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setOtpSent(false);
    setOtp('');
  };

  const valid = isPhone ? /^\d{10}$/.test(value.trim()) : /\S+@\S+\.\S+/.test(value.trim());

  const sendOtp = async () => {
    if (!valid) return;
    const trimmed = value.trim();
    setSending(true);
    try {
      if (isPhone) await authApi.sendPhoneVerificationOtp({ phone: trimmed });
      else await authApi.sendEmailVerificationOtp({ email: trimmed });
      haptic.success();
      setOtpSent(true);
      alert('OTP sent', `We've sent a verification code to ${trimmed}.`);
    } catch (e) {
      haptic.error();
      alert("Couldn't send OTP", errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.trim().length < 4) return;
    const trimmed = value.trim();
    setVerifying(true);
    try {
      const res = isPhone
        ? await authApi.verifyPhoneVerificationOtp({ phone: trimmed, otp: otp.trim() })
        : await authApi.verifyEmailVerificationOtp({ email: trimmed, otp: otp.trim() });
      await applyContactUpdate(res.token, isPhone ? { phone: trimmed } : { email: trimmed });
      haptic.success();
      alert(isPhone ? 'Mobile number updated' : 'Email updated', res.message);
      cancelEdit();
    } catch (e) {
      haptic.error();
      alert("Couldn't verify OTP", errorMessage(e));
    } finally {
      setVerifying(false);
    }
  };

  const label = isPhone ? 'Mobile number' : 'Email';
  const icon = isPhone ? 'call-outline' : 'mail-outline';

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
        <Input
          containerStyle={{ flex: 1 }}
          label={label}
          icon={icon}
          value={editing ? value : current}
          onChangeText={editing ? setValue : undefined}
          editable={editing}
          placeholder={isPhone ? '10-digit mobile number' : 'you@example.com'}
          keyboardType={isPhone ? 'phone-pad' : 'email-address'}
          autoCapitalize="none"
          hint={editing ? undefined : `Changing your ${label.toLowerCase()} requires OTP verification.`}
        />
        {!editing ? (
          <Button label="Change" variant="outline" size="sm" onPress={startEdit} style={{ marginTop: 22 }} />
        ) : null}
      </View>

      {editing ? (
        <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
          {!otpSent ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button label="Send OTP" loading={sending} disabled={!valid} onPress={sendOtp} />
              <Button label="Cancel" variant="ghost" onPress={cancelEdit} />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
              <Input
                containerStyle={{ flex: 1 }}
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/[^\d]/g, '').slice(0, 6))}
                placeholder="Enter OTP"
                keyboardType="number-pad"
                icon="keypad-outline"
              />
              <Button label="Verify" loading={verifying} disabled={otp.trim().length < 4} onPress={verifyOtp} />
              <Button label="Cancel" variant="ghost" onPress={cancelEdit} />
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}
