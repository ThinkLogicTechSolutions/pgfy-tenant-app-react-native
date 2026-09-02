/** Tenant onboarding scenes (SVG) — navy brand + coral accent. */
import Svg, { Defs, LinearGradient, Stop, Circle, Ellipse, Rect, Path, G, Line } from 'react-native-svg';
import { palette } from '@/theme';

const NAVY = palette.navy;
const NAVY_T = palette.navyTint;
const C = palette.coral;
const CT = palette.coralTint;
const WHITE = '#FFFFFF';
const GREEN = palette.success;
const STAR = palette.star;

interface P { size?: number }

function Backdrop() {
  return (
    <>
      <Defs>
        <LinearGradient id="ob-navy" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={NAVY_T} />
          <Stop offset="1" stopColor={palette.navyTintStrong} />
        </LinearGradient>
      </Defs>
      <Circle cx={100} cy={96} r={84} fill="url(#ob-navy)" />
      <Ellipse cx={100} cy={172} rx={70} ry={9} fill={NAVY} opacity={0.08} />
    </>
  );
}

/** Slide 1 — Find your perfect home (map + pins + search). */
export function ObFind({ size = 220 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Backdrop />
      {/* map card */}
      <Rect x={44} y={52} width={112} height={92} rx={14} fill={WHITE} stroke={palette.border} strokeWidth={2} />
      <Path d="M44 110 q28 -16 56 0 t56 0" stroke={NAVY_T} strokeWidth={6} fill="none" opacity={0.7} />
      <Path d="M44 92 q28 12 56 0 t56 0" stroke={palette.surfaceSunken} strokeWidth={8} fill="none" />
      {/* pins */}
      <G>
        <Path d="M76 86 c0 -8 -6 -14 -14 -14 s-14 6 -14 14 c0 10 14 22 14 22 s14 -12 14 -22 Z" fill={NAVY} />
        <Circle cx={62} cy={86} r={5} fill={WHITE} />
      </G>
      <G>
        <Path d="M132 104 c0 -7 -5 -12 -12 -12 s-12 5 -12 12 c0 9 12 19 12 19 s12 -10 12 -19 Z" fill={C} />
        <Circle cx={120} cy={104} r={4.5} fill={WHITE} />
      </G>
      <Circle cx={150} cy={70} r={4} fill={GREEN} />
      {/* search bubble */}
      <Rect x={92} y={128} width={78} height={26} rx={13} fill={NAVY} />
      <Circle cx={106} cy={141} r={6} fill="none" stroke={WHITE} strokeWidth={2.4} />
      <Line x1={110} y1={145} x2={114} y2={149} stroke={WHITE} strokeWidth={2.4} strokeLinecap="round" />
      <Rect x={118} y={138} width={42} height={5} rx={2.5} fill={WHITE} opacity={0.7} />
    </Svg>
  );
}

/** Slide 2 — Book in minutes (phone + booking pass + QR). */
export function ObBook({ size = 220 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Backdrop />
      <Rect x={68} y={44} width={64} height={108} rx={14} fill={NAVY} />
      <Rect x={74} y={54} width={52} height={88} rx={8} fill={WHITE} />
      {/* property thumb */}
      <Rect x={80} y={60} width={40} height={26} rx={5} fill={CT} />
      <Path d="M88 78 l8 -8 l8 8 Z" fill={C} />
      <Rect x={80} y={92} width={40} height={5} rx={2.5} fill={palette.surfaceSunken} />
      <Rect x={80} y={101} width={28} height={5} rx={2.5} fill={palette.surfaceSunken} />
      {/* QR */}
      <Rect x={84} y={112} width={24} height={24} rx={3} fill={NAVY} />
      <Rect x={88} y={116} width={6} height={6} fill={WHITE} />
      <Rect x={98} y={116} width={6} height={6} fill={WHITE} />
      <Rect x={88} y={126} width={6} height={6} fill={WHITE} />
      <Rect x={98} y={126} width={6} height={6} fill={WHITE} />
      {/* success badge */}
      <Circle cx={128} cy={70} r={16} fill={GREEN} />
      <Path d="M121 70 l5 5 l9 -10" stroke={WHITE} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M150 120 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z" fill={C} />
    </Svg>
  );
}

/** Slide 3 — Manage your stay (rent, visitors, support). */
export function ObManage({ size = 220 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Backdrop />
      <Rect x={46} y={54} width={108} height={92} rx={14} fill={WHITE} stroke={palette.border} strokeWidth={2} />
      <Rect x={58} y={66} width={48} height={8} rx={4} fill={NAVY_T} />
      {/* rent tile */}
      <Rect x={58} y={84} width={40} height={40} rx={9} fill={CT} />
      <Path d="M72 96 h12 M72 102 h12 M82 96 c0 6 -5 6 -8 6 l7 7" stroke={C} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* visitor tile */}
      <Rect x={104} y={84} width={40} height={18} rx={7} fill={NAVY} />
      <Circle cx={114} cy={93} r={4} fill={WHITE} />
      <Path d="M122 96 a6 5 0 0 1 12 0Z" fill={WHITE} opacity={0.85} />
      {/* support tile */}
      <Rect x={104} y={106} width={40} height={18} rx={7} fill={palette.successTint} />
      <Path d="M112 115 a5 5 0 1 1 10 0 c0 3 -5 3 -5 6" stroke={GREEN} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Circle cx={117} cy={120} r={1.4} fill={GREEN} />
      {/* star rating */}
      <G>
        {[0, 1, 2].map((i) => (
          <Path key={i} d={`M${64 + i * 14} 134 l1.6 3.4 l3.6 .4 l-2.7 2.4 l.8 3.6 l-3.3 -1.9 l-3.3 1.9 l.8 -3.6 l-2.7 -2.4 l3.6 -.4 Z`} fill={STAR} />
        ))}
      </G>
    </Svg>
  );
}
