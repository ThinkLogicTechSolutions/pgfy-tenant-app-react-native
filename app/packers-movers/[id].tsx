import { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Badge, Skeleton } from '@/components/ui';
import { EmptyGeneric } from '@/components/illustrations';
import { packersMoversEnquiryApi, errorMessage, type CreatePackersMoversEnquiryResponse } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { alert } from '@/lib/alertDialog';
import { haptic } from '@/lib/haptics';

export default function PackersMoversEnquiryDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [enquiry, setEnquiry] = useState<CreatePackersMoversEnquiryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    packersMoversEnquiryApi.getPackersMoversEnquiry(id)
      .then(setEnquiry)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const cancelEnquiry = async () => {
    if (!id || !enquiry) return;
    haptic.warning();
    alert('Cancel Request', 'Are you sure you want to cancel this Packers & Movers request?', [
      { text: 'No, keep it', style: 'cancel' },
      { 
        text: 'Yes, Cancel', 
        style: 'destructive', 
        onPress: async () => {
          setCancelling(true);
          try {
            const updated = await packersMoversEnquiryApi.cancelPackersMoversEnquiry(id);
            setEnquiry(updated);
            haptic.success();
          } catch (e) {
            haptic.error();
            alert('Cancellation failed', errorMessage(e));
          } finally {
            setCancelling(false);
          }
        } 
      },
    ]);
  };

  const statusTone = (s: string) => {
    switch (s) {
      case 'SUBMITTED': return 'primary';
      case 'ASSIGNED': return 'success';
      case 'CANCELLED': return 'neutral';
      default: return 'neutral';
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.xs, backgroundColor: palette.background }}>
        <ScreenHeader title="Enquiry Details" />
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.md, gap: spacing.md }}>
          <Skeleton width="100%" height={100} rounded={radius.lg} />
          <Skeleton width="100%" height={200} rounded={radius.lg} />
        </View>
      </View>
    );
  }

  if (error || !enquiry) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.xs, backgroundColor: palette.background }}>
        <ScreenHeader title="Enquiry Details" />
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.base }}>
          <View style={{ alignItems: 'center', gap: spacing.md }}>
            <EmptyGeneric />
            <Text variant="h3">{error || 'Enquiry not found'}</Text>
            <Button label="Go back" variant="outline" onPress={() => router.back()} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs, backgroundColor: palette.background }}>
      <ScreenHeader title="Enquiry Details" />
      
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + 120, paddingTop: spacing.sm, gap: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Summary */}
        <Card style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="overline" color={palette.inkTertiary}>ENQUIRY ID</Text>
            <Badge label={enquiry.status} tone={statusTone(enquiry.status)} small />
          </View>
          <Text variant="h3">PCK-MV-{String(enquiry.id).padStart(3, '0')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calendar-outline" size={16} color={palette.inkSecondary} />
            <Text variant="bodySm" color={palette.inkSecondary}>Submitted: {formatDate(enquiry.created_at)}</Text>
          </View>
        </Card>

        {/* Schedule */}
        <Card style={{ gap: spacing.sm }}>
          <Text variant="overline" color={palette.inkTertiary}>MOVING SCHEDULE</Text>
          <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs }}>
            <View>
              <Text variant="caption" color={palette.inkSecondary}>Date</Text>
              <Text variant="bodyMd" weight="600">{formatDate(enquiry.preferred_date as string)}</Text>
            </View>
            <View>
              <Text variant="caption" color={palette.inkSecondary}>Time</Text>
              <Text variant="bodyMd" weight="600">{enquiry.preferred_time}</Text>
            </View>
          </View>
        </Card>

        {/* Locations */}
        <Card style={{ gap: spacing.md }}>
          <View style={{ gap: spacing.sm }}>
            <Text variant="overline" color={palette.inkTertiary}>PICKUP LOCATION</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Ionicons name="location" size={18} color={palette.navy} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyMd" weight="500">{enquiry.pickup_address}</Text>
                <Text variant="bodySm" color={palette.inkSecondary}>{enquiry.pickup_city}, {enquiry.pickup_state} {enquiry.pickup_pincode}</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: palette.border }} />

          <View style={{ gap: spacing.sm }}>
            <Text variant="overline" color={palette.inkTertiary}>DESTINATION LOCATION</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Ionicons name="location" size={18} color={palette.coral} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyMd" weight="500">{enquiry.destination_address}</Text>
                <Text variant="bodySm" color={palette.inkSecondary}>{enquiry.destination_city}, {enquiry.destination_state} {enquiry.destination_pincode}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Contact Details */}
        <Card style={{ gap: spacing.sm }}>
          <Text variant="overline" color={palette.inkTertiary}>CONTACT DETAILS</Text>
          <View style={{ gap: spacing.xs }}>
            <Text variant="bodyMd" weight="500">{enquiry.contact_name}</Text>
            <Text variant="bodySm" color={palette.inkSecondary}>+91 {enquiry.contact_phone}</Text>
            {enquiry.contact_email ? (
              <Text variant="bodySm" color={palette.inkSecondary}>{enquiry.contact_email}</Text>
            ) : null}
          </View>
        </Card>

        {/* Items */}
        {enquiry.items && enquiry.items.length > 0 && (
          <Card style={{ gap: spacing.md }}>
            <Text variant="overline" color={palette.inkTertiary}>ITEMS TO MOVE</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {enquiry.items.map((item, idx) => (
                <View key={idx} style={{ paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: palette.surfaceRaised, borderRadius: radius.sm, borderWidth: 1, borderColor: palette.border }}>
                  <Text variant="bodySm">{item}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

      </ScrollView>

      {/* Fixed Bottom Action */}
      {enquiry.status === 'SUBMITTED' && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
          <Button 
            label="Cancel Request" 
            variant="danger" 
            full 
            size="lg" 
            loading={cancelling}
            onPress={cancelEnquiry} 
          />
        </View>
      )}
    </View>
  );
}
