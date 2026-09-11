import { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Badge, Button, ErrorState } from '@/components/ui';
import { storageSolutionApi, errorMessage } from '@/lib/api';
import type { StorageSolutionEnquiryResponse } from '@/lib/api/types';
import { formatDate } from '@/lib/format';

export default function StorageSolutionDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [enquiry, setEnquiry] = useState<StorageSolutionEnquiryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = () => {
    setLoading(true);
    setError(null);
    storageSolutionApi.getStorageSolutionEnquiry(id)
      .then(setEnquiry)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Enquiry',
      'Are you sure you want to cancel this storage request?',
      [
        { text: 'No, keep it', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: () => {
            setCancelling(true);
            storageSolutionApi.cancelStorageSolutionEnquiry(id)
              .then((updated) => setEnquiry(updated))
              .catch((e) => Alert.alert('Error', errorMessage(e)))
              .finally(() => setCancelling(false));
          }
        }
      ]
    );
  };

  const statusTone = (s: string) => {
    switch (s) {
      case 'SUBMITTED': return 'info';
      case 'ASSIGNED': return 'success';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'danger';
      default: return 'neutral';
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.background, paddingTop: insets.top + spacing.xs }}>
        <ScreenHeader title="Request Details" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={palette.coral} size="large" />
        </View>
      </View>
    );
  }

  if (error || !enquiry) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.background, paddingTop: insets.top + spacing.xs }}>
        <ScreenHeader title="Request Details" />
        <ErrorState message={error || 'Enquiry not found'} onRetry={loadDetails} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.background, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Request Details" />

      <ScrollView 
        contentContainerStyle={{ 
          padding: spacing.base, 
          paddingBottom: insets.bottom + 120, // Space for cancel button
          gap: spacing.lg 
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: palette.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
            <View>
              <Text variant="overline" color={palette.inkTertiary}>REQUEST ID</Text>
              <Text variant="h3" style={{ marginTop: 2 }}>STR-SOL-{String(enquiry.id).padStart(3, '0')}</Text>
            </View>
            <Badge label={enquiry.status} tone={statusTone(enquiry.status)} />
          </View>
          <Text variant="caption" color={palette.inkSecondary}>
            Submitted on {formatDate(enquiry.created_at)}
          </Text>
        </View>

        {/* Storage Duration */}
        <View style={{ gap: spacing.sm }}>
          <Text variant="h3">Storage Duration</Text>
          <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: palette.border, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.blueTint, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="calendar" size={20} color={palette.blue} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="caption" color={palette.inkSecondary}>From</Text>
                <Text variant="bodyMd" weight="600">{formatDate(enquiry.start_date)} ({enquiry.start_time})</Text>
              </View>
              <View style={{ height: 1, backgroundColor: palette.border, marginVertical: 4 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="caption" color={palette.inkSecondary}>To</Text>
                <Text variant="bodyMd" weight="600">{formatDate(enquiry.end_date)} ({enquiry.end_time})</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Assigned Property */}
        {enquiry.assigned_property ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="h3">Assigned Property</Text>
            <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: palette.primary }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="business" size={20} color={palette.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMd" weight="600">{enquiry.assigned_property.name}</Text>
                  <Text variant="caption" color={palette.inkSecondary}>Code: {enquiry.assigned_property.code}</Text>
                </View>
              </View>
              
              <View style={{ height: 1, backgroundColor: palette.border, marginBottom: spacing.md }} />
              
              <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.xs }}>PROPERTY OWNER</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 }}>
                <Ionicons name="person-circle-outline" size={16} color={palette.inkSecondary} />
                <Text variant="bodyMd">{enquiry.assigned_property.owner.name}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Ionicons name="call-outline" size={16} color={palette.inkSecondary} />
                <Text variant="bodyMd">{enquiry.assigned_property.owner.phone}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Location Details */}
        <View style={{ gap: spacing.sm }}>
          <Text variant="h3">Location</Text>
          <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: palette.border, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.coralTint, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="location" size={20} color={palette.coral} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMd" weight="600">{enquiry.locality_name}</Text>
              <Text variant="caption" color={palette.inkSecondary}>{enquiry.city_name}, {enquiry.state_name}</Text>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={{ gap: spacing.sm }}>
          <Text variant="h3">Contact Info</Text>
          <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: palette.border, gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="person-outline" size={16} color={palette.inkSecondary} />
              <Text variant="bodyMd">{enquiry.contact_name}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="call-outline" size={16} color={palette.inkSecondary} />
              <Text variant="bodyMd">{enquiry.contact_phone}</Text>
            </View>
            {enquiry.contact_email ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Ionicons name="mail-outline" size={16} color={palette.inkSecondary} />
                <Text variant="bodyMd">{enquiry.contact_email}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Items */}
        {enquiry.items && enquiry.items.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <Text variant="h3">Items to Store ({enquiry.items.length})</Text>
            <View style={{ gap: spacing.sm }}>
              {enquiry.items.map((item, idx) => (
                <View key={idx} style={{ backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: palette.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text variant="bodyMd" weight="600">{item.name}</Text>
                    <View style={{ backgroundColor: palette.coral, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill }}>
                      <Text variant="bodySm" weight="600" color={palette.white}> X{item.quantity} </Text>
                    </View>
                  </View>
                  <Text variant="caption" color={palette.inkSecondary}>Category: {item.category}</Text>
                  {item.weight ? <Text variant="caption" color={palette.inkSecondary}>Weight: {item.weight} kg</Text> : null}
                  {item.description ? (
                    <Text variant="caption" color={palette.inkSecondary} style={{ marginTop: 4 }}>{item.description}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {enquiry.notes ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="h3">Additional Notes</Text>
            <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: palette.border }}>
              <Text variant="bodyMd" color={palette.inkSecondary}>{enquiry.notes}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Fixed Cancel Button */}
      {enquiry.status !== 'CANCELLED' && enquiry.status !== 'COMPLETED' && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
          <Button 
            label="Cancel Request" 
             
            full 
            size="lg" 
            onPress={handleCancel}
            loading={cancelling}
          />
        </View>
      )}
    </View>
  );
}
