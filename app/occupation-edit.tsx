/** Edit occupation details — student / working professional verification (modal). */
import { useState } from 'react';
import { View, ScrollView, Linking } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Button, Input, Card, IconButton, SegmentedControl, PressableScale } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { alert } from '@/lib/alertDialog';
import { haptic } from '@/lib/haptics';
import { authApi, errorMessage, uploadApi, type Occupation, type ProfileAsset } from '@/lib/api';

const SEGMENTS = [
  { key: 'STUDENT', label: 'Student' },
  { key: 'WORKING_PROFESSIONAL', label: 'Working Professional' },
];

const TERMS_URL = 'https://pgfy.in/pages/terms-conditions.html';
const PRIVACY_URL = 'https://pgfy.in/pages/privacy-policy.html';

export default function OccupationEdit() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateProfile, refresh } = useAuth();
  const occ = user?.occupation_details ?? null;

  const [occupation, setOccupation] = useState<Occupation>(occ?.occupation ?? 'STUDENT');
  const [collegeIdCard, setCollegeIdCard] = useState<ProfileAsset | null>(occ?.college_id_card ?? null);
  const [admissionLetter, setAdmissionLetter] = useState<ProfileAsset | null>(occ?.admission_letter ?? null);
  const [enrollmentNo, setEnrollmentNo] = useState(occ?.enrollment_no ?? '');
  const [employeeIdCard, setEmployeeIdCard] = useState<ProfileAsset | null>(occ?.employee_id_card ?? null);
  const [employmentLetter, setEmploymentLetter] = useState<ProfileAsset | null>(occ?.employment_letter ?? null);
  const [companyEmail, setCompanyEmail] = useState(occ?.company_email ?? '');
  const [companyEmailVerified, setCompanyEmailVerified] = useState(occ?.company_email_verified ?? false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onChangeCompanyEmail = (t: string) => {
    setCompanyEmail(t);
    setCompanyEmailVerified(t.trim().toLowerCase() === (occ?.company_email ?? '').trim().toLowerCase() && !!occ?.company_email_verified);
    setOtpSent(false);
    setOtp('');
  };

  const pickDocument = async (key: string, onPicked: (asset: ProfileAsset) => void) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const picked = result.assets[0];

    setUploadingKey(key);
    try {
      const uploaded = await uploadApi.uploadProfileDocument(picked.uri, picked.name, picked.mimeType);
      onPicked({ link: uploaded.link, type: uploaded.type, metadata: uploaded.metadata, thumbnail: uploaded.thumbnail });
      haptic.success();
    } catch (e) {
      haptic.error();
      alert("Couldn't upload document", errorMessage(e));
    } finally {
      setUploadingKey(null);
    }
  };

  const sendOtp = async () => {
    if (!companyEmail.includes('@')) return;
    setSendingOtp(true);
    try {
      await authApi.sendCompanyEmailOtp({ email: companyEmail.trim() });
      haptic.success();
      setOtpSent(true);
      alert('OTP sent', `We've sent a verification code to ${companyEmail.trim()}.`);
    } catch (e) {
      haptic.error();
      alert("Couldn't send OTP", errorMessage(e));
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.trim().length < 4) return;
    setVerifyingOtp(true);
    try {
      await authApi.verifyCompanyEmailOtp({ email: companyEmail.trim(), otp: otp.trim() });
      haptic.success();
      setCompanyEmailVerified(true);
      setOtpSent(false);
      setOtp('');
      await refresh().catch(() => {});
    } catch (e) {
      haptic.error();
      alert("Couldn't verify OTP", errorMessage(e));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const save = async () => {
    if (occupation === 'WORKING_PROFESSIONAL' && companyEmail.trim() && !companyEmailVerified) {
      alert('Verify your company email', 'Please verify your company email before saving, or clear it to skip.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        occupation_details:
          occupation === 'STUDENT'
            ? {
                occupation: 'STUDENT',
                college_id_card: collegeIdCard,
                admission_letter: admissionLetter,
                enrollment_no: enrollmentNo.trim() || null,
              }
            : {
                occupation: 'WORKING_PROFESSIONAL',
                employee_id_card: employeeIdCard,
                employment_letter: employmentLetter,
                company_email: companyEmail.trim() || null,
                company_email_verified: companyEmailVerified,
              },
      });
      haptic.success();
      router.back();
    } catch (e) {
      haptic.error();
      alert("Couldn't save occupation details", errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, marginBottom: spacing.base }}>
        <IconButton icon="close" onPress={() => router.back()} style={{ borderRadius: 21 }} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text variant="h3">Occupation details</Text>
          <Text variant="caption" color={palette.inkSecondary}>Helps us verify your stay eligibility</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: spacing.base }}>
          <View>
            <Text variant="bodyMd" weight="700" style={{ marginBottom: spacing.sm }}>I am a</Text>
            <SegmentedControl
              segments={SEGMENTS}
              value={occupation}
              onChange={(key) => { setOccupation(key as Occupation); haptic.select(); }}
            />
          </View>

          {occupation === 'STUDENT' ? (
            <Card style={{ gap: spacing.md }}>
              <Text variant="bodyMd" weight="700">Student verification</Text>
              <UploadRow
                label="College / University ID card"
                asset={collegeIdCard}
                uploading={uploadingKey === 'college_id_card'}
                onPress={() => pickDocument('college_id_card', setCollegeIdCard)}
              />
              <UploadRow
                label="Admission letter (new students)"
                asset={admissionLetter}
                uploading={uploadingKey === 'admission_letter'}
                onPress={() => pickDocument('admission_letter', setAdmissionLetter)}
              />
              <Input label="Enrollment / registration number" value={enrollmentNo} onChangeText={setEnrollmentNo} placeholder="e.g. 21BCE1234" icon="id-card-outline" autoCapitalize="characters" />
            </Card>
          ) : (
            <Card style={{ gap: spacing.md }}>
              <Text variant="bodyMd" weight="700">Working professional verification</Text>
              <UploadRow
                label="Employee ID card"
                asset={employeeIdCard}
                uploading={uploadingKey === 'employee_id_card'}
                onPress={() => pickDocument('employee_id_card', setEmployeeIdCard)}
              />
              <UploadRow
                label="Offer / employment letter"
                asset={employmentLetter}
                uploading={uploadingKey === 'employment_letter'}
                onPress={() => pickDocument('employment_letter', setEmploymentLetter)}
              />
              <View>
                <Text variant="caption" color={palette.inkSecondary} style={{ marginBottom: 6 }}>Company email</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                  <Input
                    containerStyle={{ flex: 1 }}
                    value={companyEmail}
                    onChangeText={onChangeCompanyEmail}
                    placeholder="you@company.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    icon="mail-outline"
                  />
                  <Button
                    label={companyEmailVerified ? 'Verified' : otpSent ? 'Resend' : 'Send OTP'}
                    variant={companyEmailVerified ? 'subtle' : 'outline'}
                    icon={companyEmailVerified ? 'checkmark' : undefined}
                    loading={sendingOtp}
                    disabled={!companyEmail.includes('@') || companyEmailVerified}
                    onPress={sendOtp}
                  />
                </View>
                {otpSent && !companyEmailVerified ? (
                  <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginTop: spacing.sm }}>
                    <Input
                      containerStyle={{ flex: 1 }}
                      value={otp}
                      onChangeText={(t) => setOtp(t.replace(/[^\d]/g, '').slice(0, 6))}
                      placeholder="Enter OTP"
                      keyboardType="number-pad"
                      icon="keypad-outline"
                    />
                    <Button label="Verify" loading={verifyingOtp} disabled={otp.trim().length < 4} onPress={verifyOtp} />
                  </View>
                ) : null}
                {companyEmailVerified ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm }}>
                    <Ionicons name="checkmark-circle" size={15} color={palette.success} />
                    <Text variant="caption" color={palette.success}>Company email verified</Text>
                  </View>
                ) : null}
              </View>
            </Card>
          )}

          <View style={{ marginTop: spacing.sm, gap: spacing.xs, paddingHorizontal: spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="shield-checkmark-outline" size={15} color={palette.inkTertiary} />
              <Text variant="caption" weight="700" color={palette.inkSecondary}>
                Why we collect this & how we store it
              </Text>
            </View>
            <Text variant="caption" color={palette.inkTertiary}>
              We collect these documents only for legal and verification purposes. They're stored
              securely, encrypted, and are never shared without your consent. Learn more in our{' '}
              <Text
                variant="caption"
                weight="600"
                color={palette.coralDark}
                onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.base, paddingTop: spacing.sm }}>
        <Button label="Save changes" loadingLabel="Saving…" icon="checkmark" loading={saving} onPress={save} full size="lg" />
      </View>
    </View>
  );
}

