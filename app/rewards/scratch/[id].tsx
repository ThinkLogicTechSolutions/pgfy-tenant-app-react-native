/** Scratch card reveal — interactive foil peel. */
import { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { Text, ScreenHeader, Button } from '@/components/ui';
import { ScratchCard } from '@/components/rewards';
import { getOffer, getVendor, isRewardExpired } from '@/data/brandRewards';
import { useRewards } from '@/store/rewards';
import { formatDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';

export default function ScratchReveal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { rewards, revealReward } = useRewards();
  const reward = rewards.find((r) => r.id === id);
  const [revealed, setRevealed] = useState(reward?.status !== 'locked');
  const [couponCode, setCouponCode] = useState(reward?.couponCode);

  useEffect(() => {
    if (reward && reward.status !== 'locked' && reward.couponCode) {
      router.replace(`/rewards/${reward.id}`);
    }
  }, [reward, router]);

  if (!reward) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="bodyMd" color={palette.inkSecondary}>Scratch card not found.</Text>
        <Button label="Back to rewards" variant="outline" onPress={() => router.replace('/rewards')} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  const vendorEarly = getVendor(reward.vendorId);

  if (isRewardExpired(reward) && reward.status === 'locked') {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
        <ScreenHeader title="Scratch card expired" subtitle={vendorEarly?.name} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl }}>
          <Text variant="bodyMd" color={palette.inkSecondary} align="center">
            This scratch card expired before it was opened. Book again to earn new rewards.
          </Text>
          <Button label="Back to rewards" variant="outline" onPress={() => router.replace('/rewards')} style={{ marginTop: spacing.lg }} />
        </View>
      </View>
    );
  }

  const offer = getOffer(reward.offerId);
  const vendor = getVendor(reward.vendorId);
  if (!offer || !vendor) return null;

  const onRevealed = () => {
    if (revealed) return;
    haptic.success();
    const updated = revealReward(reward.id);
    setRevealed(true);
    setCouponCode(updated?.couponCode);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Scratch & win" subtitle={vendor.name} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.base,
          paddingBottom: insets.bottom + spacing.xl,
          alignItems: 'center',
          gap: spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="bodySm" color={palette.inkSecondary} align="center">
          Earned from booking {reward.propertyName} · Redeem by {formatDate(reward.expiresAt)}
        </Text>

        <ScratchCard
          vendor={vendor}
          offer={offer}
          couponCode={couponCode}
          locked={!revealed}
          onRevealed={onRevealed}
        />

        {revealed && couponCode ? (
          <View style={{ width: '100%', gap: spacing.md }}>
            <Button
              label="View redemption steps"
              icon="ticket-outline"
              full
              size="lg"
              onPress={() => router.replace(`/rewards/${reward.id}`)}
            />
            <Button
              label="Back to all rewards"
              variant="outline"
              full
              onPress={() => router.replace('/rewards')}
            />
          </View>
        ) : (
          <Text variant="caption" color={palette.inkTertiary} align="center">
            Swipe across the card or tap to scratch
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
