/** A stylized dummy map background (SVG) — water, parks, blocks & roads. */
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path, G, Circle } from 'react-native-svg';
import { palette } from '@/theme';

const LAND = '#E5EBF2';
const LAND2 = '#DCE4EE';
const WATER = '#BBD4E8';
const PARK = '#CBE3CC';
const PARK2 = '#BEDBC0';
const BLOCK = '#EEF2F7';
const ROAD = '#FFFFFF';
const ROAD_CASING = '#D5DEE8';

export function MapBackdrop() {
  return (
    <View style={{ position: 'absolute', inset: 0 }}>
      <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="land" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={LAND} />
            <Stop offset="1" stopColor={LAND2} />
          </LinearGradient>
        </Defs>

        {/* base land */}
        <Rect x="0" y="0" width="400" height="800" fill="url(#land)" />

        {/* river running diagonally */}
        <Path d="M-40 240 C 80 300, 120 360, 200 380 C 300 405, 340 520, 460 560 L 460 660 C 320 620, 280 500, 190 470 C 110 444, 60 400, -40 360 Z" fill={WATER} opacity={0.9} />

        {/* parks */}
        <Rect x="36" y="96" width="120" height="92" rx="16" fill={PARK} />
        <Rect x="250" y="150" width="118" height="80" rx="16" fill={PARK2} />
        <Rect x="60" y="600" width="150" height="120" rx="18" fill={PARK} />
        <Circle cx="320" cy="660" r="46" fill={PARK2} />

        {/* building blocks (clusters) */}
        <G fill={BLOCK}>
          <Rect x="250" y="300" width="46" height="40" rx="6" />
          <Rect x="304" y="300" width="40" height="40" rx="6" />
          <Rect x="250" y="348" width="40" height="46" rx="6" />
          <Rect x="298" y="348" width="46" height="46" rx="6" />
          <Rect x="40" y="300" width="44" height="44" rx="6" />
          <Rect x="92" y="300" width="40" height="44" rx="6" />
          <Rect x="40" y="352" width="40" height="40" rx="6" />
          <Rect x="300" y="520" width="44" height="40" rx="6" />
          <Rect x="40" y="470" width="42" height="40" rx="6" />
        </G>

        {/* road casings (slightly wider, behind) */}
        <G stroke={ROAD_CASING} strokeWidth={20} fill="none" strokeLinecap="round">
          <Path d="M0 130 H400" />
          <Path d="M0 420 H400" />
          <Path d="M0 560 H400" />
          <Path d="M120 0 V800" />
          <Path d="M300 0 V800" />
          <Path d="M0 720 C 120 700, 280 740, 400 700" />
        </G>
        {/* roads */}
        <G stroke={ROAD} strokeWidth={13} fill="none" strokeLinecap="round">
          <Path d="M0 130 H400" />
          <Path d="M0 420 H400" />
          <Path d="M0 560 H400" />
          <Path d="M120 0 V800" />
          <Path d="M300 0 V800" />
          <Path d="M0 720 C 120 700, 280 740, 400 700" />
        </G>
        {/* minor roads */}
        <G stroke={ROAD} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.85}>
          <Path d="M60 0 V420" />
          <Path d="M210 130 V800" />
          <Path d="M0 270 H400" />
          <Path d="M0 660 H400" />
        </G>
      </Svg>
    </View>
  );
}
