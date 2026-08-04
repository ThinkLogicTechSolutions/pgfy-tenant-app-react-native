import { View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/theme';
import { Text, Card, PressableScale } from '@/components/ui';
import {
  getOffer,
  getVendor,
  VENDOR_CATEGORY_ICON,
  type TenantReward,
} from '@/data/brandRewards';
import { formatDate } from '@/lib/format';

export function RewardListCard({
  reward,
  onPress,
}: {
  reward: TenantReward;
  onPress?: () => void;
}) {
  const offer = getOffer(reward.offerId);
  const vendor = getVendor(reward.vendorId);
  if (!offer || !vendor) return null;

  const locked = reward.status === 'locked';
  const expired = reward.status === 'expired';
  const icon = VENDOR_CATEGORY_ICON[vendor.category] as keyof typeof Ionicons.glyphMap;

  return (
    <PressableScale onPress={onPress} scaleTo={0.99} disabled={!onPress}>
      <Card style={{ opacity: expired ? 0.65 : 1 }}>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ width: 56, height: 56, borderRadius: radius.md, overflow: 'hidden', backgroundColor: palette.surfaceRaised }}>
            {locked ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.navyTint }}>
                <Ionicons name="gift-outline" size={26} color={palette.navy} />
              </View>
            ) : (
              <Image source={{ uri: vendor.logo }} style={{ width: 56, height: 56 }} contentFit="cover" />
            )}
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
              <Text variant="bodyMd" weight="700" numberOfLines={1} style={{ flex: 1 }}>
                {locked ? 'Scratch card' : offer.title}
              </Text>
              {locked ? (
                <View style={{ backgroundColor: palette.coralTint, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
                  <Text variant="caption" weight="700" color={palette.coralDark}>NEW</Text>
                </View>
              ) : null}
            </View>
            <Text variant="caption" color={palette.inkTertiary} numberOfLines={1}>
              {vendor.name} · {vendor.category}
            </Text>
            {!locked && reward.couponCode ? (
              <Text variant="caption" weight="600" mono color={palette.navy}>{reward.couponCode}</Text>
            ) : (
              <Text variant="caption" color={palette.inkSecondary} numberOfLines={2}>
                {locked ? 'Scratch to reveal your partner reward' : offer.description}
              </Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Ionicons name={icon} size={12} color={palette.inkTertiary} />
              <Text variant="caption" color={expired ? palette.danger : palette.inkTertiary}>
                {expired ? 'Expired' : `Redeem by ${formatDate(reward.expiresAt)}`}
              </Text>
            </View>
          </View>
          {onPress ? <Ionicons name="chevron-forward" size={18} color={palette.inkTertiary} /> : null}
        </View>
      </Card>
    </PressableScale>
  );
}
