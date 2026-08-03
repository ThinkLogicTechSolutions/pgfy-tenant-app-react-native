import { View, ViewStyle } from 'react-native';
import { palette, radius } from '@/theme';

interface Props {
  value: number; // 0–1
  color?: string;
  track?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({
  value,
  color = palette.coral,
  track = palette.surfaceSunken,
  height = 6,
  style,
}: Props) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      style={[
        { height, borderRadius: radius.pill, backgroundColor: track, overflow: 'hidden' },
        style,
      ]}
    >
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color, borderRadius: radius.pill }} />
    </View>
  );
}
