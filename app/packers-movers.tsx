import { useMemo, useState, useEffect } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Input, SegmentedControl, Chip, PressableScale, Dropdown, Sheet } from '@/components/ui';
import { MonthRangeCalendar } from '@/components/search/MonthRangeCalendar';
import { SuccessBurst } from '@/components/illustrations';
import { haptic } from '@/lib/haptics';
import { formatDate } from '@/lib/format';
import { alert } from '@/lib/alertDialog';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const TIME_SLOTS = [
  { key: 'MORNING', label: 'Morning' },
  { key: 'AFTERNOON', label: 'Afternoon' },
  { key: 'EVENING', label: 'Evening' },
];

const ITEM_CATEGORIES = [
  'Clothes',
  'Electronics',
  'Furniture',
  'Kitchen',
  'Personal',
  'Other',
];

const onlyDigits = (s: string) => s.replace(/\D/g, '');

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
];

const stateOptions = INDIAN_STATES.map(s => ({ label: s, value: s }));

export default function PackersMoversEnquiry() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Contact Details
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => {
    if (user) {
      if (user.name) setContactName(user.name);
      if (user.phone) setContactPhone(user.phone);
      if (user.email) setContactEmail(user.email);
    }
  }, [user]);

  // Pickup Location
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [pickupState, setPickupState] = useState('');
  const [pickupPincode, setPickupPincode] = useState('');

  // Destination Location
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [destinationState, setDestinationState] = useState('');
  const [destinationPincode, setDestinationPincode] = useState('');

  // Preferred Date & Time
  const [movingDate, setMovingDate] = useState<string>('');
  const [draftMovingDate, setDraftMovingDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeSlot, setTimeSlot] = useState<string>('MORNING');

  // Items
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleItem = (item: string) => {
    const next = new Set(selectedItems);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    setSelectedItems(next);
  };

  const valid = useMemo(() => {
    return contactName.trim().length > 2
      && contactPhone.length === 10
      && pickupAddress.trim().length > 3
      && pickupCity.trim().length > 2
      && pickupState.trim().length > 2
      && pickupPincode.length === 6
      && destinationAddress.trim().length > 3
      && destinationCity.trim().length > 2
      && destinationState.trim().length > 2
      && destinationPincode.length === 6
      && movingDate.length > 0
      && selectedItems.size > 0;
  }, [
    contactName, contactPhone, pickupAddress, pickupCity, pickupState, pickupPincode,
    destinationAddress, destinationCity, destinationState, destinationPincode,
    movingDate, selectedItems
  ]);

  const submit = () => {
    if (!valid) {
      alert('Missing details', 'Please fill in all required fields accurately.');
      return;
    }
    setSubmitting(true);
    // Simulate API call and fast submission UI change
    setTimeout(() => {
      haptic.success();
      setDone(true);
      setSubmitting(false);
    }, 1500);
  };

  if (done) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <SuccessBurst size={170} />
        <Text variant="h1" align="center" style={{ marginTop: spacing.lg }}>Enquiry submitted</Text>
        <Text variant="bodyLg" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.sm, maxWidth: 320 }}>
          Our moving partners will review your requirements and reach out to {contactName.trim()} at +91-{contactPhone} with a quote.
        </Text>
        <Button label="Done" onPress={() => router.back()} style={{ marginTop: spacing.xl, alignSelf: 'center' }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader
        title="Packers & Movers"
        subtitle="Enquiry for relocation"
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + 110, gap: spacing.base }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="bodySm" color={palette.inkSecondary}>
          Planning to relocate? Tell us your moving details and we'll help you shift smoothly with our trusted partners.
        </Text>

        {/* Pickup Location */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>PICKUP LOCATION</Text>
          <Input label="Address" placeholder="Full address" value={pickupAddress} onChangeText={setPickupAddress} multiline numberOfLines={3} style={{ height: 60, textAlignVertical: 'top' }} />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}><Input label="City" placeholder="City" value={pickupCity} onChangeText={setPickupCity} /></View>
            <View style={{ flex: 1 }}><Input label="Pincode" placeholder="6-digit pincode" keyboardType="number-pad" value={pickupPincode} onChangeText={(v) => setPickupPincode(onlyDigits(v).slice(0, 6))} /></View>
          </View>
          <Dropdown
            label="State"
            placeholder="Select State"
            value={pickupState}
            options={stateOptions}
            onChange={setPickupState}
            pickerTitle="Select State"
          />
        </Card>

        {/* Destination Location */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>DESTINATION LOCATION</Text>
          <Input label="Address" placeholder="Full address" value={destinationAddress} onChangeText={setDestinationAddress} multiline numberOfLines={3} style={{ height: 60, textAlignVertical: 'top' }} />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}><Input label="City" placeholder="City" value={destinationCity} onChangeText={setDestinationCity} /></View>
            <View style={{ flex: 1 }}><Input label="Pincode" placeholder="6-digit pincode" keyboardType="number-pad" value={destinationPincode} onChangeText={(v) => setDestinationPincode(onlyDigits(v).slice(0, 6))} /></View>
          </View>
          <Dropdown
            label="State"
            placeholder="Select State"
            value={destinationState}
            options={stateOptions}
            onChange={setDestinationState}
            pickerTitle="Select State"
          />
        </Card>

        {/* Preferred Date & Time */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>PREFERRED DATE & TIME</Text>
          
          <View>
            <Text variant="bodySm" weight="600" color={palette.inkSecondary} style={{ marginBottom: spacing.sm }}>Moving date</Text>
            <PressableScale
              onPress={() => {
                setDraftMovingDate(movingDate);
                setShowDatePicker(true);
              }}
              scaleTo={0.99}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                minHeight: 50,
                paddingHorizontal: spacing.base,
                backgroundColor: palette.surface,
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderColor: palette.border,
              }}
            >
              <Ionicons name="calendar-outline" size={18} color={palette.inkTertiary} />
              <Text variant="body" color={movingDate ? palette.ink : palette.inkTertiary} style={{ flex: 1 }}>
                {movingDate ? formatDate(movingDate) : 'Select date'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={palette.inkTertiary} />
            </PressableScale>
            
            <Sheet visible={showDatePicker} onClose={() => setShowDatePicker(false)} title="Select moving date" scroll>
              <View style={{ gap: spacing.lg }}>
                <MonthRangeCalendar
                  checkIn={draftMovingDate}
                  checkOut={draftMovingDate}
                  onChange={({ checkIn: ci }) => {
                    setDraftMovingDate(ci);
                  }}
                />
                <Button 
                  label="Confirm date" 
                  full 
                  size="lg"
                  disabled={!draftMovingDate}
                  onPress={() => {
                    setMovingDate(draftMovingDate);
                    setShowDatePicker(false);
                  }} 
                />
              </View>
            </Sheet>
          </View>

          <View>
            <Text variant="bodySm" weight="600" color={palette.inkSecondary} style={{ marginBottom: spacing.sm }}>Time slot</Text>
            <SegmentedControl segments={TIME_SLOTS} value={timeSlot} onChange={setTimeSlot} />
          </View>
        </Card>

        {/* Items */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>ITEMS TO MOVE</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {ITEM_CATEGORIES.map((item) => {
              const active = selectedItems.has(item);
              return (
                <PressableScale
                  key={item}
                  onPress={() => { haptic.select(); toggleItem(item); }}
                  scaleTo={0.95}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: spacing.base,
                    height: 36,
                    borderRadius: radius.pill,
                    backgroundColor: active ? palette.coral : palette.surface,
                    borderWidth: 1,
                    borderColor: active ? palette.coral : palette.border,
                  }}
                >
                  <Text variant="bodySm" weight={active ? '600' : '500'} color={active ? palette.white : palette.inkSecondary}>
                    {item}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </Card>

        {/* Contact */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>CONTACT DETAILS</Text>
          <Input label="Name" placeholder="Full name" value={contactName} onChangeText={setContactName} />
          <Input label="Phone" placeholder="10-digit number" keyboardType="number-pad" value={contactPhone} onChangeText={(v) => setContactPhone(onlyDigits(v).slice(0, 10))} prefix="+91" />
          <Input label="Email" placeholder="Email address" keyboardType="email-address" autoCapitalize="none" value={contactEmail} onChangeText={setContactEmail} />
        </Card>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
        <Button label="Submit enquiry" icon="car-outline" onPress={submit} disabled={!valid || submitting} loading={submitting} full size="lg" />
      </View>
    </View>
  );
}
