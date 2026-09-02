/** T-S — Roommate preferences ("More about yourself"). Optional, consent-gated; drives the
 *  room match score shown during room/bed selection. Real `PATCH /profile/tenant-profile/:id`.
 *  Reachable after booking, from room/bed selection, or later from My Stay. */
import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Card, Button, Chip, Input, IconButton, PressableScale } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { toast } from '@/lib/toast';
import { alert } from '@/lib/alertDialog';
import { useAuth } from '@/context/AuthContext';
import { errorMessage, type SleepScheduleApi, type DietPreferenceApi } from '@/lib/api';

const SLEEP_OPTIONS: { value: SleepScheduleApi; label: string }[] = [
  { value: 'EARLY_BIRD', label: 'Early sleeper' },
  { value: 'NIGHT_OWL', label: 'Night owl' },
];

const DIET_OPTIONS: { value: DietPreferenceApi; label: string }[] = [
  { value: 'VEGETARIAN', label: 'Vegetarian' },
  { value: 'VEGAN', label: 'Vegan' },
  { value: 'NON_VEGETARIAN', label: 'Non-vegetarian' },
];

export default function RoommatePreferences() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuth();
  const existing = user?.roommate_preferences;

  const [smoking, setSmoking] = useState<boolean | null>(existing?.smoking_pref ?? null);
  const [alcohol, setAlcohol] = useState<boolean | null>(existing?.alcohol_pref ?? null);
  const [sleep, setSleep] = useState<SleepScheduleApi | null>(existing?.sleep_schedule ?? null);
  const [diet, setDiet] = useState<DietPreferenceApi | null>(existing?.diet_preference ?? null);
  const [aboutMe, setAboutMe] = useState(existing?.about_me ?? '');
  const [consent, setConsent] = useState(existing?.show_preferences_to_roommates ?? false);
  const [saving, setSaving] = useState(false);

  const skip = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/stay'));

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateProfile({
        roommate_preferences: {
          sleep_schedule: sleep,
          diet_preference: diet,
          smoking_pref: smoking,
          alcohol_pref: alcohol,
          about_me: aboutMe.trim() || null,
          show_preferences_to_roommates: consent,
        },
      });
      haptic.success();
      toast.success('Preferences saved');
      skip();
    } catch (e) {
      haptic.error();
      alert("Couldn't save your preferences", errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, marginBottom: spacing.base }}>
        <IconButton icon="close" onPress={skip} style={{ borderRadius: 21 }} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text variant="h3">More about yourself</Text>
          <Text variant="caption" color={palette.inkSecondary}>Optional · helps us match roommates</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing.xl, gap: spacing.base }} showsVerticalScrollIndicator={false}>
        <PrefSection label="Smoking">
          <Chip label="Non-smoking" active={smoking === false} onPress={() => { setSmoking(false); haptic.select(); }} />
          <Chip label="Smoking-friendly" active={smoking === true} onPress={() => { setSmoking(true); haptic.select(); }} />
        </PrefSection>

        <PrefSection label="Alcohol">
          <Chip label="No alcohol" active={alcohol === false} onPress={() => { setAlcohol(false); haptic.select(); }} />
          <Chip label="Alcohol-friendly" active={alcohol === true} onPress={() => { setAlcohol(true); haptic.select(); }} />
        </PrefSection>

        <PrefSection label="Sleep schedule">
          {SLEEP_OPTIONS.map((o) => (
            <Chip key={o.value} label={o.label} active={sleep === o.value} onPress={() => { setSleep(o.value); haptic.select(); }} />
          ))}
        </PrefSection>

        <PrefSection label="Diet">
          {DIET_OPTIONS.map((o) => (
            <Chip key={o.value} label={o.label} active={diet === o.value} onPress={() => { setDiet(o.value); haptic.select(); }} />
          ))}
        </PrefSection>

        <Input
          label="About you (optional)"
          placeholder="e.g. Quiet, early sleeper"
          multiline
          maxLength={200}
          value={aboutMe}
          onChangeText={setAboutMe}
          style={{ height: 80 }}
        />

        <Card>
          <PressableScale onPress={() => { setConsent((c) => !c); haptic.select(); }} haptics={false} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: consent ? palette.coral : palette.surface, borderWidth: 1.5, borderColor: consent ? palette.coral : palette.borderStrong }}>
              {consent ? <Ionicons name="checkmark" size={18} color={palette.white} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodySm" weight="600">Show my preferences to potential roommates</Text>
              <Text variant="caption" color={palette.inkTertiary}>You can change this anytime from your profile.</Text>
            </View>
          </PressableScale>
        </Card>

        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', backgroundColor: palette.infoTint, padding: spacing.md, borderRadius: radius.md }}>
          <Ionicons name="people-circle-outline" size={20} color={palette.info} />
          <Text variant="bodySm" color={palette.info} style={{ flex: 1 }}>
            We collect this so that only compatible roommates can be assigned to you. Sharing is optional and only shown to others with your consent.
          </Text>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing.base, paddingTop: spacing.sm, gap: spacing.sm }}>
        <Button label="Save preferences" onPress={save} loading={saving} full size="lg" />
        <Button label="Skip for now" variant="ghost" onPress={skip} full disabled={saving} />
      </View>
    </View>
  );
}

function PrefSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>{label.toUpperCase()}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{children}</View>
    </View>
  );
}
