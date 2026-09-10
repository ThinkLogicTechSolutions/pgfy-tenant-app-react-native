/** Generic "coming soon" placeholder for services not yet launched (e.g. Metro tickets).
 *  Pass `title`, optional `subtitle` and `icon` via route params to theme the screen. */
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, spacing } from '@/theme';
import { Text, ScreenHeader, Button } from '@/components/ui';

export default function ComingSoon() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { title, subtitle, icon, iconFamily } = useLocalSearchParams<{ title?: string; subtitle?: string; icon?: string; iconFamily?: string }>();

  const heading = title ?? 'Coming soon';
  const blurb = subtitle ?? 'We’re putting the finishing touches on this. It’ll be ready for you very soon.';
  const glyph = (icon as keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap | keyof typeof FontAwesome.glyphMap) ?? 'rocket-outline';
  const family = (iconFamily as 'Ionicons' | 'MaterialCommunityIcons' | 'FontAwesome') ?? 'Ionicons';

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + spacing.sm }}>
      <ScreenHeader title={heading} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing['4xl'] }}>
        <LinearGradient
          colors={[palette.coral, palette.coralDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl }}
        >
          {family === 'Ionicons' && <Ionicons name={glyph as keyof typeof Ionicons.glyphMap} size={52} color={palette.white} />}
          {family === 'MaterialCommunityIcons' && <MaterialCommunityIcons name={glyph as keyof typeof MaterialCommunityIcons.glyphMap} size={52} color={palette.white} />}
          {family === 'FontAwesome' && <FontAwesome name={glyph as keyof typeof FontAwesome.glyphMap} size={52} color={palette.white} />}
        </LinearGradient>
        <View style={{ backgroundColor: palette.coralTint, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: 6, marginBottom: spacing.md }}>
          <Text variant="overline" color={palette.coralDark}>COMING SOON</Text>
        </View>
        <Text variant="h2" align="center">{heading}</Text>
        <Text variant="body" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.sm, maxWidth: 300 }}>
          {blurb}
        </Text>
        <Button
          label="Back to home"
          icon="home-outline"
          variant="subtle"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={{ marginTop: spacing['2xl'], alignSelf: 'center' }}
        />
      </View>
    </View>
  );
}
