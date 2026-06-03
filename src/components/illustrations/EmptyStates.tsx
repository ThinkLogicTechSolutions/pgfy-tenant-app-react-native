/** Empty-state & status illustrations (SVG, theme-colored). viewBox 160×160. */
import Svg, { Circle, Ellipse, Rect, Path, G, Line } from 'react-native-svg';
import { palette } from '@/theme';

const C = palette.coral;
const CT = palette.coralTint;
const CD = palette.coralDark;
const INK = palette.ink;
const MUT = palette.inkTertiary;
const WHITE = '#FFFFFF';
const BORDER = palette.border;
const GREEN = palette.success;

interface P {
  size?: number;
}

function Bg({ tint = CT }: { tint?: string }) {
  return (
    <>
      <Circle cx={80} cy={76} r={62} fill={tint} />
      <Ellipse cx={80} cy={140} rx={48} ry={7} fill={C} opacity={0.08} />
    </>
  );
}

export function EmptyGeneric({ size = 150 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Bg />
      <Path d="M44 78 L80 64 L116 78 L80 92 Z" fill={WHITE} stroke={BORDER} strokeWidth={2} />
      <Path d="M44 78 V110 L80 124 V92 Z" fill={CT} stroke={BORDER} strokeWidth={2} />
      <Path d="M116 78 V110 L80 124 V92 Z" fill={palette.coralTintStrong} stroke={BORDER} strokeWidth={2} />
      <Path d="M80 40 V52 M64 48 L70 56 M96 48 L90 56" stroke={C} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

export function EmptyBookings({ size = 150 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Bg />
      <Rect x={46} y={52} width={68} height={62} rx={10} fill={WHITE} stroke={BORDER} strokeWidth={2} />
      <Rect x={46} y={52} width={68} height={18} rx={10} fill={C} />
      <Rect x={46} y={62} width={68} height={8} fill={C} />
      <Line x1={60} y1={46} x2={60} y2={58} stroke={CD} strokeWidth={4} strokeLinecap="round" />
      <Line x1={100} y1={46} x2={100} y2={58} stroke={CD} strokeWidth={4} strokeLinecap="round" />
      {[80, 96].map((y) =>
        [58, 74, 90].map((x) => <Circle key={`${x}-${y}`} cx={x} cy={y} r={4} fill={CT} />)
      )}
      <Circle cx={104} cy={104} r={16} fill={GREEN} />
      <Path d="M97 104 L102 109 L112 99" stroke={WHITE} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function EmptyTickets({ size = 150 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Bg tint={palette.successTint} />
      <Rect x={52} y={48} width={56} height={68} rx={9} fill={WHITE} stroke={BORDER} strokeWidth={2} />
      <Rect x={68} y={42} width={24} height={12} rx={4} fill={CT} />
      <Line x1={62} y1={70} x2={98} y2={70} stroke={BORDER} strokeWidth={3} strokeLinecap="round" />
      <Line x1={62} y1={82} x2={90} y2={82} stroke={BORDER} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={104} cy={104} r={20} fill={GREEN} />
      <Path d="M95 104 L101 110 L114 96" stroke={WHITE} strokeWidth={3.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function EmptySearch({ size = 150 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Bg />
      <Rect x={44} y={54} width={50} height={60} rx={9} fill={WHITE} stroke={BORDER} strokeWidth={2} />
      <Line x1={54} y1={68} x2={84} y2={68} stroke={CT} strokeWidth={4} strokeLinecap="round" />
      <Line x1={54} y1={80} x2={76} y2={80} stroke={CT} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={98} cy={92} r={22} fill={WHITE} stroke={C} strokeWidth={5} />
      <Line x1={114} y1={108} x2={128} y2={122} stroke={C} strokeWidth={6} strokeLinecap="round" />
      <Line x1={90} y1={92} x2={106} y2={92} stroke={C} strokeWidth={3.4} strokeLinecap="round" />
    </Svg>
  );
}

export function EmptyNotifications({ size = 150 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Bg />
      <Path
        d="M80 46 C66 46 58 56 58 70 C58 88 50 94 50 100 L110 100 C110 94 102 88 102 70 C102 56 94 46 80 46 Z"
        fill={WHITE}
        stroke={BORDER}
        strokeWidth={2}
      />
      <Path d="M72 100 a8 8 0 0 0 16 0Z" fill={CT} />
      <Circle cx={80} cy={44} r={5} fill={C} />
      <Path d="M112 56 q6 4 6 12 M118 50 q9 6 9 18" stroke={MUT} strokeWidth={2.6} fill="none" strokeLinecap="round" opacity={0.5} />
    </Svg>
  );
}

export function EmptyTenants({ size = 150 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Bg />
      <G>
        <Circle cx={64} cy={72} r={14} fill={WHITE} stroke={BORDER} strokeWidth={2} />
        <Circle cx={64} cy={68} r={5} fill={CT} />
        <Path d="M52 84 a12 9 0 0 1 24 0Z" fill={CT} />
      </G>
      <G>
        <Circle cx={96} cy={72} r={16} fill={WHITE} stroke={C} strokeWidth={2.5} />
        <Circle cx={96} cy={67} r={6} fill={C} />
        <Path d="M82 86 a14 10 0 0 1 28 0Z" fill={C} />
      </G>
      <Circle cx={110} cy={104} r={15} fill={INK} />
      <Path d="M110 97 V111 M103 104 H117" stroke={WHITE} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

export function EmptyInvoices({ size = 150 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Bg />
      <Path d="M56 44 H104 V120 L96 114 L88 120 L80 114 L72 120 L64 114 L56 120 Z" fill={WHITE} stroke={BORDER} strokeWidth={2} />
      <Line x1={66} y1={62} x2={94} y2={62} stroke={CT} strokeWidth={4} strokeLinecap="round" />
      <Line x1={66} y1={76} x2={94} y2={76} stroke={CT} strokeWidth={4} strokeLinecap="round" />
      <Line x1={66} y1={90} x2={84} y2={90} stroke={CT} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={104} cy={100} r={16} fill={C} />
      <Path d="M99 92 h10 M99 97 h10 M108 92 c0 5 -5 5 -8 5 l7 7" stroke={WHITE} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function KycShield({ size = 150 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Bg />
      <Path d="M80 40 L114 53 V83 C114 106 99 118 80 126 C61 118 46 106 46 83 V53 Z" fill={C} />
      <Path d="M80 46 L108 57 V83 C108 102 96 112 80 119 C64 112 52 102 52 83 V57 Z" fill={CD} opacity={0.35} />
      <Path d="M67 82 L77 92 L96 70" stroke={WHITE} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SuccessBurst({ size = 150 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Circle cx={80} cy={78} r={62} fill={palette.successTint} />
      <Circle cx={80} cy={78} r={34} fill={GREEN} />
      <Path d="M66 78 L76 88 L96 66" stroke={WHITE} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M124 50 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 Z" fill={C} />
      <Circle cx={36} cy={58} r={4} fill={C} />
      <Circle cx={40} cy={108} r={3} fill={GREEN} />
      <Circle cx={122} cy={104} r={4} fill={CD} />
    </Svg>
  );
}
