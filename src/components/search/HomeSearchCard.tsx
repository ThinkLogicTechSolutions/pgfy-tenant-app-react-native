/** Home search card — stay type, location, and conditional date fields. */
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius, shadows } from '@/theme';
import { Text, Button, SegmentedControl } from '@/components/ui';
import { LocationSearchTrigger } from './LocationAutocomplete';
import { StayBookingFields, type StayBookingValues } from './StayBookingFields';
import type { BookingMode } from '@/data/types';

const STAY_SEGMENTS = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'daily', label: 'Daily' },
  { key: 'hourly', label: 'Hourly' },
];

interface Props {
  stayType: BookingMode;
  onStayTypeChange: (mode: BookingMode) => void;
  location: string;
  onLocationPress: () => void;
  stayValues: StayBookingValues;
  onStayValuesChange: (values: StayBookingValues) => void;
  onSearch: () => void;
  searchDisabled?: boolean;
}

export function HomeSearchCard({
  stayType,
  onStayTypeChange,
  location,
  onLocationPress,
  stayValues,
  onStayValuesChange,
  onSearch,
  searchDisabled,
}: Props) {
  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: palette.border,
        padding: spacing.base,
        gap: spacing.md,
        ...shadows.card,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: palette.navyTint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="search" size={20} color={palette.navy} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="h3">Find your stay</Text>
          <Text variant="caption" color={palette.inkTertiary}>Search PGs, hostels & co-living</Text>
        </View>
      </View>

      <SegmentedControl
        segments={STAY_SEGMENTS}
        value={stayType}
        onChange={(key) => onStayTypeChange(key as BookingMode)}
      />

      <LocationSearchTrigger value={location} onPress={onLocationPress} />

      <StayBookingFields
        mode={stayType}
        values={stayValues}
        onChange={onStayValuesChange}
        compact
      />

      <Button label="Search stays" icon="search" full size="lg" onPress={onSearch} disabled={searchDisabled} />
    </View>
  );
}
