/**
 * City landmark illustrations — lightweight, original line-art monuments used
 * on the city / area tiles. Each is a simplified geometric silhouette (not a
 * traced icon pack) so they render crisp & offline at any size.
 *
 * Admins can override any tile with their own uploaded artwork via the tile's
 * `image` prop; these are the built-in defaults keyed by `landmarkId`.
 */
import Svg, { Path, Rect, Line, Circle, G } from 'react-native-svg';

const STROKE = '#3B475C';
const WALL = '#EEF1F6';
const SW = 1.7;

const line = { stroke: STROKE, strokeWidth: SW, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const ground = (
  <Line x1={9} y1={55} x2={55} y2={55} stroke="#C9D3E0" strokeWidth={1.8} strokeLinecap="round" />
);

export type LandmarkId =
  | 'vidhanaSoudha'
  | 'gopuram'
  | 'charminar'
  | 'gateway'
  | 'indiaGate'
  | 'fort'
  | 'victoria'
  | 'mosque'
  | 'cityscape';

type IconProps = { size?: number; accent?: string };

function Frame({ size = 52, children }: { size?: number; children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {children}
    </Svg>
  );
}

/** Bengaluru — Vidhana Soudha (central dome + flanking domes + colonnade). */
export function VidhanaSoudha({ size, accent = '#5B8DEF' }: IconProps) {
  return (
    <Frame size={size}>
      {ground}
      <Rect x={11} y={41} width={42} height={13} rx={1} fill={WALL} {...line} />
      <G stroke="#C7D2E0" strokeWidth={1.3} strokeLinecap="round">
        <Line x1={17} y1={44} x2={17} y2={52} /><Line x1={22} y1={44} x2={22} y2={52} />
        <Line x1={42} y1={44} x2={42} y2={52} /><Line x1={47} y1={44} x2={47} y2={52} />
      </G>
      <Rect x={26} y={31} width={12} height={10} fill="#E7ECF3" {...line} />
      <Path d="M25 31 Q32 18 39 31 Z" fill={accent} {...line} />
      <Line x1={32} y1={18} x2={32} y2={13} {...line} />
      <Circle cx={32} cy={12} r={1.6} fill={accent} />
      <Path d="M13 41 Q17 35 21 41 Z" fill={accent} opacity={0.55} {...line} />
      <Path d="M43 41 Q47 35 51 41 Z" fill={accent} opacity={0.55} {...line} />
    </Frame>
  );
}

/** Chennai — temple gopuram (tiered tower). */
export function Gopuram({ size, accent = '#E0913A' }: IconProps) {
  return (
    <Frame size={size}>
      {ground}
      <Path d="M20 54 L23 24 L41 24 L44 54 Z" fill={WALL} {...line} />
      <G stroke={accent} strokeWidth={1.4} strokeLinecap="round">
        <Line x1={22} y1={47} x2={42} y2={47} /><Line x1={22.5} y1={40} x2={41.5} y2={40} />
        <Line x1={23} y1={33} x2={41} y2={33} />
      </G>
      <Path d="M23 24 L26 17 L38 17 L41 24 Z" fill={accent} {...line} />
      <Circle cx={28} cy={15} r={1.3} fill={accent} /><Circle cx={32} cy={14} r={1.6} fill={accent} /><Circle cx={36} cy={15} r={1.3} fill={accent} />
      <Path d="M29 54 L29 47 Q32 43 35 47 L35 54" fill="#E7D8BE" {...line} />
    </Frame>
  );
}

/** Hyderabad — Charminar (four minarets + arched base). */
export function Charminar({ size, accent = '#54B488' }: IconProps) {
  return (
    <Frame size={size}>
      {ground}
      <Rect x={17} y={33} width={30} height={21} fill={WALL} {...line} />
      <G fill={WALL} {...line}>
        <Rect x={12} y={22} width={4.5} height={32} rx={1.4} />
        <Rect x={23.5} y={26} width={4} height={28} rx={1.4} />
        <Rect x={36.5} y={26} width={4} height={28} rx={1.4} />
        <Rect x={47.5} y={22} width={4.5} height={32} rx={1.4} />
      </G>
      <G fill={accent} {...line}>
        <Path d="M11.5 22 Q14.25 17 16.5 22 Z" />
        <Path d="M23 26 Q25.5 22 27.5 26 Z" />
        <Path d="M36.5 26 Q38.5 22 40.5 26 Z" />
        <Path d="M47.5 22 Q49.75 17 52 22 Z" />
      </G>
      <Rect x={18} y={31} width={28} height={4} fill={accent} {...line} />
      <Path d="M27 54 L27 42 Q32 36 37 42 L37 54" fill="#fff" {...line} />
    </Frame>
  );
}

/** Mumbai — Gateway of India (central arch + dome + turrets). */
export function Gateway({ size, accent = '#C9923E' }: IconProps) {
  return (
    <Frame size={size}>
      {ground}
      <Rect x={12} y={31} width={40} height={23} fill={WALL} {...line} />
      <Path d="M23 31 Q32 17 41 31 Z" fill={accent} {...line} />
      <Line x1={32} y1={17} x2={32} y2={13} {...line} /><Circle cx={32} cy={12} r={1.5} fill={accent} />
      <G fill={accent} opacity={0.5} {...line}>
        <Rect x={13} y={26} width={6} height={5} rx={1} />
        <Rect x={45} y={26} width={6} height={5} rx={1} />
      </G>
      <Path d="M27 54 L27 41 Q32 33 37 41 L37 54" fill="#fff" {...line} />
      <Path d="M16 54 L16 46 Q19 42 22 46 L22 54" fill="#fff" {...line} />
      <Path d="M42 54 L42 46 Q45 42 48 46 L48 54" fill="#fff" {...line} />
    </Frame>
  );
}

/** Delhi — India Gate (triumphal arch). */
export function IndiaGate({ size, accent = '#D5895A' }: IconProps) {
  return (
    <Frame size={size}>
      {ground}
      <Rect x={13} y={49} width={38} height={5} rx={1} fill="#E2E8F0" {...line} />
      <Path d="M19 49 L19 23 Q32 14 45 23 L45 49" fill={WALL} {...line} />
      <Rect x={17} y={20} width={30} height={4} rx={1} fill={accent} {...line} />
      <Line x1={32} y1={20} x2={32} y2={15} {...line} /><Circle cx={32} cy={14} r={1.5} fill={accent} />
      <Path d="M27 49 L27 33 Q32 27 37 33 L37 49 Z" fill="#ECE7F1" {...line} />
    </Frame>
  );
}

/** Pune — Shaniwar Wada (fort gateway with battlements + bastions). */
export function Fort({ size, accent = '#B5895A' }: IconProps) {
  return (
    <Frame size={size}>
      {ground}
      <Rect x={14} y={31} width={36} height={23} fill={WALL} {...line} />
      <G fill={accent} {...line}>
        <Rect x={16} y={28} width={3.5} height={3.5} /><Rect x={23} y={28} width={3.5} height={3.5} />
        <Rect x={30.25} y={28} width={3.5} height={3.5} /><Rect x={37.5} y={28} width={3.5} height={3.5} />
        <Rect x={44.5} y={28} width={3.5} height={3.5} />
      </G>
      <G fill={WALL} {...line}>
        <Rect x={10} y={27} width={6} height={27} rx={1} />
        <Rect x={48} y={27} width={6} height={27} rx={1} />
      </G>
      <Path d="M9.5 27 Q13 23 16.5 27 Z" fill={accent} {...line} />
      <Path d="M47.5 27 Q51 23 54.5 27 Z" fill={accent} {...line} />
      <Path d="M27 54 L27 42 Q32 37 37 42 L37 54" fill="#6B4F34" opacity={0.85} {...line} />
    </Frame>
  );
}

/** Kolkata — Victoria Memorial (grand central dome + corner domes). */
export function Victoria({ size, accent = '#7C9BD0' }: IconProps) {
  return (
    <Frame size={size}>
      {ground}
      <Rect x={12} y={40} width={40} height={14} rx={1} fill={WALL} {...line} />
      <G stroke="#C7D2E0" strokeWidth={1.3} strokeLinecap="round">
        <Line x1={18} y1={43} x2={18} y2={53} /><Line x1={24} y1={43} x2={24} y2={53} />
        <Line x1={40} y1={43} x2={40} y2={53} /><Line x1={46} y1={43} x2={46} y2={53} />
      </G>
      <Rect x={27} y={30} width={10} height={10} fill="#E7ECF3" {...line} />
      <Path d="M24 30 Q32 15 40 30 Z" fill={accent} {...line} />
      <Line x1={32} y1={15} x2={32} y2={10} {...line} /><Circle cx={32} cy={9} r={1.6} fill={accent} />
      <Path d="M12 40 Q15.5 34 19 40 Z" fill={accent} opacity={0.55} {...line} />
      <Path d="M45 40 Q48.5 34 52 40 Z" fill={accent} opacity={0.55} {...line} />
    </Frame>
  );
}

/** Ahmedabad — mosque (central dome + twin minarets). */
export function Mosque({ size, accent = '#5FB3A3' }: IconProps) {
  return (
    <Frame size={size}>
      {ground}
      <Rect x={16} y={34} width={32} height={20} fill={WALL} {...line} />
      <Path d="M26 34 Q32 23 38 34 Z" fill={accent} {...line} />
      <Line x1={32} y1={23} x2={32} y2={19} {...line} /><Circle cx={32} cy={18} r={1.4} fill={accent} />
      <G fill={WALL} {...line}>
        <Rect x={13} y={26} width={4} height={28} rx={1.4} />
        <Rect x={47} y={26} width={4} height={28} rx={1.4} />
      </G>
      <Path d="M12.5 26 Q15 22 17.5 26 Z" fill={accent} {...line} />
      <Path d="M46.5 26 Q49 22 51.5 26 Z" fill={accent} {...line} />
      <G fill="#fff" {...line}>
        <Path d="M21 54 L21 47 Q23.5 44 26 47 L26 54" />
        <Path d="M38 54 L38 47 Q40.5 44 43 47 L43 54" />
      </G>
    </Frame>
  );
}

/** Generic neighbourhood cluster — used for areas (accent tints the buildings). */
export function Cityscape({ size, accent = '#5B8DEF' }: IconProps) {
  return (
    <Frame size={size}>
      {ground}
      <Rect x={13} y={34} width={13} height={20} rx={1.5} fill={accent} opacity={0.16} {...line} />
      <Rect x={26} y={25} width={13} height={29} rx={1.5} fill={WALL} {...line} />
      <Rect x={39} y={38} width={12} height={16} rx={1.5} fill={accent} opacity={0.16} {...line} />
      <G fill={accent}>
        <Rect x={16} y={38} width={2.5} height={2.5} /><Rect x={20.5} y={38} width={2.5} height={2.5} />
        <Rect x={16} y={43} width={2.5} height={2.5} /><Rect x={20.5} y={43} width={2.5} height={2.5} />
        <Rect x={29} y={29} width={2.5} height={2.5} /><Rect x={33.5} y={29} width={2.5} height={2.5} />
        <Rect x={29} y={34} width={2.5} height={2.5} /><Rect x={33.5} y={34} width={2.5} height={2.5} />
        <Rect x={29} y={39} width={2.5} height={2.5} /><Rect x={33.5} y={39} width={2.5} height={2.5} />
        <Rect x={42} y={42} width={2.5} height={2.5} /><Rect x={46} y={42} width={2.5} height={2.5} />
      </G>
    </Frame>
  );
}

const REGISTRY: Record<LandmarkId, (p: IconProps) => React.ReactElement> = {
  vidhanaSoudha: VidhanaSoudha,
  gopuram: Gopuram,
  charminar: Charminar,
  gateway: Gateway,
  indiaGate: IndiaGate,
  fort: Fort,
  victoria: Victoria,
  mosque: Mosque,
  cityscape: Cityscape,
};

/** Dispatcher — renders the built-in landmark for `id` (falls back to cityscape). */
export function LandmarkIllustration({ id, size = 52, accent }: { id?: LandmarkId; size?: number; accent?: string }) {
  const Cmp = (id && REGISTRY[id]) || Cityscape;
  return <Cmp size={size} accent={accent} />;
}
