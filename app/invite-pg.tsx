/** Invite a PG — tenant refers a PG/hostel that isn't on PGfy yet.
 *  Real `POST /property-management/property-lead`; surfaces in the admin panel under
 *  Properties → Property Leads. Hostel-only (PG/Hostel/Co-living) — Flat/Home stay leads
 *  aren't part of this flow. */
import { useMemo, useState } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { alert } from '@/lib/alertDialog';
import { palette, spacing } from '@/theme';
import { Text, ScreenHeader, Card, Button, Input, Dropdown, Confetti } from '@/components/ui';
import { AnimatedSuccessTick, useBookingSuccessSound } from '@/components/booking';
import { OptionalImagePicker } from '@/components/support';
import { haptic } from '@/lib/haptics';
import { useMasterData } from '@/context/MasterDataContext';
import { propertyLeadApi, uploadApi, errorMessage, type PropertyLeadType } from '@/lib/api';

const onlyDigits = (s: string) => s.replace(/\D/g, '');

const PG_TYPES: { value: PropertyLeadType; label: string }[] = [
  { value: 'PG', label: 'PG' },
  { value: 'HOSTEL', label: 'Hostel' },
  { value: 'CO_LIVING', label: 'Co-living' },
];

/** Animated confirmation — mirrors the booking-success screen: a spring tick burst,
 *  a confetti shower and the success chime, with staggered text/button entrances. */
function InviteSuccess({ pgName, onDone }: { pgName: string; onDone: () => void }) {
  const { height: screenHeight } = useWindowDimensions();
  useBookingSuccessSound();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Confetti originTop={screenHeight * 0.32} count={32} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <AnimatedSuccessTick size={132} />
        <Animated.View entering={FadeInDown.delay(260).duration(500)}>
          <Text variant="h1" align="center" style={{ marginTop: spacing.xl }}>PG invited 🎉</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(380).duration(500)}>
          <Text variant="bodyLg" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.sm, maxWidth: 320 }}>
            Thanks for inviting {pgName}! Our team will review the details and reach out to onboard it onto PGfy.
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={{ marginTop: spacing.xl }}>
          <Button label="Done" onPress={onDone} style={{ alignSelf: 'center' }} />
        </Animated.View>
      </View>
    </View>
  );
}

export default function InvitePg() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeStates, citiesForState, localitiesForCity } = useMasterData();
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [propertyType, setPropertyType] = useState<PropertyLeadType | null>(null);
  const [pgName, setPgName] = useState('');
  const [stateId, setStateId] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);
  const [localityId, setLocalityId] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const stateOptions = useMemo(() => activeStates.map((s) => ({ label: s.name, value: String(s.id) })), [activeStates]);
  const cityOptions = useMemo(
    () => citiesForState(stateId ? Number(stateId) : null).map((c) => ({ label: c.name, value: String(c.id) })),
    [citiesForState, stateId],
  );
  const localityOptions = useMemo(
    () => localitiesForCity(cityId ? Number(cityId) : null).map((l) => ({ label: l.name, value: String(l.id) })),
    [localitiesForCity, cityId],
  );

  const valid = useMemo(
    () =>
      !!propertyType
      && pgName.trim().length > 1
      && !!cityId
      && address.trim().length > 2
      && ownerName.trim().length > 1
      && contactNumber.length === 10,
    [propertyType, pgName, cityId, address, ownerName, contactNumber],
  );

  const submit = () => {
    if (!valid || !propertyType || !cityId) {
      alert('Missing details', 'Please fill the PG type, name, city, address, owner name and a 10-digit contact number.');
      return;
    }
    setSubmitting(true);
    propertyLeadApi.createPropertyLead({
      property_name: pgName.trim(),
      property_type: propertyType,
      address_line_1: address.trim(),
      images: images.map((link) => ({ link, type: uploadApi.UploadFileType.IMAGE })),
      state_id: stateId ? Number(stateId) : undefined,
      city_id: Number(cityId),
      locality_id: localityId ? Number(localityId) : undefined,
      owner_name: ownerName.trim(),
      owner_phone: contactNumber,
    })
      .then(() => {
        haptic.success();
        setDone(true);
      })
      .catch((e) => alert('Could not submit invite', errorMessage(e)))
      .finally(() => setSubmitting(false));
  };

  if (done) {
    return <InviteSuccess pgName={pgName.trim()} onDone={() => router.back()} />;
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Invite a PG" subtitle="Know a PG that should be on PGfy?" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + 110, gap: spacing.base }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="bodySm" color={palette.inkSecondary}>
          Tell us about a PG, hostel or co-living that isn&apos;t listed yet. We&apos;ll verify and onboard it so more tenants can find it.
        </Text>

        {/* PG details */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>PG DETAILS</Text>
          <Dropdown
            label="PG type"
            placeholder="Select type"
            pickerTitle="Select PG type"
            value={propertyType}
            options={PG_TYPES.map((t) => ({ label: t.label, value: t.value }))}
            onChange={(v) => setPropertyType(v as PropertyLeadType)}
          />
          <Input label="PG name" placeholder="e.g. Sai Krishna Gents PG" value={pgName} onChangeText={setPgName} />
        </Card>

        {/* Location */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>LOCATION</Text>
          <Dropdown
            label="State"
            placeholder="Select state"
            pickerTitle="Select state"
            value={stateId}
            options={stateOptions}
            onChange={(v) => { setStateId(v); setCityId(null); setLocalityId(null); }}
          />
          <Dropdown
            label="City"
            placeholder={stateId ? 'Select city' : 'Select a state first'}
            pickerTitle="Select city"
            value={cityId}
            options={cityOptions}
            disabled={!stateId}
            onChange={(v) => { setCityId(v); setLocalityId(null); }}
          />
          <Dropdown
            label="Location / locality"
            placeholder={cityId ? 'Select location' : 'Select a city first'}
            pickerTitle="Select location"
            value={localityId}
            options={localityOptions}
            disabled={!cityId}
            onChange={setLocalityId}
          />
          <Input
            label="Address line 1"
            placeholder="House / building no, street"
            value={address}
            onChangeText={setAddress}
          />
        </Card>

        {/* Owner & contact */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>OWNER & CONTACT</Text>
          <Input label="Owner name" placeholder="Full name of the PG owner" value={ownerName} onChangeText={setOwnerName} />
          <Input
            label="Contact number"
            placeholder="10-digit number"
            keyboardType="number-pad"
            value={contactNumber}
            onChangeText={(v) => setContactNumber(onlyDigits(v).slice(0, 10))}
            prefix="+91"
          />
        </Card>

        {/* Photos */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>PG PHOTOS</Text>
          <OptionalImagePicker onChange={setImages} uploader={uploadApi.uploadPropertyLeadImage} max={3} />
        </Card>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
        <Button label="Submit invite" icon="business-outline" onPress={submit} disabled={!valid || submitting} loading={submitting} full size="lg" />
      </View>
    </View>
  );
}
