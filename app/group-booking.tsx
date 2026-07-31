/** Group booking enquiry — bulk / team stay request (companies, colleges, events).
 *  Real `POST /booking-management/group-booking-enquiry`. */
import { useMemo, useState } from 'react';
import { View, ScrollView, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { Text, ScreenHeader, Card, Button, Input, SegmentedControl, Dropdown, IconButton } from '@/components/ui';
import { APP_STORE_URL } from '@/data';
import { StayDateRangeField } from '@/components/search';
import { SuccessBurst } from '@/components/illustrations';
import { haptic } from '@/lib/haptics';
import { isBefore } from '@/lib/dates';
import { alert } from '@/lib/alertDialog';
import { useMasterData } from '@/context/MasterDataContext';
import { groupBookingApi, errorMessage, type GroupBookingArrangement, type GroupBookingMeals, type GroupBookingFoodType } from '@/lib/api';

type Preference = 'Male only' | 'Female only' | 'Co-live';
type FoodType = 'Vegetarian' | 'Non-vegetarian';

const PREFERENCE_API: Record<Preference, GroupBookingArrangement> = {
  'Male only': 'MALE_ONLY',
  'Female only': 'FEMALE_ONLY',
  'Co-live': 'CO_LIVE',
};
const MEALS_API: Record<string, GroupBookingMeals> = { '2': 'TWO_MEALS', '3': 'THREE_MEALS' };
const FOOD_API: Record<FoodType, GroupBookingFoodType> = { Vegetarian: 'VEGETARIAN', 'Non-vegetarian': 'NON_VEG' };

const PREFERENCES: { key: Preference; label: string }[] = [
  { key: 'Male only', label: 'Male only' },
  { key: 'Female only', label: 'Female only' },
  { key: 'Co-live', label: 'Co-live' },
];
const MEALS = [
  { key: '3', label: '3 meals/day' },
  { key: '2', label: '2 meals/day' },
];
const FOOD: { key: FoodType; label: string }[] = [
  { key: 'Vegetarian', label: 'Vegetarian' },
  { key: 'Non-vegetarian', label: 'Non-veg' },
];

const onlyDigits = (s: string) => s.replace(/\D/g, '');

export default function GroupBooking() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cities, localitiesForCity } = useMasterData();
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [beds, setBeds] = useState('');
  const [male, setMale] = useState('');
  const [female, setFemale] = useState('');
  const [preference, setPreference] = useState<Preference>('Co-live');
  const [meals, setMeals] = useState('3');
  const [food, setFood] = useState<FoodType>('Vegetarian');
  const [cityId, setCityId] = useState<string | null>(null);
  const [localityId, setLocalityId] = useState<string | null>(null);
  const [organization, setOrganization] = useState('');

  const cityOptions = useMemo(
    () => cities.filter((c) => c.status === 'ACTIVE').sort((a, b) => a.priority - b.priority).map((c) => ({ label: c.name, value: String(c.id) })),
    [cities],
  );
  const localityOptions = useMemo(
    () => localitiesForCity(cityId ? Number(cityId) : null).map((l) => ({ label: l.name, value: String(l.id) })),
    [localitiesForCity, cityId],
  );

  const datesValid = checkIn.length > 0 && checkOut.length > 0 && isBefore(checkIn, checkOut);

  const shareGroupBooking = async () => {
    try {
      await Share.share({
        message: `Planning a stay for a team, college batch or event? Do a group booking on PGfy and get a custom group quote. Download the app: ${APP_STORE_URL}`,
      });
    } catch {
      // user dismissed the share sheet
    }
  };

  const valid = useMemo(
    () =>
      contactName.trim().length > 1
      && contactPhone.length === 10
      && datesValid
      && Number(beds) > 0
      && !!cityId,
    [contactName, contactPhone, datesValid, beds, cityId],
  );

  const submit = () => {
    if (!checkIn || !checkOut) {
      alert('Dates required', 'Select check-in and check-out dates for your group stay.');
      return;
    }
    if (!isBefore(checkIn, checkOut)) {
      alert('Check dates', 'Check-out must be after check-in.');
      return;
    }
    if (!valid || !cityId) {
      alert('Missing details', 'Add a contact name, 10-digit phone, beds required and city.');
      return;
    }
    setSubmitting(true);
    groupBookingApi.createGroupBookingEnquiry({
      contact_name: contactName.trim(),
      contact_phone: contactPhone,
      organisation: organization.trim() || undefined,
      beds_required: Number(beds),
      city_id: Number(cityId),
      locality_id: localityId ? Number(localityId) : undefined,
      male_count: Number(onlyDigits(male)) || 0,
      female_count: Number(onlyDigits(female)) || 0,
      preferred_arrangement: PREFERENCE_API[preference],
      meals_per_day: MEALS_API[meals] ?? 'THREE_MEALS',
      food_type: FOOD_API[food],
      check_in_date: checkIn,
      check_out_date: checkOut,
    })
      .then(() => {
        haptic.success();
        setDone(true);
      })
      .catch((e) => alert('Could not submit enquiry', errorMessage(e)))
      .finally(() => setSubmitting(false));
  };

  if (done) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <SuccessBurst size={170} />
        <Text variant="h1" align="center" style={{ marginTop: spacing.lg }}>Enquiry submitted</Text>
        <Text variant="bodyLg" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.sm, maxWidth: 320 }}>
          Our team will review your group requirement and reach out to {contactName.trim()} at +91-{contactPhone} with options and a quote.
        </Text>
        <Button label="Done" onPress={() => router.back()} style={{ marginTop: spacing.xl, alignSelf: 'center' }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader
        title="Group booking"
        subtitle="Enquiry for bulk / team stays"
        right={<IconButton icon="share-social-outline" size={20} onPress={shareGroupBooking} />}
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + 110, gap: spacing.base }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="bodySm" color={palette.inkSecondary}>
          Planning a stay for a team, college batch or event? Tell us what you need and we&apos;ll match properties and share a group quote.
        </Text>

        {/* Stay dates */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>STAY DATES</Text>
          <StayDateRangeField
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={({ checkIn: ci, checkOut: co }) => {
              setCheckIn(ci);
              setCheckOut(co);
            }}
            sheetTitle="Select group stay dates"
            applyLabel="Apply dates"
          />
        </Card>

        {/* Beds & composition */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>BEDS & GROUP</Text>
          <Input label="How many beds required?" placeholder="e.g. 30" keyboardType="number-pad" value={beds} onChangeText={(v) => setBeds(onlyDigits(v))} />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}><Input label="Male" placeholder="0" keyboardType="number-pad" value={male} onChangeText={(v) => setMale(onlyDigits(v))} /></View>
            <View style={{ flex: 1 }}><Input label="Female" placeholder="0" keyboardType="number-pad" value={female} onChangeText={(v) => setFemale(onlyDigits(v))} /></View>
          </View>
          <View>
            <Text variant="bodySm" weight="600" color={palette.inkSecondary} style={{ marginBottom: spacing.sm }}>Preferred arrangement</Text>
            <SegmentedControl segments={PREFERENCES} value={preference} onChange={(k) => setPreference(k as Preference)} />
          </View>
        </Card>

        {/* Food */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>FOOD</Text>
          <View>
            <Text variant="bodySm" weight="600" color={palette.inkSecondary} style={{ marginBottom: spacing.sm }}>Meals per day</Text>
            <SegmentedControl segments={MEALS} value={meals} onChange={setMeals} />
          </View>
          <View>
            <Text variant="bodySm" weight="600" color={palette.inkSecondary} style={{ marginBottom: spacing.sm }}>Food type</Text>
            <SegmentedControl segments={FOOD} value={food} onChange={(k) => setFood(k as FoodType)} />
          </View>
        </Card>

        {/* Location */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>WHERE</Text>
          <Dropdown
            label="City"
            placeholder="Select city"
            value={cityId}
            options={cityOptions}
            onChange={(v) => { setCityId(v); setLocalityId(null); }}
            pickerTitle="Select city"
          />
          <Dropdown
            label="Area / locality (optional)"
            placeholder={cityId ? 'Select locality' : 'Select a city first'}
            value={localityId}
            options={localityOptions}
            onChange={setLocalityId}
            pickerTitle="Select locality"
            disabled={!cityId}
          />
        </Card>

        {/* Contact */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>POINT OF CONTACT</Text>
          <Input label="Name" placeholder="Full name" value={contactName} onChangeText={setContactName} />
          <Input label="Phone" placeholder="10-digit number" keyboardType="number-pad" value={contactPhone} onChangeText={(v) => setContactPhone(onlyDigits(v).slice(0, 10))} prefix="+91" />
        </Card>

        {/* About */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>ABOUT YOUR GROUP</Text>
          <Input
            label="Company / college / organisation"
            placeholder="Tell us about your company, college or event so we can plan better"
            value={organization}
            onChangeText={setOrganization}
            multiline
            style={{ height: 90, textAlignVertical: 'top' }}
          />
        </Card>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
        <Button label="Submit enquiry" icon="people-outline" onPress={submit} disabled={!valid || submitting} loading={submitting} full size="lg" />
      </View>
    </View>
  );
}
