/** Fullscreen semi-transparent dialog — the only place an unscratched, non-expired reward can
 * actually be scratched. Shows nothing but the scratch card itself; crossing the reveal
 * threshold calls the real scratch API, then hands the revealed detail back to the caller,
 * which closes this dialog and opens the reward details sheet. */
import { useState } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { Text, Button, IconButton } from '@/components/ui';
import { ScratchCard } from './ScratchCard';
import { rewardsApi, errorMessage, type ApiReward, type ApiRewardDetail } from '@/lib/api';
import { haptic } from '@/lib/haptics';

type Props = {
  reward: ApiReward | null;
  visible: boolean;
  onClose: () => void;
  /** Fires once the real scratch API call succeeds — the caller closes this dialog and opens
   * the reward details sheet with the revealed data. */
  onRevealed: (detail: ApiRewardDetail) => void;
};

export function ScratchDialog({ reward, visible, onClose, onRevealed }: Props) {
  const insets = useSafeAreaInsets();
  const [scratching, setScratching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!reward) return null;

  const doScratch = async () => {
    if (scratching) return;
    setScratching(true);
    setError(null);
    try {
      const res = await rewardsApi.scratchReward(reward.id);
      haptic.success();
      onRevealed(res);
    } catch (e) {
      haptic.error();
      setError(errorMessage(e));
    } finally {
      setScratching(false);
    }
  };

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <IconButton
          icon="close"
          size={20}
          color={palette.white}
          bg="rgba(255,255,255,0.16)"
          onPress={onClose}
          style={{ position: 'absolute', top: insets.top + spacing.sm, right: spacing.base, borderColor: 'transparent' }}
        />
        <View style={styles.center}>
          <ScratchCard
            bannerUrl={reward.offer.banner?.link ?? ''}
            vendorLogoUrl={reward.offer.vendor.logo?.link}
            offerTitle={reward.offer.title}
            locked
            revealing={scratching}
            onThresholdReached={doScratch}
          />
          <Text variant="bodySm" color="rgba(255,255,255,0.85)" align="center" style={{ marginTop: spacing.lg }}>
            Scratch the card to reveal your coupon
          </Text>
          {error ? (
            <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg }}>
              <Text variant="bodySm" color={palette.danger} align="center">{error}</Text>
              <Button label="Try again" variant="primary" onPress={doScratch} />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,42,73,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
});
