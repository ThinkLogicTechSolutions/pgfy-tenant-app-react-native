/** T-S9 — Search & filters (modal). */
import { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Input, Button, Chip, IconButton, Divider } from '@/components/ui';
import { FILTER_OPTIONS, RECENT_SEARCHES, LOCATIONS } from '@/data';
import { inr } from '@/lib/format';
import type { BookingMode } from '@/data/types';

const BOOKING_TYPE_OPTIONS: { key: BookingMode; label: string }[] = [
  { key: 'hourly', label: '⏱ Hourly' },
  { key: 'daily', label: '☀ Daily' },
  { key: 'monthly', label: '📅 Monthly' },
];

export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [budget, setBudget] = useState(15000);
  const [stay, setStay] = useState<string>('Any');
  const [sharing, setSharing] = useState<string[]>([]);
  const [gender, setGender] = useState('Any');
  const [food, setFood] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [bookingType, setBookingType] = useState<BookingMode>('monthly');

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const activeCount = sharing.length + food.length + amenities.length + (gender !== 'Any' ? 1 : 0) + (stay !== 'Any' ? 1 : 0) + (verifiedOnly ? 1 : 0) + (bookingType !== 'monthly' ? 1 : 0);

  const apply = () => router.replace({ pathname: '/results', params: { title: query || 'Search results' } });
  const reset = () => { setBudget(15000); setStay('Any'); setSharing([]); setGender('Any'); setFood([]); setAmenities([]); setVerifiedOnly(true); setBookingType('monthly'); };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, gap: spacing.md, marginBottom: spacing.md }}>
        <IconButton icon="close" onPress={() => router.back()} style={{ borderRadius: 21 }} />
        <Text variant="h3" style={{ flex: 1 }}>Search & filter</Text>
        {activeCount > 0 ? <Pressable onPress={reset}><Text variant="bodySm" weight="600" color={palette.coralDark}>Reset</Text></Pressable> : null}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Input icon="search" placeholder="City, area or PG name" value={query} onChangeText={setQuery} autoFocus />

        {!query ? (
          <View style={{ marginTop: spacing.lg }}>
            <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>RECENT SEARCHES</Text>
            {RECENT_SEARCHES.map((s) => (
              <Pressable key={s} onPress={() => setQuery(s)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
                <Ionicons name="time-outline" size={18} color={palette.inkTertiary} />
                <Text variant="body" color={palette.inkSecondary}>{s}</Text>
              </Pressable>
            ))}
            <Text variant="overline" color={palette.inkTertiary} style={{ marginTop: spacing.base, marginBottom: spacing.sm }}>POPULAR AREAS</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {LOCATIONS[0].areas.map((a) => <Chip key={a} label={a} onPress={() => setQuery(a)} />)}
            </View>
          </View>
        ) : null}

        <Divider style={{ marginVertical: spacing.lg }} />

        {/* Booking type */}
        <FilterBlock label="Booking type">
          <Row>{BOOKING_TYPE_OPTIONS.map((bt) => <Chip key={bt.key} label={bt.label} active={bookingType === bt.key} onPress={() => setBookingType(bt.key)} />)}</Row>
        </FilterBlock>

        {/* Budget */}
        <FilterBlock label={bookingType === 'hourly' ? 'Hourly budget' : bookingType === 'daily' ? 'Daily budget' : 'Monthly budget'} value={`Up to ${inr(budget)}`}>
          <BudgetSlider value={budget} onChange={setBudget} />
        </FilterBlock>

        <FilterBlock label="Stay duration">
          <Row>{FILTER_OPTIONS.stay.map((s) => <Chip key={s} label={s} active={stay === s} onPress={() => setStay(s)} />)}</Row>
        </FilterBlock>

        <FilterBlock label="Room sharing">
          <Row>{FILTER_OPTIONS.sharing.map((s) => <Chip key={s} label={s} active={sharing.includes(s)} onPress={() => toggle(sharing, setSharing, s)} />)}</Row>
        </FilterBlock>

        <FilterBlock label="Gender">
          <Row>{FILTER_OPTIONS.gender.map((g) => <Chip key={g} label={g} active={gender === g} onPress={() => setGender(g)} />)}</Row>
        </FilterBlock>

        <FilterBlock label="Food & dining">
          <Row>{FILTER_OPTIONS.food.map((f) => <Chip key={f} label={f} active={food.includes(f)} onPress={() => toggle(food, setFood, f)} />)}</Row>
        </FilterBlock>

        <FilterBlock label="Amenities">
          <Row>{FILTER_OPTIONS.amenities.map((a) => <Chip key={a} label={a} active={amenities.includes(a)} onPress={() => toggle(amenities, setAmenities, a)} />)}</Row>
        </FilterBlock>

        <Pressable onPress={() => setVerifiedOnly((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
          <Ionicons name={verifiedOnly ? 'checkbox' : 'square-outline'} size={22} color={verifiedOnly ? palette.coral : palette.inkTertiary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyMd" weight="600">PGfy Verified only</Text>
            <Text variant="caption" color={palette.inkTertiary}>Show only inspected & trusted properties</Text>
          </View>
        </Pressable>
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing.base, borderTopWidth: 1, borderTopColor: palette.border }}>
        <Button label={`Show results${activeCount ? ` · ${activeCount} filters` : ''}`} onPress={apply} full size="lg" />
      </View>
    </View>
  );
}

function FilterBlock({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <Text variant="bodyMd" weight="600">{label}</Text>
        {value ? <Text variant="bodySm" color={palette.coralDark} weight="600">{value}</Text> : null}
      </View>
      {children}
    </View>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{children}</View>;
}

function BudgetSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const min = FILTER_OPTIONS.budget.min;
  const max = FILTER_OPTIONS.budget.max;
  const steps = [5000, 8000, 10000, 12000, 15000, 18000, 22000, 25000];
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: palette.surfaceSunken, marginVertical: spacing.sm }}>
        <View style={{ width: `${pct}%`, height: '100%', borderRadius: 3, backgroundColor: palette.coral }} />
        <View style={{ position: 'absolute', left: `${pct}%`, top: -7, width: 20, height: 20, borderRadius: 10, backgroundColor: palette.coral, borderWidth: 3, borderColor: palette.white, marginLeft: -10 }} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
        {steps.map((s) => <Chip key={s} label={`₹${s / 1000}k`} active={value === s} onPress={() => onChange(s)} />)}
      </View>
    </View>
  );
}