function UploadRow({
  label,
  asset,
  uploading,
  onPress,
}: {
  label: string;
  asset: ProfileAsset | null;
  uploading: boolean;
  onPress: () => void;
}) {
  const uploaded = !!asset;
  return (
    <PressableScale
      onPress={uploading ? undefined : onPress}
      scaleTo={uploaded ? 1 : 0.99}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        borderWidth: 1.5, borderColor: uploaded ? palette.success : palette.border,
        borderRadius: radius.md, padding: spacing.md,
        backgroundColor: uploaded ? palette.successTint : palette.surface,
      }}
    >
      <View style={{ width: 38, height: 38, borderRadius: radius.md, backgroundColor: uploaded ? palette.success : palette.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={uploading ? 'hourglass-outline' : uploaded ? 'checkmark' : 'cloud-upload-outline'} size={19} color={uploaded ? palette.white : palette.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodySm" weight="600">{label}</Text>
        <Text variant="caption" color={uploaded ? palette.success : palette.inkTertiary}>
          {uploading ? 'Uploading…' : uploaded ? 'Uploaded' : 'Tap to upload (JPG/PDF)'}
        </Text>
      </View>
      {!uploaded && !uploading ? <Ionicons name="chevron-forward" size={18} color={palette.inkTertiary} /> : null}
    </PressableScale>
  );
}
