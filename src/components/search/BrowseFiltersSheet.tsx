/** Filter sheet for browse / search results. */
import { View } from 'react-native';
import { palette, spacing } from '@/theme';
import { Text, Sheet, Chip, Button, Divider, SegmentedControl, RangeSlider } from '@/components/ui';
import { inrCompact } from '@/lib/format';
import { FILTER_OPTIONS } from '@/data';
import { defaultCheckIn, defaultCheckOut, clampCheckInToFuture } from '@/lib/dates';
import { PRICE_BOUNDS, listingPriceFrom } from '@/lib/listingDisplay';
import { StayBookingFields, type StayBookingValues } from './StayBookingFields';
import type { BookingMode, Listing } from '@/data/types';

export interface BrowseFilters {
  bookingType: BookingMode;
  stay: StayBookingValues;
  gender: string;
  food: string[];
  acType: string;
  amenities: string[];
  minRating: number | null;
  /** Monthly rent range (₹). */
  priceMin: number;
  priceMax: number;
  /** Search radius in km from the area centre. */
  distanceMax: number;
  propertyTypes: string[];
  /** Roommate compatibility filters (each 'Any' when unset). */
  roommateType: string;
  smoking: string;
  alcohol: string;
  sleep: string;
  diet: string;
}

export function defaultStayValues(checkIn = defaultCheckIn()): StayBookingValues {
  return {
    checkIn,
    checkOut: defaultCheckOut(checkIn),
    startTime: '10:00',
    hours: 4,
  };
}

export const DISTANCE_MAX = 20; // km

const PRICE_LABELS: Record<BookingMode, string> = {
  monthly: 'Monthly rent',
  daily: 'Daily rent',
  hourly: 'Hourly rate',
};

/** A fresh default filter set, computed on every call — `stay` must never freeze "today"
 * into a long-lived constant (the home tab and browse/results screens can stay mounted for
 * days, and a frozen default would silently drift into the past). */
export function getDefaultBrowseFilters(): BrowseFilters {
  return {
    bookingType: 'monthly',
    stay: defaultStayValues(),
    gender: 'Any',
    food: [],
    acType: 'Any',
    amenities: [],
    minRating: null,
    priceMin: PRICE_BOUNDS.monthly.min,
    priceMax: PRICE_BOUNDS.monthly.max,
    distanceMax: DISTANCE_MAX,
    propertyTypes: [],
    roommateType: 'Any',
    smoking: 'Any',
    alcohol: 'Any',
    sleep: 'Any',
    diet: 'Any',
  };
}

export interface BrowseFiltersParams {
  bookingType?: string;
  checkIn?: string;
  checkOut?: string;
  startTime?: string;
  hours?: string;
  gender?: string;
  food?: string;
  acType?: string;
  amenities?: string;
  minRating?: string;
  priceMin?: string;
  priceMax?: string;
  distanceMax?: string;
  propertyTypes?: string;
  roommateType?: string;
  smoking?: string;
  alcohol?: string;
  sleep?: string;
  diet?: string;
}

export function browseFiltersFromParams(params: BrowseFiltersParams): BrowseFilters {
  // Never trust a carried-over checkIn param at face value — a shared link, a stale
  // navigation param, or a long-idle screen can all hand back a date that's since slipped
  // into the past.
  const checkIn = clampCheckInToFuture(params.checkIn);
  const bookingType = (['hourly', 'daily', 'monthly'].includes(params.bookingType ?? '')
    ? params.bookingType
    : 'monthly') as BookingMode;
  const bounds = PRICE_BOUNDS[bookingType];
  const defaults = getDefaultBrowseFilters();
  return {
    ...defaults,
    bookingType,
    gender: params.gender || defaults.gender,
    food: params.food ? params.food.split(',').filter(Boolean) : defaults.food,
    acType: params.acType || defaults.acType,
    amenities: params.amenities ? params.amenities.split(',').filter(Boolean) : defaults.amenities,
    minRating: params.minRating ? Number(params.minRating) : defaults.minRating,
    priceMin: params.priceMin ? Number(params.priceMin) : bounds.min,
    priceMax: params.priceMax ? Number(params.priceMax) : bounds.max,
    distanceMax: params.distanceMax ? Number(params.distanceMax) : defaults.distanceMax,
    propertyTypes: params.propertyTypes ? params.propertyTypes.split(',').filter(Boolean) : defaults.propertyTypes,
    roommateType: params.roommateType || defaults.roommateType,
    smoking: params.smoking || defaults.smoking,
    alcohol: params.alcohol || defaults.alcohol,
    sleep: params.sleep || defaults.sleep,
    diet: params.diet || defaults.diet,
    stay: {
      checkIn,
      checkOut: params.checkOut || defaultCheckOut(checkIn),
      startTime: params.startTime || '10:00',
      hours: params.hours ? Number(params.hours) : 4,
    },
  };
}

/** Inverse of `browseFiltersFromParams` — serializes a filter set to route params so any
 * screen can hand a fully-picked filter set to `/browse` without re-deriving it there. */
