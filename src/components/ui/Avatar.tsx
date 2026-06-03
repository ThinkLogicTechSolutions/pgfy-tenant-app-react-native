/** Avatar with remote image + coral-initials fallback. */
import { View } from 'react-native';
import { Image } from 'expo-image';
import { palette, radius } from '@/theme';
import { initials as toInitials } from '@/lib/format';
import { Text } from './Text';

interface Props {
  name: string;
  uri?: string;
  size?: number;
  ring?: boolean;
}

export function Avatar({ name, uri, size = 44, ring }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: palette.coralTint,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: ring ? 2 : 0,
        borderColor: palette.surface,
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      ) : (
        <Text weight="700" color={palette.coralDark} style={{ fontSize: size * 0.36 }}>
          {toInitials(name)}
        </Text>
      )}
    </View>
  );
}
