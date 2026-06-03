/** All booking coupons — pick one and return to review booking. */
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button } from '@/components/ui';
import { COUPONS, type Coupon } from '@/data/coupons';
import { inr } from '@/lib/format';
import { haptic } from '@/lib/haptics';

export default function BookingOffers() {
  const { id, room, bed, rent, sharing, appliedCode, checkIn, checkOut } = useLocalSearchParams<{
    id: string;
    room?: string;
    bed?: string;
    rent?: string;
    sharing?: string;
    appliedCode?: string;
    checkIn?: string;
    checkOut?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const active = (appliedCode ?? '').toUpperCase();

  const apply = (coupon: Coupon) => {
    haptic.success();
    router.replace({
      pathname: `/listing/${id}/book`,
      params: {
        room: room ?? '',
        bed: bed ?? '',
        rent: rent ?? '',
        sharing: sharing ?? '',
        appliedCode: coupon.code,
        checkIn: checkIn ?? '',
        checkOut: checkOut ?? '',
      },
    });
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Offers & coupons" subtitle="Apply one offer to this booking" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {COUPONS.map((coupon) => {
          const isApplied = active === coupon.code;
          return (
            <Card key={coupon.code}>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radius.md,
                    backgroundColor: palette.coralTint,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="pricetag" size={20} color={palette.coralDark} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text variant="bodyMd" weight="700">{coupon.title}</Text>
                  <Text variant="bodySm" color={palette.inkSecondary}>{coupon.description}</Text>
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: 4,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderStyle: 'dashed',
                      borderColor: palette.borderStrong,
                      backgroundColor: palette.surfaceRaised,
                    }}
                  >
                    <Text variant="caption" weight="700" mono color={palette.navy}>{coupon.code}</Text>
                  </View>
                  <Text variant="caption" color={palette.success} weight="600">Save {inr(coupon.discount)}</Text>
                </View>
              </View>
              <Button
                label={isApplied ? 'Applied' : 'Apply'}
                variant={isApplied ? 'subtle' : 'primary'}
                full
                size="md"
                disabled={isApplied}
                onPress={() => apply(coupon)}
                style={{ marginTop: spacing.md }}
              />
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}
