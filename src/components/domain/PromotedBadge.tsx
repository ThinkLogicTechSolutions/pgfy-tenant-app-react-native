/** Sponsored listing badge with a golden gradient. */
import { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, radius } from '@/theme';
import { Text } from '@/components/ui';

interface Props {
  style?: ViewStyle;
  compact?: boolean;
}

export function PromotedBadge({ style, compact }: Props) {
  return (
    <LinearGradient
      colors={['#FFF4C2', '#F5C542', '#C9920A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          paddingHorizontal: compact ? 7 : 8,
          paddingVertical: compact ? 3 : 4,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: 'rgba(201,146,10,0.45)',
        },
        style,
      ]}
    >
      <Text variant="overline" color="#4A3600" style={{ fontSize: compact ? 9 : 10 }}>
        PROMOTED
      </Text>
    </LinearGradient>
  );
}
