/** Group booking enquiry — bulk / team stay request (companies, colleges, events).
 *  Submits to the (mock) enquiry store; in production this surfaces in the admin panel. */
import { useMemo, useState } from 'react';
import { View, ScrollView, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { Text, ScreenHeader, Card, Button, Input, SegmentedControl, IconButton } from '@/components/ui';
import { APP_STORE_URL } from '@/data';
import { StayDateRangeField } from '@/components/search';
import { SuccessBurst } from '@/components/illustrations';
import { haptic } from '@/lib/haptics';
import { isBefore } from '@/lib/dates';
import { useGroupBookings, type GroupPreference, type GroupFoodType } from '@/store/groupBookings';

const PREFERENCES: { key: GroupPreference; label: string }[] = [
  { key: 'Male only', label: 'Male only' },
  { key: 'Female only', label: 'Female only' },
  { key: 'Co-live', label: 'Co-live' },
];
const MEALS = [
  { key: '3', label: '3 meals/day' },
  { key: '2', label: '2 meals/day' },
];
const FOOD: { key: GroupFoodType; label: string }[] = [
  { key: 'Vegetarian', label: 'Vegetarian' },
  { key: 'Non-vegetarian', label: 'Non-veg' },
];

const onlyDigits = (s: string) => s.replace(/\D/g, '');

export default function GroupBooking() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const enquiries = useGroupBookings();
  const [done, setDone] = useState(false);

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [beds, setBeds] = useState('');
  const [male, setMale] = useState('');
  const [female, setFemale] = useState('');
  const [preference, setPreference] = useState<GroupPreference>('Co-live');
  const [meals, setMeals] = useState('3');
  const [food, setFood] = useState<GroupFoodType>('Vegetarian');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');
  const [organization, setOrganization] = useState('');

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
      && city.trim().length > 0,
    [contactName, contactPhone, datesValid, beds, city],
  );

  const submit = () => {
    if (!checkIn || !checkOut) {
      Alert.alert('Dates required', 'Select check-in and check-out dates for your group stay.');
      return;
    }
    if (!isBefore(checkIn, checkOut)) {
      Alert.alert('Check dates', 'Check-out must be after check-in.');
      return;
    }
    if (!valid) {
      Alert.alert('Missing details', 'Add a contact name, 10-digit phone, beds required and city.');
      return;
    }
    enquiries.add({
      contactName: contactName.trim(),
      contactPhone,
      checkIn,
      checkOut,
      bedsRequired: Number(beds),
      maleCount: Number(onlyDigits(male)) || 0,
      femaleCount: Number(onlyDigits(female)) || 0,
      preference,
      mealsPerDay: meals === '2' ? 2 : 3,
      foodType: food,
      city: city.trim(),
      location: location.trim(),
      organization: organization.trim(),
    });
    haptic.success();
    setDone(true);
  };

  if (done) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <SuccessBurst size={170} />
        <Text variant="h1" align="center" style={{ marginTop: spacing.lg }}>Enquiry submitted</Text>
        <Text variant="bodyLg" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.sm, maxWidth: 320 }}>
          Our team will review your group requirement and reach out to {contactName.trim()} at +91-{contactPhone} with options and a quote.
        </Text>
        <Button label="Done" onPress={() => router.back()} style={{ marginTop: spacing.xl }} />
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
            <SegmentedControl segments={PREFERENCES} value={preference} onChange={(k) => setPreference(k as GroupPreference)} />
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
            <SegmentedControl segments={FOOD} value={food} onChange={(k) => setFood(k as GroupFoodType)} />
          </View>
        </Card>

        {/* Location */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>WHERE</Text>
          <Input label="City" placeholder="e.g. Bengaluru" value={city} onChangeText={setCity} />
          <Input label="Area / locality (optional)" placeholder="e.g. Electronic City, near campus" value={location} onChangeText={setLocation} />
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
        <Button label="Submit enquiry" icon="people-outline" onPress={submit} disabled={!valid} full size="lg" />
      </View>
    </View>
  );
}
