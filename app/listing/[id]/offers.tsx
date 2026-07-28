/** All real booking coupons for this property (billing_api.md) — pick one and return to
 *  review booking. */
import { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, EmptyState } from '@/components/ui';
import { couponsApi, errorMessage, type ApiCoupon } from '@/lib/api';
import { isCouponUsable, couponDiscountAmount } from '@/lib/billing';
import { inr } from '@/lib/format';
import { haptic } from '@/lib/haptics';

export default function BookingOffers() {
  const { id, room, bed, rent, sharing, appliedCode, checkIn, checkOut, propertyId } = useLocalSearchParams<{
    id: string;
    room?: string;
    bed?: string;
    rent?: string;
    sharing?: string;
    appliedCode?: string;
    checkIn?: string;
    checkOut?: string;
    propertyId?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const active = (appliedCode ?? '').toUpperCase();
  const base = Number(rent ?? 0);

  const [coupons, setCoupons] = useState<ApiCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    const pid = Number(propertyId);
    if (!Number.isFinite(pid)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    couponsApi.listCoupons({ propertyId: pid })
      .then((list) => setCoupons(list.filter(isCouponUsable)))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [propertyId]);

  const apply = (coupon: ApiCoupon) => {
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
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={palette.coral} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {coupons.length === 0 ? (
            <EmptyState
              title={error ? "Couldn't load offers" : 'No offers available'}
              message={error ?? 'Check back later for new coupons.'}
              actionLabel={error ? 'Retry' : undefined}
              onAction={error ? load : undefined}
            />
          ) : (
            coupons.map((coupon) => {
              const isApplied = active === coupon.code;
              const savings = couponDiscountAmount(coupon, base);
              return (
                <Card key={coupon.id}>
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
                      <Text variant="bodyMd" weight="700">
                        {coupon.discount_type === 'PERCENTAGE' ? `${coupon.discount_amount}% off` : `${inr(coupon.discount_amount)} off`}
                      </Text>
                      {coupon.description ? <Text variant="bodySm" color={palette.inkSecondary}>{coupon.description}</Text> : null}
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
                      {base > 0 ? <Text variant="caption" color={palette.success} weight="600">Save {inr(savings)}</Text> : null}
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
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
