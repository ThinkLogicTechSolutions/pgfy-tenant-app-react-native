/** Compact scratch card tile for the Rewards grid. */
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/theme';
import { Text, PressableScale } from '@/components/ui';
import type { ApiReward } from '@/lib/api';

type Props = {
  reward: ApiReward;
  width: number;
  onPress?: () => void;
};

export function ScratchCardTile({ reward, width, onPress }: Props) {
  const height = width * 1.2;
  const offer = reward.offer;
  const vendor = offer.vendor;
  const locked = reward.status === 'LOCKED';
  const expired = reward.is_expired;

  return (
    <PressableScale
      onPress={expired ? undefined : onPress}
      scaleTo={0.97}
      disabled={!onPress || expired}
      style={{ width, marginBottom: spacing.md }}
    >
      <View style={[styles.card, { width, height, opacity: expired ? 0.72 : 1 }]}>
        {!locked ? (
          <>
            {offer.banner?.link ? <Image source={{ uri: offer.banner.link }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
            <LinearGradient
              colors={['transparent', 'rgba(1,38,78,0.92)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.footer}>
              {vendor.logo?.link ? <Image source={{ uri: vendor.logo.link }} style={styles.logo} contentFit="cover" /> : null}
              <Text variant="caption" weight="700" color={palette.white} numberOfLines={2}>
                {offer.title}
              </Text>
              {reward.coupon?.code ? (
                <Text variant="caption" mono color="rgba(255,255,255,0.9)" numberOfLines={1}>
                  {reward.coupon.code}
                </Text>
              ) : null}
            </View>
          </>
        ) : (
          <LinearGradient
            colors={['#C8CDD6', '#E4E8EE', '#B0B8C4', '#D8DCE3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.lockedBody}>
              <Ionicons name="gift" size={32} color={palette.navy} />
              <Text variant="caption" weight="700" color={palette.navy} style={{ marginTop: spacing.sm }}>
                Scratch me
              </Text>
            </View>
          </LinearGradient>
        )}

        {expired ? (
          <View style={styles.expiredOverlay}>
            <View style={styles.expiredBadge}>
              <Text variant="caption" weight="700" color={palette.white}>EXPIRED</Text>
            </View>
          </View>
        ) : locked ? (
          <View style={styles.newBadge}>
            <Text variant="caption" weight="700" color={palette.coralDark}>NEW</Text>
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.surfaceRaised,
  },
  lockedBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.sm,
    gap: 4,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.white,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: palette.coralTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  expiredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,36,59,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiredBadge: {
    backgroundColor: palette.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
