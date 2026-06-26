/** Invite a PG — tenant refers a PG/hostel that isn't on PGfy yet.
 *  Submits to the (mock) property-invite store; in production this POSTs to the API
 *  and surfaces in the admin panel under Properties → Property Leads. */
import { useMemo, useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Input, Dropdown, PressableScale } from '@/components/ui';
import { SuccessBurst } from '@/components/illustrations';
import { interiorImages } from '@/data';
import { haptic } from '@/lib/haptics';
import {
  PG_TYPES, INVITE_STATES, citiesForState, localitiesForCity, type PgType,
} from '@/data/propertyInvite';
import { usePropertyInvites } from '@/store/propertyInvites';

const onlyDigits = (s: string) => s.replace(/\D/g, '');
const MAX_IMAGES = 3;

/** Up-to-3 PG photo picker. Native image picking isn't bundled in this build, so
 *  tapping a slot attaches a sample PG photo (stands in for an uploaded image). */
function PgImagePicker({ images, onChange }: { images: string[]; onChange: (next: string[]) => void }) {
  const addImage = () => {
    if (images.length >= MAX_IMAGES) return;
    haptic.select();
    // Cycle through the sample interiors so each added slot shows a distinct photo.
    const next = interiorImages[images.length % interiorImages.length];
    onChange([...images, next]);
  };
  const removeImage = (index: number) => {
    haptic.select();
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <Text variant="overline" color={palette.inkTertiary}>PG PHOTOS</Text>
        <Text variant="caption" color={palette.inkTertiary}>{images.length}/{MAX_IMAGES}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
        {images.map((uri, i) => (
          <View key={uri + i} style={{ width: 84, height: 84 }}>
            <Image source={{ uri }} style={{ width: 84, height: 84, borderRadius: radius.md }} contentFit="cover" transition={150} />
            <PressableScale
              onPress={() => removeImage(i)}
              haptics={false}
              hitSlop={8}
              style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={15} color={palette.white} />
            </PressableScale>
          </View>
        ))}
        {images.length < MAX_IMAGES ? (
          <PressableScale
            onPress={addImage}
            scaleTo={0.95}
            haptics={false}
            style={{
              width: 84,
              height: 84,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: palette.border,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: palette.surface,
              gap: 2,
            }}
          >
            <Ionicons name="camera-outline" size={22} color={palette.inkTertiary} />
            <Text variant="caption" color={palette.inkTertiary}>Add</Text>
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}

export default function InvitePg() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const invites = usePropertyInvites();
  const [done, setDone] = useState(false);

  const [propertyType, setPropertyType] = useState<PgType | null>(null);
  const [pgName, setPgName] = useState('');
  const [state, setState] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [locality, setLocality] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const cityOptions = useMemo(() => citiesForState(state).map((c) => ({ label: c, value: c })), [state]);
  const localityOptions = useMemo(() => localitiesForCity(state, city).map((l) => ({ label: l, value: l })), [state, city]);

  const valid = useMemo(
    () =>
      !!propertyType
      && pgName.trim().length > 1
      && !!state
      && !!city
      && !!locality
      && address.trim().length > 2
      && ownerName.trim().length > 1
      && contactNumber.length === 10,
    [propertyType, pgName, state, city, locality, address, ownerName, contactNumber],
  );

  const submit = () => {
    if (!valid || !propertyType || !state || !city || !locality) {
      Alert.alert('Missing details', 'Please fill the PG type, name, full location, address, owner name and a 10-digit contact number.');
      return;
    }
    invites.add({
      pgName: pgName.trim(),
      propertyType,
      state,
      city,
      locality,
      address: address.trim(),
      ownerName: ownerName.trim(),
      contactNumber,
      images,
    });
    haptic.success();
    setDone(true);
  };

  if (done) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <SuccessBurst size={170} />
        <Text variant="h1" align="center" style={{ marginTop: spacing.lg }}>PG invited 🎉</Text>
        <Text variant="bodyLg" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.sm, maxWidth: 320 }}>
          Thanks for inviting {pgName.trim()}! Our team will review the details and reach out to onboard it onto PGfy.
        </Text>
        <Button label="Done" onPress={() => router.back()} style={{ marginTop: spacing.xl, alignSelf: 'center' }} />
      </View>
    );
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
            options={PG_TYPES.map((t) => ({ label: t, value: t }))}
            onChange={(v) => setPropertyType(v as PgType)}
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
            value={state}
            options={INVITE_STATES.map((s) => ({ label: s, value: s }))}
            onChange={(v) => { setState(v); setCity(null); setLocality(null); }}
          />
          <Dropdown
            label="City"
            placeholder={state ? 'Select city' : 'Select a state first'}
            pickerTitle="Select city"
            value={city}
            options={cityOptions}
            disabled={!state}
            onChange={(v) => { setCity(v); setLocality(null); }}
          />
          <Dropdown
            label="Location / locality"
            placeholder={city ? 'Select location' : 'Select a city first'}
            pickerTitle="Select location"
            value={locality}
            options={localityOptions}
            disabled={!city}
            onChange={setLocality}
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
          <PgImagePicker images={images} onChange={setImages} />
        </Card>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
        <Button label="Submit invite" icon="business-outline" onPress={submit} disabled={!valid} full size="lg" />
      </View>
    </View>
  );
}
