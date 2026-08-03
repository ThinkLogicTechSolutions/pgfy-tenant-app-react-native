/** Brand mark — uses the local logo asset so it renders crisp & offline. */
import { View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { palette } from '@/theme';
import { Text } from '../ui/Text';

const TILE = require('../../../assets/images/logo-mark.png');
const WHITE = require('../../../assets/images/splash-icon.png');

export function PgfyMark({ size = 72, variant = 'tile' }: { size?: number; variant?: 'tile' | 'white' }) {
  return (
    <Image
      source={variant === 'tile' ? TILE : WHITE}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}

/** Wordmark lockup: mark + "PGfy" + tagline. */
export function PgfyLockup({ light }: { light?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 14 }}>
      <PgfyMark size={88} variant={light ? 'white' : 'tile'} />
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Text variant="display" color={light ? palette.white : palette.coral}>
          PGfy
        </Text>
        <Text variant="bodySm" color={light ? 'rgba(255,255,255,0.85)' : palette.inkSecondary}>
          Smart Living, Simplified
        </Text>
      </View>
    </View>
  );
}

/** A small inline house+person glyph in any color (for badges/headers). */
export function HouseGlyph({ size = 24, color = palette.coral }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M16 44 L50 18 L84 44"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path d="M28 42 L28 78 M72 42 L72 78" stroke={color} strokeWidth={8} strokeLinecap="round" fill="none" />
      <Path
        d="M50 44 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 Z M36 78 a14 12 0 0 1 28 0 Z"
        fill={color}
      />
    </Svg>
  );
}
