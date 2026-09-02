/** Circular progress ring (SVG). Used for occupancy KPI. */
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { palette } from '@/theme';

interface Props {
  size?: number;
  stroke?: number;
  progress: number; // 0–100
  color?: string;
  track?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  size = 56,
  stroke = 6,
  progress,
  color = palette.coral,
  track = palette.surfaceSunken,
  children,
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, progress));
  const offset = c - (pct / 100) * c;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
