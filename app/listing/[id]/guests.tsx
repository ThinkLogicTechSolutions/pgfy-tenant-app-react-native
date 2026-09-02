/** Flat/Home stay — guest details step. Replaces room/bed selection for whole-property
 *  bookings: the tenant lists everyone staying (name/gender/age), min 1, max the property's
 *  `max_occupancy`, then continues to the same review/billing screen as a Hostel booking.
 *  The logged-in tenant (if not a guest session) is prefilled as guest 1 — still editable
 *  and removable like any other guest row. */
import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { Text, ScreenHeader, Card, Button, Input, Dropdown, PressableScale } from '@/components/ui';
import { parseApiPropertyId } from '@/lib/listingAdapter';
import { useAuth } from '@/context/AuthContext';

interface GuestDraft {
  name: string;
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  age: string;
}
const emptyGuest = (): GuestDraft => ({ name: '', gender: 'MALE', age: '' });
const GUEST_GENDER_OPTIONS: { value: GuestDraft['gender']; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'UNISEX', label: 'Other' },
];

function ageFromDob(dob: string): number | null {
  const born = new Date(dob);
  if (isNaN(born.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const beforeBirthdayThisYear =
    today.getMonth() < born.getMonth() || (today.getMonth() === born.getMonth() && today.getDate() < born.getDate());
  if (beforeBirthdayThisYear) age -= 1;
  return age > 0 ? age : null;
}

/** The signed-in tenant, prefilled as guest 1 — falls back to a blank guest for guest
 * sessions (no profile to prefill from). */
function firstGuestFromProfile(user: ReturnType<typeof useAuth>['user']): GuestDraft {
  if (!user) return emptyGuest();
  const gender: GuestDraft['gender'] =
    user.personal_details?.gender === 'MALE' ? 'MALE' : user.personal_details?.gender === 'FEMALE' ? 'FEMALE' : 'UNISEX';
  const age = user.personal_details?.dob ? ageFromDob(user.personal_details.dob) : null;
  return { name: user.name ?? '', gender, age: age != null ? String(age) : '' };
}

export default function GuestDetails() {
  const {
    id, checkIn, checkOut, startTime, hours, bookingType, rent, maxOccupancy, propertyName,
  } = useLocalSearchParams<{
    id: string;
    checkIn?: string;
    checkOut?: string;
    startTime?: string;
    hours?: string;
    bookingType?: string;
    rent?: string;
    maxOccupancy?: string;
    propertyName?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isGuest } = useAuth();
  const apiId = parseApiPropertyId(String(id));
  const max = Math.max(1, Number(maxOccupancy) || 1);

  const [guests, setGuests] = useState<GuestDraft[]>(() => [isGuest ? emptyGuest() : firstGuestFromProfile(user)]);

  const addGuest = () => setGuests((prev) => (prev.length >= max ? prev : [...prev, emptyGuest()]));
  const removeGuest = (index: number) => setGuests((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  const updateGuest = (index: number, patch: Partial<GuestDraft>) =>
    setGuests((prev) => prev.map((g, i) => (i === index ? { ...g, ...patch } : g)));

  const valid = guests.length >= 1
    && guests.length <= max
    && guests.every((g) => g.name.trim().length > 1 && Number(g.age) >= 1 && Number(g.age) <= 120);

  const proceed = () => {
    if (!valid) return;
    router.push({
      pathname: `/listing/${id}/book`,
      params: {
        room: 'Whole property',
        bed: '—',
        sharing: 'Whole property',
        rent: rent ?? '0',
        checkIn: checkIn ?? '',
        checkOut: checkOut ?? '',
        startTime: startTime ?? '',
        hours: hours ?? '',
        bookingType: bookingType ?? 'monthly',
        propertyId: apiId ? String(apiId) : '',
        guests: JSON.stringify(guests.map((g) => ({ name: g.name.trim(), gender: g.gender, age: Number(g.age) }))),
      },
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, paddingTop: insets.top + spacing.xs }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Guest details" subtitle={propertyName || undefined} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + 110, gap: spacing.base }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="bodySm" color={palette.inkSecondary}>
          Add everyone staying at this property (up to {max}). KYC is only needed for you, the tenant booking.
        </Text>

        {guests.map((g, i) => (
          <Card key={i} style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="overline" color={palette.inkTertiary}>GUEST {i + 1}</Text>
              {guests.length > 1 ? (
                <PressableScale onPress={() => removeGuest(i)}>
                  <Text variant="caption" weight="600" color={palette.danger}>Remove</Text>
                </PressableScale>
              ) : null}
            </View>
            <Input label="Full name" placeholder="Guest name" value={g.name} onChangeText={(v) => updateGuest(i, { name: v })} />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Age"
                  placeholder="e.g. 28"
                  keyboardType="number-pad"
                  value={g.age}
                  onChangeText={(v) => updateGuest(i, { age: v.replace(/\D/g, '').slice(0, 3) })}
                />
              </View>
              <View style={{ flex: 2 }}>
                <Dropdown
                  label="Gender"
                  value={g.gender}
                  options={GUEST_GENDER_OPTIONS}
                  onChange={(value) => updateGuest(i, { gender: value })}
                  pickerTitle="Select gender"
                />
              </View>
            </View>
          </Card>
        ))}

        {guests.length < max ? (
          <Button label="Add guest" variant="outline" icon="add" onPress={addGuest} />
        ) : null}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
        <Button label="Continue" icon="arrow-forward" onPress={proceed} disabled={!valid} full size="lg" />
      </View>
    </KeyboardAvoidingView>
  );
}
