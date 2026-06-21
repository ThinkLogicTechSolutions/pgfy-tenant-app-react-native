/** City / area tile — illustrated landmark on a white tile with a label. */
import { View } from 'react-native';
import { Image } from 'expo-image';
import { palette, radius, spacing, shadows } from '@/theme';
import { Text, PressableScale } from '@/components/ui';
import { LandmarkIllustration, type LandmarkId } from '@/components/illustrations';

export function CityTile({
  label,
  sublabel,
  landmarkId,
  accent,
  image,
  isNew,
  width = 108,
  onPress,
}: {
  label: string;
  sublabel?: string;
  landmarkId?: LandmarkId;
  accent?: string;
  /** Admin-uploaded artwork; overrides the built-in illustration when present. */
  image?: string;
  isNew?: boolean;
  width?: number | `${number}%`;
  onPress?: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.96}
      style={{
        width,
        backgroundColor: palette.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: palette.border,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        alignItems: 'center',
        ...shadows.card,
      }}
    >
      {isNew ? (
        <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: '#FFC93C', borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text variant="overline" color={palette.ink} style={{ fontSize: 8, letterSpacing: 0.4 }}>NEW</Text>
        </View>
      ) : null}

      <View style={{ height: 58, justifyContent: 'flex-end', marginBottom: 6 }}>
        {image ? (
          <Image source={{ uri: image }} style={{ width: 54, height: 54 }} contentFit="contain" />
        ) : (
          <LandmarkIllustration id={landmarkId} accent={accent} size={54} />
        )}
      </View>

      <Text variant="bodySm" weight="700" align="center" numberOfLines={1}>
        {label}
      </Text>
      {sublabel ? (
        <Text variant="caption" color={palette.inkTertiary} align="center" numberOfLines={1} style={{ marginTop: 1 }}>
          {sublabel}
        </Text>
      ) : null}
    </PressableScale>
  );
}
