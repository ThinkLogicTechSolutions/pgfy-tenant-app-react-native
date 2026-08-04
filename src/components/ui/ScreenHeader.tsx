/** Standard stack-screen header with back chevron + optional right slot. */
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing } from '@/theme';
import { Text } from './Text';
import { PressableScale } from './PressableScale';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
  large?: boolean;
}

export function ScreenHeader({ title, subtitle, right, onBack, large }: Props) {
  const router = useRouter();
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)')));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.base,
        paddingBottom: spacing.md,
        paddingTop: spacing.xs,
      }}
    >
      <PressableScale
        onPress={back}
        scaleTo={0.9}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: palette.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="chevron-back" size={22} color={palette.ink} />
      </PressableScale>
      <View style={{ flex: 1 }}>
        <Text variant={large ? 'h1' : 'h3'} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySm" color={palette.inkSecondary} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}
