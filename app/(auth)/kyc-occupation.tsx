/** T-S7b — Optional 2nd KYC step: occupation verification (student / working
 *  professional). Skippable — KYC is already complete after the Aadhaar step. */
import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Button, Input, Card, IconButton, SegmentedControl, PressableScale } from '@/components/ui';
import { SuccessBurst } from '@/components/illustrations';
import { haptic } from '@/lib/haptics';
import { setOccupation, type Occupation } from '@/store/profile';

const SEGMENTS = [
  { key: 'student', label: 'Student' },
  { key: 'professional', label: 'Working Professional' },
];

const STUDENT_DOCS = ['College / University ID card', 'Admission letter (new students)'];
const PRO_DOCS = ['Employee ID card', 'Offer / employment letter'];

export default function KycOccupation() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [occupation, setOcc] = useState<Occupation>('student');
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [done, setDone] = useState(false);

  const docs = occupation === 'student' ? STUDENT_DOCS : PRO_DOCS;

  const finishLater = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const submit = () => {
    const uploadedDocs = docs.filter((d) => uploaded[d]);
    setOccupation(occupation, {
      docs: uploadedDocs,
      enrollmentNo: occupation === 'student' ? enrollmentNo.trim() || undefined : undefined,
      companyEmail: occupation === 'professional' ? companyEmail.trim() || undefined : undefined,
      companyEmailVerified: occupation === 'professional' ? emailVerified : undefined,
    });
    haptic.success();
    setDone(true);
    setTimeout(finishLater, 1600);
  };

  if (done) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <SuccessBurst size={180} />
        <Text variant="h1" align="center" style={{ marginTop: spacing.lg }}>Profile verified!</Text>
        <Text variant="bodyLg" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.sm, maxWidth: 300 }}>
          You're all set. You can now book your stay.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, marginBottom: spacing.base }}>
        <IconButton icon="close" onPress={finishLater} style={{ borderRadius: 21 }} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text variant="h3">Occupation details</Text>
          <Text variant="caption" color={palette.inkSecondary}>Step 2 of 2 · optional</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: spacing.base }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', backgroundColor: palette.infoTint, padding: spacing.md, borderRadius: radius.md }}>
            <Ionicons name="information-circle" size={18} color={palette.info} />
            <Text variant="bodySm" color={palette.info} style={{ flex: 1 }}>
              Your KYC is already verified. Adding your occupation helps us match you with compatible roommates. You can skip this.
            </Text>
          </View>

          <View>
            <Text variant="bodyMd" weight="700" style={{ marginBottom: spacing.sm }}>I am a</Text>
            <SegmentedControl
              segments={SEGMENTS}
              value={occupation}
              onChange={(key) => { setOcc(key as Occupation); haptic.select(); }}
            />
          </View>

          {occupation === 'student' ? (
            <Card style={{ gap: spacing.md }}>
              <Text variant="bodyMd" weight="700">Student verification</Text>
              <UploadRow label="College / University ID card" uploaded={!!uploaded['College / University ID card']} onPress={() => setUploaded((u) => ({ ...u, ['College / University ID card']: true }))} />
              <UploadRow label="Admission letter (new students)" uploaded={!!uploaded['Admission letter (new students)']} onPress={() => setUploaded((u) => ({ ...u, ['Admission letter (new students)']: true }))} />
              <Input label="Enrollment / registration number" value={enrollmentNo} onChangeText={setEnrollmentNo} placeholder="e.g. 21BCE1234" icon="id-card-outline" autoCapitalize="characters" />
            </Card>
          ) : (
            <Card style={{ gap: spacing.md }}>
              <Text variant="bodyMd" weight="700">Working professional verification</Text>
              <UploadRow label="Employee ID card" uploaded={!!uploaded['Employee ID card']} onPress={() => setUploaded((u) => ({ ...u, ['Employee ID card']: true }))} />
              <UploadRow label="Offer / employment letter" uploaded={!!uploaded['Offer / employment letter']} onPress={() => setUploaded((u) => ({ ...u, ['Offer / employment letter']: true }))} />
              <View>
                <Text variant="caption" color={palette.inkSecondary} style={{ marginBottom: 6 }}>Company email</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                  <Input
                    containerStyle={{ flex: 1 }}
                    value={companyEmail}
                    onChangeText={(t) => { setCompanyEmail(t); setEmailVerified(false); }}
                    placeholder="you@company.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    icon="mail-outline"
                  />
                  <Button
                    label={emailVerified ? 'Verified' : 'Verify'}
                    variant={emailVerified ? 'subtle' : 'outline'}
                    icon={emailVerified ? 'checkmark' : undefined}
                    disabled={!companyEmail.includes('@') || emailVerified}
                    onPress={() => { setEmailVerified(true); haptic.success(); }}
                  />
                </View>
                {emailVerified ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm }}>
                    <Ionicons name="checkmark-circle" size={15} color={palette.success} />
                    <Text variant="caption" color={palette.success}>Company email verified</Text>
                  </View>
                ) : null}
              </View>
            </Card>
          )}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.base, paddingTop: spacing.sm, gap: spacing.sm }}>
        <Button label="Submit & verify" onPress={submit} full size="lg" />
        <Button label="Skip for now" variant="ghost" onPress={finishLater} full />
      </View>
    </View>
  );
}

function UploadRow({ label, uploaded, onPress }: { label: string; uploaded: boolean; onPress: () => void }) {
  return (
    <PressableScale
      onPress={uploaded ? undefined : onPress}
      scaleTo={uploaded ? 1 : 0.99}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        borderWidth: 1.5, borderColor: uploaded ? palette.success : palette.border,
        borderRadius: radius.md, padding: spacing.md,
        backgroundColor: uploaded ? palette.successTint : palette.surface,
      }}
    >
      <View style={{ width: 38, height: 38, borderRadius: radius.md, backgroundColor: uploaded ? palette.success : palette.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={uploaded ? 'checkmark' : 'cloud-upload-outline'} size={19} color={uploaded ? palette.white : palette.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodySm" weight="600">{label}</Text>
        <Text variant="caption" color={uploaded ? palette.success : palette.inkTertiary}>{uploaded ? 'Uploaded' : 'Tap to upload (JPG/PDF)'}</Text>
      </View>
      {!uploaded ? <Ionicons name="chevron-forward" size={18} color={palette.inkTertiary} /> : null}
    </PressableScale>
  );
}
