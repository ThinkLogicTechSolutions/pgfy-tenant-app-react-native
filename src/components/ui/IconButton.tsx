import { ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius } from '@/theme';
import { PressableScale } from './PressableScale';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  color?: string;
  bg?: string;
  badge?: boolean;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  onPress,
  size = 22,
  color = palette.ink,
  bg = palette.surface,
  badge,
  style,
}: Props) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.9}
      style={{
        width: 42,
        height: 42,
        borderRadius: radius.md,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: palette.border,
        ...style,
      }}
    >
      <Ionicons name={icon} size={size} color={color} />
      {badge ? (
        <Ionicons
          name="ellipse"
          size={9}
          color={palette.coral}
          style={{ position: 'absolute', top: 9, right: 9 }}
        />
      ) : null}
    </PressableScale>
  );
}
