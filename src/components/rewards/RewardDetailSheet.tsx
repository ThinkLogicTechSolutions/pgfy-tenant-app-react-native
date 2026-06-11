/** Reward detail bottom sheet — scratch, coupon code & redemption steps. */
import { useEffect, useState } from 'react';
import { View, Linking, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Sheet, Button, PressableScale } from '@/components/ui';
import { ScratchCard } from './ScratchCard';
import {
  getOffer,
  getVendor,
  isRewardExpired,
  isRewardOpened,
  type TenantReward,
} from '@/data/brandRewards';
import { useRewards } from '@/store/rewards';
import { formatDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';

type Props = {
  reward: TenantReward | null;
  visible: boolean;
  onClose: () => void;
};

export function RewardDetailSheet({ reward, visible, onClose }: Props) {
  const { revealReward, markRedeemed } = useRewards();
  const [couponCode, setCouponCode] = useState<string | undefined>();
  const [opened, setOpened] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!reward) return;
    setOpened(isRewardOpened(reward));
    setCouponCode(reward.couponCode);
    setCopied(false);
  }, [reward?.id, reward?.status, reward?.couponCode]);

  if (!reward) {
    return <Sheet visible={visible} onClose={onClose} title="Reward" scroll>{null}</Sheet>;
  }

  const offer = getOffer(reward.offerId);
  const vendor = getVendor(reward.vendorId);
  if (!offer || !vendor) return null;

  const expired = isRewardExpired(reward);
  const locked = !opened;
  const lockedExpired = locked && expired;

  const onRevealed = () => {
    if (opened) return;
    haptic.success();
    const updated = revealReward(reward.id);
    setOpened(true);
    setCouponCode(updated?.couponCode);
  };

  const copyCode = async () => {
    if (!couponCode) return;
    await Clipboard.setStringAsync(couponCode);
    haptic.success();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openTerms = () => {
    Linking.openURL(offer.termsUrl).catch(() => {
      Alert.alert('Could not open link', offer.termsUrl);
    });
  };

  const redeemNow = async () => {
    if (!couponCode) return;
    await Clipboard.setStringAsync(couponCode);
    haptic.success();
    setCopied(true);
    Linking.openURL(offer.offerUrl).catch(() => {
      Alert.alert('Could not open offer', 'Coupon code was copied. Open the partner app manually to redeem.');
    });
  };

  const markUsed = () => {
    markRedeemed(reward.id);
    haptic.success();
    Alert.alert('Marked as used', 'This reward has been moved to your history.');
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={vendor.name} scroll>
      <View style={{ gap: spacing.lg }}>
        <Image
          source={{ uri: offer.bannerImage }}
          style={{ width: '100%', height: 160, borderRadius: radius.lg }}
          contentFit="cover"
        />

        <View style={{ gap: spacing.xs }}>
          <Text variant="h3">{offer.title}</Text>
          <Text variant="caption" color={palette.inkTertiary}>
            {expired ? `Expired ${formatDate(reward.expiresAt)}` : `Valid till ${formatDate(reward.expiresAt)}`}
          </Text>
        </View>

        {lockedExpired ? (
          <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md }}>
            <Ionicons name="time-outline" size={36} color={palette.danger} />
            <Text variant="bodyMd" weight="600" align="center">This scratch card expired</Text>
            <Text variant="bodySm" color={palette.inkSecondary} align="center">
              It was not opened before {formatDate(reward.expiresAt)}. Book a stay to earn new rewards.
            </Text>
          </View>
        ) : locked ? (
          <View style={{ alignItems: 'center', gap: spacing.md }}>
            <ScratchCard vendor={vendor} offer={offer} locked onRevealed={onRevealed} />
            <Text variant="caption" color={palette.inkTertiary} align="center">
              Swipe or tap to scratch and reveal your coupon code
            </Text>
          </View>
        ) : (
          <>
            <View
              style={{
                backgroundColor: palette.surfaceRaised,
                borderRadius: radius.md,
                padding: spacing.base,
                gap: spacing.sm,
              }}
            >
              <Text variant="overline" color={palette.inkTertiary}>COUPON CODE</Text>
              <PressableScale onPress={copyCode} scaleTo={0.98}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: palette.surface,
                    borderRadius: radius.md,
                    borderWidth: 1.5,
                    borderColor: palette.border,
                    borderStyle: 'dashed',
                    paddingHorizontal: spacing.base,
                    paddingVertical: spacing.md,
                  }}
                >
                  <Text variant="h3" mono color={palette.navy}>{couponCode}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons
                      name={copied ? 'checkmark-circle' : 'copy-outline'}
                      size={20}
                      color={copied ? palette.success : palette.coralDark}
                    />
                    <Text variant="bodySm" weight="600" color={copied ? palette.success : palette.coralDark}>
                      {copied ? 'Copied' : 'Copy'}
                    </Text>
                  </View>
                </View>
              </PressableScale>
            </View>

            <Button
              label="Redeem now"
              icon="open-outline"
              full
              size="lg"
              disabled={!couponCode || expired}
              onPress={redeemNow}
            />

            <View style={{ gap: spacing.sm }}>
              <Text variant="overline" color={palette.inkTertiary}>HOW TO USE</Text>
              <Text variant="bodySm" color={palette.inkSecondary}>
                {offer.redemptionInstructions}
              </Text>
            </View>

            <View style={{ gap: spacing.sm }}>
              <Text variant="overline" color={palette.inkTertiary}>OFFER TERMS & CONDITIONS</Text>
              <Text variant="bodySm" color={palette.inkSecondary}>{offer.terms}</Text>
              <PressableScale onPress={openTerms} scaleTo={0.98}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs }}>
                  <Ionicons name="link-outline" size={16} color={palette.coralDark} />
                  <Text variant="bodySm" weight="600" color={palette.coralDark} numberOfLines={2}>
                    View full terms & conditions
                  </Text>
                </View>
              </PressableScale>
            </View>

            {reward.status === 'revealed' && !expired ? (
              <Button label="Mark as used" variant="ghost" icon="checkmark-circle-outline" full onPress={markUsed} />
            ) : reward.status === 'redeemed' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons name="checkmark-circle" size={18} color={palette.success} />
                <Text variant="bodySm" color={palette.success} weight="600">Already used</Text>
              </View>
            ) : null}
          </>
        )}
      </View>
    </Sheet>
  );
}
