/** Reward details bottom sheet — coupon code + redemption info for an already-scratched
 * reward. Scratching itself happens in `ScratchDialog`, not here; this sheet only ever shows
 * a reward that already has a drawn coupon. Real `/tenant/rewards` API throughout. */
import { useEffect, useState } from 'react';
import { View, Linking, Share } from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Sheet, Button, PressableScale, IconButton, Skeleton } from '@/components/ui';
import { rewardsApi, errorMessage, type ApiReward, type ApiRewardDetail } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { alert } from '@/lib/alertDialog';
import { toast } from '@/lib/toast';

type Props = {
  reward: ApiReward | null;
  visible: boolean;
  onClose: () => void;
  /** Hands the sheet a detail it already has (e.g. straight from a just-completed scratch) so
   * it can skip the redundant re-fetch — must match `reward.id` to be used. */
  initialDetail?: ApiRewardDetail | null;
  /** Fires whenever the reward's server state changes (redeemed) so the caller (the list) can
   * patch its local copy without a full re-fetch. */
  onUpdated: (updated: ApiRewardDetail) => void;
};

export function RewardSheet({ reward, visible, onClose, initialDetail, onUpdated }: Props) {
  const [detail, setDetail] = useState<ApiRewardDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!reward || !visible) return;
    setCopied(false);
    if (initialDetail && initialDetail.id === reward.id) {
      setDetail(initialDetail);
      return;
    }
    let active = true;
    setLoadingDetail(true);
    rewardsApi.getReward(reward.id)
      .then((d) => { if (active) setDetail(d); })
      .catch(() => {})
      .finally(() => { if (active) setLoadingDetail(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reward?.id, visible]);

  if (!reward) {
    return <Sheet visible={visible} onClose={onClose} title="Reward" scroll>{null}</Sheet>;
  }

  const offer = reward.offer;
  const vendor = offer.vendor;
  const couponCode = detail?.coupon?.code;
  const alreadyRedeemed = detail?.coupon?.status === 'REDEEMED';

  const copyCode = async () => {
    if (!couponCode) return;
    await Clipboard.setStringAsync(couponCode);
    haptic.success();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOffer = async () => {
    haptic.light();
    const url = detail?.offer_url ?? offer.offer_url;
    const lines = [
      `🎁 ${offer.title} on PGfy`,
      `Partner: ${vendor.name}`,
      couponCode ? `Use code: ${couponCode}` : undefined,
      url ? `Redeem here: ${url}` : undefined,
      'Get rewards like this on PGfy — pgfy.in/app',
    ].filter(Boolean) as string[];
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      // user dismissed the share sheet
    }
  };

  const redeemNow = async () => {
    if (couponCode) {
      await Clipboard.setStringAsync(couponCode);
      haptic.success();
      toast.success('Code copied — paste it at checkout');
    }
    const url = detail?.offer_url ?? offer.offer_url;
    if (!url) return;
    Linking.openURL(url).catch(() => {
      alert('Could not open link', url);
    });
  };

  const openTerms = () => {
    const url = vendor.website;
    if (!url) return;
    Linking.openURL(url).catch(() => {
      alert('Could not open link', url);
    });
  };

  const markRedeemed = async () => {
    if (!detail || redeeming) return;
    setRedeeming(true);
    try {
      const res = await rewardsApi.redeemReward(reward.id);
      haptic.success();
      setDetail(res);
      onUpdated(res);
    } catch (e) {
      haptic.error();
      alert("Couldn't update this reward", errorMessage(e));
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={vendor.name}
      titleRight={
        couponCode ? (
          <IconButton icon="share-social-outline" size={18} color={palette.coralDark} bg={palette.coralTint} style={{ width: 36, height: 36, borderColor: 'transparent' }} onPress={shareOffer} />
        ) : undefined
      }
      scroll
    >
      <View style={{ gap: spacing.lg }}>
        {offer.banner?.link ? (
          <Image source={{ uri: offer.banner.link }} style={{ width: '100%', height: 160, borderRadius: radius.lg }} contentFit="cover" />
        ) : null}

        <View style={{ gap: spacing.xs }}>
          <Text variant="h3">{offer.title}</Text>
          <Text variant="caption" color={palette.inkTertiary}>
            {reward.is_expired ? `Expired ${formatDate(reward.expiry_date)}` : `Valid till ${formatDate(reward.expiry_date)}`}
          </Text>
        </View>

        {loadingDetail ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton width="100%" height={56} rounded={radius.md} />
            <Skeleton width="100%" height={44} rounded={radius.md} />
            <Skeleton width="80%" height={16} />
          </View>
        ) : couponCode ? (
          <>
            <View style={{ backgroundColor: palette.surfaceRaised, borderRadius: radius.md, padding: spacing.base, gap: spacing.sm }}>
              <Text variant="overline" color={palette.inkTertiary}>COUPON CODE</Text>
              <PressableScale onPress={copyCode} scaleTo={0.98}>
                <View
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: palette.surface, borderRadius: radius.md, borderWidth: 1.5,
                    borderColor: palette.border, borderStyle: 'dashed', paddingHorizontal: spacing.base, paddingVertical: spacing.md,
                  }}
                >
                  <Text variant="h3" mono color={palette.navy}>{couponCode}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={20} color={copied ? palette.success : palette.coralDark} />
                    <Text variant="bodySm" weight="600" color={copied ? palette.success : palette.coralDark}>{copied ? 'Copied' : 'Copy'}</Text>
                  </View>
                </View>
              </PressableScale>
            </View>

            <Button label="Redeem now" icon="open-outline" full size="lg" onPress={redeemNow} />

            <View style={{ gap: spacing.sm }}>
              <Text variant="overline" color={palette.inkTertiary}>HOW TO USE</Text>
              <Text variant="bodySm" color={palette.inkSecondary}>{detail?.redemption_instructions ?? offer.redemption_instructions}</Text>
            </View>

            <View style={{ gap: spacing.sm }}>
              <Text variant="overline" color={palette.inkTertiary}>OFFER TERMS & CONDITIONS</Text>
              <Text variant="bodySm" color={palette.inkSecondary}>{detail?.t_and_c ?? offer.t_and_c}</Text>
              <PressableScale onPress={openTerms} scaleTo={0.98}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs }}>
                  <Ionicons name="link-outline" size={16} color={palette.coralDark} />
                  <Text variant="bodySm" weight="600" color={palette.coralDark} numberOfLines={2}>View partner website</Text>
                </View>
              </PressableScale>
            </View>

            {alreadyRedeemed ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons name="checkmark-circle" size={18} color={palette.success} />
                <Text variant="bodySm" color={palette.success} weight="600">Already redeemed</Text>
              </View>
            ) : (
              <Button
                label="I have already redeemed it"
                variant="ghost"
                icon="checkmark-circle-outline"
                full
                loading={redeeming}
                onPress={markRedeemed}
              />
            )}
          </>
        ) : null}
      </View>
    </Sheet>
  );
}
