import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { palette, spacing, fontFamily } from '@/theme';
import { Text } from '@/components/ui';

interface Props {
  /** Extend to screen edges when the parent has horizontal padding. */
  bleed?: boolean;
}

export function CraftedFooter({ bleed = false }: Props) {
  return (
    <View
      style={{
        marginTop: spacing['2xl'],
        ...(bleed ? { marginHorizontal: -spacing.base } : {}),
        paddingHorizontal: bleed ? spacing.lg : 0,
        paddingTop: spacing['2xl'],
        paddingBottom: spacing['3xl'],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Text
          style={{
            fontFamily: fontFamily.extrabold,
            fontSize: 36,
            lineHeight: 44,
            letterSpacing: -1,
            color: palette.inkTertiary,
          }}
        >
          Made with
        </Text>
        <Ionicons name="heart" size={32} color={palette.coral} />
      </View>
      <Text
        variant="bodySm"
        color={palette.inkTertiary}
        style={{ marginTop: spacing.xs, fontFamily: fontFamily.medium }}
      >
        Crafted in Bengaluru
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 10,
          marginBottom: 10,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
        <Svg width={14} height={10} viewBox="0 0 14 10" style={{ marginLeft: 4 }}>
          <Path
            d="M0 5 H9 M7 2 L12 5 L7 8"
            stroke={palette.borderStrong}
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>

      <Text
        style={{
          fontFamily: fontFamily.bold,
          fontSize: 26,
          lineHeight: 30,
          letterSpacing: -0.6,
          color: palette.inkTertiary,
        }}
      >
        PGfy
      </Text>
    </View>
  );
}
