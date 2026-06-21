/** T-S — Roommate preferences ("More about yourself"). Optional, consent-gated;
 *  drives the room compatibility score. Reachable after booking or later from My Stay. */
import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Card, Button, Chip, IconButton, PressableScale } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { getProfile, setPreferences, type LifestylePrefs, type SleepSchedule, type Diet } from '@/store/profile';

export default function RoommatePreferences() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const initial = getProfile();

  const [prefs, setPrefs] = useState<LifestylePrefs>(initial.prefs);
  const [consent, setConsent] = useState(initial.consentToShare);

  const set = (patch: Partial<LifestylePrefs>) => { setPrefs((p) => ({ ...p, ...patch })); haptic.select(); };

  const skip = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/stay'));

  const save = () => {
    setPreferences(prefs, consent);
    haptic.success();
    skip();
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
          <Chip label="Non-smoking" active={prefs.smoking === false} onPress={() => set({ smoking: false })} />
          <Chip label="Smoking-friendly" active={prefs.smoking === true} onPress={() => set({ smoking: true })} />
        </PrefSection>

        <PrefSection label="Alcohol">
          <Chip label="No alcohol" active={prefs.alcohol === false} onPress={() => set({ alcohol: false })} />
          <Chip label="Alcohol-friendly" active={prefs.alcohol === true} onPress={() => set({ alcohol: true })} />
        </PrefSection>

        <PrefSection label="Sleep schedule">
          {(['early', 'late'] as SleepSchedule[]).map((s) => (
            <Chip key={s} label={s === 'early' ? 'Early sleeper' : 'Night owl'} active={prefs.sleep === s} onPress={() => set({ sleep: s })} />
          ))}
        </PrefSection>

        <PrefSection label="Diet">
          {(['veg', 'vegan', 'nonveg'] as Diet[]).map((d) => (
            <Chip key={d} label={d === 'veg' ? 'Vegetarian' : d === 'vegan' ? 'Vegan' : 'Non-vegetarian'} active={prefs.diet === d} onPress={() => set({ diet: d })} />
          ))}
        </PrefSection>

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
        <Button label="Save preferences" onPress={save} full size="lg" />
        <Button label="Skip for now" variant="ghost" onPress={skip} full />
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