export function browseFiltersToParams(filters: BrowseFilters): Record<string, string> {
  return {
    bookingType: filters.bookingType,
    checkIn: filters.stay.checkIn,
    checkOut: filters.stay.checkOut,
    startTime: filters.stay.startTime,
    hours: String(filters.stay.hours),
    gender: filters.gender,
    food: filters.food.join(','),
    acType: filters.acType,
    amenities: filters.amenities.join(','),
    minRating: filters.minRating != null ? String(filters.minRating) : '',
    priceMin: String(filters.priceMin),
    priceMax: String(filters.priceMax),
    distanceMax: String(filters.distanceMax),
    propertyTypes: filters.propertyTypes.join(','),
    roommateType: filters.roommateType,
    smoking: filters.smoking,
    alcohol: filters.alcohol,
    sleep: filters.sleep,
    diet: filters.diet,
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
const PROPERTY_TYPES = ['PG', 'Co-living', 'Hostel', 'Flat', 'Home stay'] as const;
const FOOD_OPTIONS = ['Veg', 'Non-Veg', 'With meals', 'No meals'] as const;
const ROOMMATE_TYPE_OPTIONS = ['Any', 'Working professional', 'Student'] as const;
const SMOKING_OPTIONS = ['Any', 'Non-smoking'] as const;
const ALCOHOL_OPTIONS = ['Any', 'No alcohol'] as const;
const SLEEP_OPTIONS = ['Any', 'Early sleep', 'Late sleep'] as const;
const DIET_OPTIONS = ['Any', 'Veg', 'Vegan', 'Non-veg'] as const;

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
            onChange={(key) => {
              const mode = key as BookingMode;
              const bounds = PRICE_BOUNDS[mode];
              // Rescale the price range to the new mode's bounds (resets any price filter).
              set({ bookingType: mode, priceMin: bounds.min, priceMax: bounds.max });
            }}
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

        <FilterSection label={PRICE_LABELS[draft.bookingType]}>
          <RangeSlider
            min={PRICE_BOUNDS[draft.bookingType].min}
            max={PRICE_BOUNDS[draft.bookingType].max}
            step={PRICE_BOUNDS[draft.bookingType].step}
            low={draft.priceMin}
            high={draft.priceMax}
            onChange={(priceMin, priceMax) => set({ priceMin, priceMax })}
            format={(v) => inrCompact(v)}
          />
        </FilterSection>

        <Divider />

        <FilterSection label="Distance radius">
          <RangeSlider
            single
            min={1}
            max={DISTANCE_MAX}
            step={1}
            low={1}
            high={draft.distanceMax}
            onChange={(_lo, hi) => set({ distanceMax: hi })}
            format={(v) => `${v} km`}
            maxLabel="Any distance"
          />
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

        <FilterSection label="Roommate type">
          <ChipRow>
            {ROOMMATE_TYPE_OPTIONS.map((t) => (
              <Chip key={t} label={t} active={draft.roommateType === t} onPress={() => set({ roommateType: t })} />
            ))}
          </ChipRow>
        </FilterSection>

        <FilterSection label="Lifestyle">
          <ChipRow>
            {SMOKING_OPTIONS.filter((o) => o !== 'Any').map((o) => (
              <Chip key={o} label={o} active={draft.smoking === o} onPress={() => set({ smoking: draft.smoking === o ? 'Any' : o })} />
            ))}
            {ALCOHOL_OPTIONS.filter((o) => o !== 'Any').map((o) => (
              <Chip key={o} label={o} active={draft.alcohol === o} onPress={() => set({ alcohol: draft.alcohol === o ? 'Any' : o })} />
            ))}
            {SLEEP_OPTIONS.filter((o) => o !== 'Any').map((o) => (
              <Chip key={o} label={o} active={draft.sleep === o} onPress={() => set({ sleep: draft.sleep === o ? 'Any' : o })} />
            ))}
          </ChipRow>
        </FilterSection>

        <FilterSection label="Roommate diet">
          <ChipRow>
            {DIET_OPTIONS.map((d) => (
              <Chip key={d} label={d} active={draft.diet === d} onPress={() => set({ diet: d })} />
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

export function matchesBrowseFilters(listing: Listing, filters: BrowseFilters): boolean {
  if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(listing.type)) return false;
  if (filters.gender !== 'Any' && listing.gender !== filters.gender) return false;

  const rs = listing.roommateSummary;
  if (filters.roommateType !== 'Any') {
    if (!rs) return false;
    if (filters.roommateType === 'Working professional' && !rs.mostlyProfessionals) return false;
    if (filters.roommateType === 'Student' && rs.mostlyProfessionals) return false;
  }
  if (filters.smoking === 'Non-smoking' && (!rs || rs.smoking)) return false;
  if (filters.alcohol === 'No alcohol' && (!rs || rs.alcohol)) return false;
  if (filters.sleep === 'Early sleep' && (!rs || rs.sleep !== 'early')) return false;
  if (filters.sleep === 'Late sleep' && (!rs || rs.sleep !== 'late')) return false;
  if (filters.diet !== 'Any') {
    if (!rs) return false;
    if (filters.diet === 'Veg' && rs.diet === 'nonveg') return false;
    if (filters.diet === 'Vegan' && rs.diet !== 'vegan') return false;
    if (filters.diet === 'Non-veg' && rs.diet !== 'nonveg') return false;
  }

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

  const priceBounds = PRICE_BOUNDS[filters.bookingType];
  const price = listingPriceFrom(listing, filters.bookingType);
  if (price < filters.priceMin) return false;
  if (filters.priceMax < priceBounds.max && price > filters.priceMax) return false;

  if (filters.distanceMax < DISTANCE_MAX && listing.distanceKm > filters.distanceMax) return false;

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
  const priceBounds = PRICE_BOUNDS[filters.bookingType];
  if (filters.priceMin > priceBounds.min || filters.priceMax < priceBounds.max) n += 1;
  if (filters.distanceMax < DISTANCE_MAX) n += 1;
  if (filters.propertyTypes.length) n += filters.propertyTypes.length;
  n += filters.amenities.length;
  if (filters.roommateType !== 'Any') n += 1;
  if (filters.smoking !== 'Any') n += 1;
  if (filters.alcohol !== 'Any') n += 1;
  if (filters.sleep !== 'Any') n += 1;
  if (filters.diet !== 'Any') n += 1;
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
