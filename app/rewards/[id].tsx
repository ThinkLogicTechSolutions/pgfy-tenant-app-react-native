/** Revealed brand reward — coupon code & redemption. */
import { View, ScrollView, Share, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Divider } from '@/components/ui';
import { getOffer, getVendor } from '@/data/brandRewards';
import { useRewards } from '@/store/rewards';
import { formatDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';

export default function RewardDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { rewards, markRedeemed } = useRewards();
  const reward = rewards.find((r) => r.id === id);

  if (!reward || !reward.couponCode) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="bodyMd" color={palette.inkSecondary}>Reward not found.</Text>
        <Button label="Go to rewards" variant="outline" onPress={() => router.replace('/rewards')} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  const offer = getOffer(reward.offerId);
  const vendor = getVendor(reward.vendorId);
  if (!offer || !vendor) return null;

  const shareCode = async () => {
    haptic.light();
    await Share.share({ message: `${offer.title}\nCode: ${reward.couponCode}\nRedeem at ${vendor.name}` });
  };

  const openVendor = () => {
    Linking.openURL(vendor.websiteUrl).catch(() => {
      Alert.alert('Could not open link', vendor.websiteUrl);
    });
  };

  const markUsed = () => {
    markRedeemed(reward.id);
    haptic.success();
    Alert.alert('Marked as used', 'This reward has been moved to your history.');
    router.back();
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title={vendor.name} subtitle={offer.title} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.base,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.base,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ overflow: 'hidden', padding: 0 }}>
          <Image source={{ uri: offer.bannerImage }} style={{ width: '100%', height: 140 }} contentFit="cover" />
          <View style={{ padding: spacing.base, gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Image source={{ uri: vendor.logo }} style={{ width: 40, height: 40, borderRadius: 20 }} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text variant="bodyMd" weight="700">{offer.title}</Text>
                <Text variant="caption" color={palette.inkTertiary}>{vendor.category}</Text>
              </View>
            </View>
            <Text variant="bodySm" color={palette.inkSecondary}>{offer.description}</Text>
          </View>
        </Card>

        <Card style={{ alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm }}>
          <Text variant="overline" color={palette.inkTertiary}>COUPON CODE</Text>
          <Text variant="h2" mono color={palette.navy}>{reward.couponCode}</Text>
          <Text variant="caption" color={palette.inkTertiary}>
            Valid till {formatDate(reward.expiresAt)}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, width: '100%' }}>
            <Button label="Share code" icon="share-outline" variant="outline" onPress={shareCode} full />
            <Button label="Open app" icon="open-outline" onPress={openVendor} full />
          </View>
        </Card>

        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>
            HOW TO REDEEM
          </Text>
          <Text variant="bodySm" color={palette.inkSecondary}>{offer.redemptionInstructions}</Text>
          <Divider style={{ marginVertical: spacing.md }} />
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>
            TERMS
          </Text>
          <Text variant="caption" color={palette.inkTertiary}>{offer.terms}</Text>
        </Card>

        {reward.status === 'revealed' ? (
          <Button label="Mark as used" variant="ghost" icon="checkmark-circle-outline" full onPress={markUsed} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Ionicons name="checkmark-circle" size={18} color={palette.success} />
            <Text variant="bodySm" color={palette.success} weight="600">Redeemed</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
