/** Filter sheet for browse / search results. */
import { View } from 'react-native';
import { palette, spacing } from '@/theme';
import { Text, Sheet, Chip, Button, Divider, SegmentedControl } from '@/components/ui';
import { FILTER_OPTIONS } from '@/data';
import { defaultCheckIn, defaultCheckOut } from '@/lib/dates';
import { StayBookingFields, type StayBookingValues } from './StayBookingFields';
import type { BookingMode } from '@/data/types';

export interface BrowseFilters {
  bookingType: BookingMode;
  stay: StayBookingValues;
  gender: string;
  food: string[];
  acType: string;
  amenities: string[];
  minRating: number | null;
  propertyTypes: string[];
}

export function defaultStayValues(checkIn = defaultCheckIn()): StayBookingValues {
  return {
    checkIn,
    checkOut: defaultCheckOut(checkIn),
    startTime: '10:00',
    hours: 4,
  };
}

export const DEFAULT_BROWSE_FILTERS: BrowseFilters = {
  bookingType: 'monthly',
  stay: defaultStayValues(),
  gender: 'Any',
  food: [],
  acType: 'Any',
  amenities: [],
  minRating: null,
  propertyTypes: [],
};

export function browseFiltersFromParams(params: {
  bookingType?: string;
  checkIn?: string;
  checkOut?: string;
  startTime?: string;
  hours?: string;
}): BrowseFilters {
  const checkIn = params.checkIn || defaultCheckIn();
  return {
    ...DEFAULT_BROWSE_FILTERS,
    bookingType: (['hourly', 'daily', 'monthly'].includes(params.bookingType ?? '')
      ? params.bookingType
      : 'monthly') as BookingMode,
    stay: {
      checkIn,
      checkOut: params.checkOut || defaultCheckOut(checkIn),
      startTime: params.startTime || '10:00',
      hours: params.hours ? Number(params.hours) : 4,
    },
  };
}

const STAY_SEGMENTS = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'daily', label: 'Daily' },
  { key: 'hourly', label: 'Hourly' },
];

const AC_OPTIONS = ['Any', 'AC', 'Non-AC'] as const;
const RATING_OPTIONS = [
  { key: null, label: 'Any rating' },
  { key: 3, label: '3★ & above' },
  { key: 4, label: '4★ & above' },
  { key: 5, label: '5★ only' },
] as const;
const PROPERTY_TYPES = ['PG', 'Co-living', 'Hostel'] as const;
const FOOD_OPTIONS = ['Veg', 'Non-Veg', 'With meals', 'No meals'] as const;

function toggle(arr: string[], value: string) {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  filters: BrowseFilters;
  draft: BrowseFilters;
  onDraftChange: (draft: BrowseFilters) => void;
  onApply: () => void;
  onClear: () => void;
}

export function BrowseFiltersSheet({
  visible,
  onClose,
  draft,
  onDraftChange,
  onApply,
  onClear,
}: Props) {
  const set = (patch: Partial<BrowseFilters>) => onDraftChange({ ...draft, ...patch });

  return (
    <Sheet visible={visible} onClose={onClose} title="Filters" scroll>
      <View style={{ gap: spacing.lg }}>
        <FilterSection label="Stay duration type">
          <SegmentedControl
            segments={STAY_SEGMENTS}
            value={draft.bookingType}
            onChange={(key) => set({ bookingType: key as BookingMode })}
            style={{ marginBottom: spacing.md }}
          />
          <StayBookingFields
            mode={draft.bookingType}
            values={draft.stay}
            onChange={(stay) => set({ stay })}
            compact
          />
        </FilterSection>

        <Divider />

        <FilterSection label="Property type">
          <ChipRow>
            {PROPERTY_TYPES.map((t) => (
              <Chip
                key={t}
                label={t}
                active={draft.propertyTypes.includes(t)}
                onPress={() => set({ propertyTypes: toggle(draft.propertyTypes, t) })}
              />
            ))}
          </ChipRow>
        </FilterSection>

        <Divider />

        <FilterSection label="Gender">
          <ChipRow>
            {FILTER_OPTIONS.gender.map((g) => (
              <Chip key={g} label={g} active={draft.gender === g} onPress={() => set({ gender: g })} />
            ))}
          </ChipRow>
        </FilterSection>

        <Divider />

        <FilterSection label="Food preference">
          <ChipRow>
            {FOOD_OPTIONS.map((f) => (
              <Chip
                key={f}
                label={f}
                active={draft.food.includes(f)}
                onPress={() => set({ food: toggle(draft.food, f) })}
              />
            ))}
          </ChipRow>
        </FilterSection>

        <Divider />

        <FilterSection label="Room cooling">
          <ChipRow>
            {AC_OPTIONS.map((a) => (
              <Chip key={a} label={a} active={draft.acType === a} onPress={() => set({ acType: a })} />
            ))}
          </ChipRow>
        </FilterSection>

        <Divider />

        <FilterSection label="Minimum rating">
          <ChipRow>
            {RATING_OPTIONS.map((r) => (
              <Chip
                key={String(r.key)}
                label={r.label}
                active={draft.minRating === r.key}
                onPress={() => set({ minRating: r.key })}
              />
            ))}
          </ChipRow>
        </FilterSection>

        <Divider />

        <FilterSection label="Amenities">
          <ChipRow>
            {FILTER_OPTIONS.amenities.map((a) => (
              <Chip
                key={a}
                label={a}
                active={draft.amenities.includes(a)}
                onPress={() => set({ amenities: toggle(draft.amenities, a) })}
              />
            ))}
          </ChipRow>
        </FilterSection>

        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          <Button label="Apply filters" full size="lg" onPress={onApply} />
          <Button label="Clear all" variant="ghost" full onPress={onClear} />
        </View>
      </View>
    </Sheet>
  );
}

export function matchesBrowseFilters(
  listing: {
    type: string;
    gender: string;
    amenities: string[];
    foodIncluded: boolean;
    rating: number;
  },
  filters: BrowseFilters,
): boolean {
  if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(listing.type)) return false;
  if (filters.gender !== 'Any' && listing.gender !== filters.gender) return false;

  if (filters.food.length > 0) {
    const hasPureVeg = listing.amenities.includes('Pure Veg');
    const matchesFood = filters.food.some((f) => {
      if (f === 'Veg') return hasPureVeg || listing.foodIncluded;
      if (f === 'Non-Veg') return listing.foodIncluded && !hasPureVeg;
      if (f === 'With meals') return listing.foodIncluded;
      if (f === 'No meals') return !listing.foodIncluded;
      return false;
    });
    if (!matchesFood) return false;
  }

  if (filters.acType === 'AC' && !listing.amenities.includes('AC')) return false;
  if (filters.acType === 'Non-AC' && listing.amenities.includes('AC')) return false;

  if (filters.minRating !== null && listing.rating < filters.minRating) return false;

  if (filters.amenities.length > 0 && !filters.amenities.every((a) => listing.amenities.includes(a))) return false;

  return true;
}

export function browseFiltersActiveCount(filters: BrowseFilters): number {
  let n = 0;
  if (filters.bookingType !== 'monthly') n += 1;
  if (filters.gender !== 'Any') n += 1;
  if (filters.food.length) n += filters.food.length;
  if (filters.acType !== 'Any') n += 1;
  if (filters.minRating !== null) n += 1;
  if (filters.propertyTypes.length) n += filters.propertyTypes.length;
  n += filters.amenities.length;
  return n;
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{children}</View>;
}
