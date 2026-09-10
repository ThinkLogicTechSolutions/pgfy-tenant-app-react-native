import { useMemo, useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Input, Dropdown, Sheet } from '@/components/ui';
import { MonthRangeCalendar } from '@/components/search/MonthRangeCalendar';
import { TimeSpinnerPicker, timeHHmmToDate } from '@/components/search';
import { SuccessBurst } from '@/components/illustrations';
import { haptic } from '@/lib/haptics';
import { formatDate, formatTime12h } from '@/lib/format';
import { alert } from '@/lib/alertDialog';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

import { useMasterData } from '@/context/MasterDataContext';
import { createStorageSolutionEnquiry } from '@/lib/api/storageSolution';

const ITEM_CATEGORIES = [
  { label: 'Luggage', value: 'Luggage' },
  { label: 'Box/Carton', value: 'Box/Carton' },
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Appliance', value: 'Appliance' },
  { label: 'Vehicle', value: 'Vehicle' },
  { label: 'Other', value: 'Other' },
];

type Item = {
  id: string;
  name: string;
  category: string;
  quantity: string;
  weight: string;
  description: string;
};

const onlyDigits = (s: string) => s.replace(/\D/g, '');

export default function LuggageStorageEnquiry() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // User Details (Read Only)
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

  const { activeStates, citiesForState, localitiesForCity } = useMasterData();

  // Storage Location Hierarchy (storing IDs as strings for the Dropdown component)
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');

  const stateOptions = useMemo(() => 
    activeStates.map(s => ({ label: s.name, value: String(s.id) })), 
  [activeStates]);
  
  const cityOptions = useMemo(() => {
    if (!selectedStateId) return [];
    return citiesForState(Number(selectedStateId)).map(c => ({ label: c.name, value: String(c.id) }));
  }, [selectedStateId, citiesForState]);

  const locationOptions = useMemo(() => {
    if (!selectedCityId) return [];
    return localitiesForCity(Number(selectedCityId)).map(l => ({ label: `${l.name} Vault`, value: String(l.id) }));
  }, [selectedCityId, localitiesForCity]);

  // Derived names for the confirmation sheet
  const selectedStateName = useMemo(() => activeStates.find(s => String(s.id) === selectedStateId)?.name || '', [activeStates, selectedStateId]);
  const selectedCityName = useMemo(() => citiesForState(Number(selectedStateId)).find(c => String(c.id) === selectedCityId)?.name || '', [citiesForState, selectedStateId, selectedCityId]);
  const selectedLocationName = useMemo(() => localitiesForCity(Number(selectedCityId)).find(l => String(l.id) === selectedLocationId)?.name ? `${localitiesForCity(Number(selectedCityId)).find(l => String(l.id) === selectedLocationId)?.name} Vault` : '', [localitiesForCity, selectedCityId, selectedLocationId]);


  // Storage Duration
  const [fromDate, setFromDate] = useState('');
  const [fromTime, setFromTime] = useState('10:00');
  const [toDate, setToDate] = useState('');
  const [toTime, setToTime] = useState('18:00');

  // Bottom Sheets state for Date/Time Pickers
  const [showFromDate, setShowFromDate] = useState(false);
  const [draftFromDate, setDraftFromDate] = useState('');
  const [showFromTime, setShowFromTime] = useState(false);
  
  const [showToDate, setShowToDate] = useState(false);
  const [draftToDate, setDraftToDate] = useState('');
  const [showToTime, setShowToTime] = useState(false);

  // Items
  const [items, setItems] = useState<Item[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Draft Item
  const [draftName, setDraftName] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftQuantity, setDraftQuantity] = useState('1');
  const [draftWeight, setDraftWeight] = useState('');
  const [draftDescription, setDraftDescription] = useState('');

  const [notes, setNotes] = useState('');
  
  // Confirm Sheet
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);

  const openAddItem = () => {
    setDraftName('');
    setDraftCategory('');
    setDraftQuantity('1');
    setDraftWeight('');
    setDraftDescription('');
    setEditingItemId(null);
    setShowItemForm(true);
  };

  const editItem = (item: Item) => {
    setDraftName(item.name);
    setDraftCategory(item.category);
    setDraftQuantity(item.quantity);
    setDraftWeight(item.weight);
    setDraftDescription(item.description);
    setEditingItemId(item.id);
    setShowItemForm(true);
  };

  const deleteItem = (id: string) => {
    haptic.select();
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const saveItem = () => {
    if (draftName.trim().length < 2 || !draftCategory || !draftQuantity) {
      alert('Missing details', 'Please fill in the required item fields.');
      return;
    }
    const newItem: Item = {
      id: editingItemId || Math.random().toString(36).substring(2, 11),
      name: draftName,
      category: draftCategory,
      quantity: draftQuantity,
      weight: draftWeight,
      description: draftDescription,
    };
    if (editingItemId) {
      setItems((prev) => prev.map((i) => (i.id === editingItemId ? newItem : i)));
    } else {
      setItems((prev) => [...prev, newItem]);
    }
    haptic.success();
    setShowItemForm(false);
  };

    // 1. Strict form validation before the submit button is enabled
  const valid = useMemo(() => {
    const isPhoneValid = /^\d{10}$/.test(contactPhone);
    const isEmailValid = !contactEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail);
    const isDateValid = new Date(fromDate) <= new Date(toDate); // Ensures start date is before/on end date
    
    return (
      contactName.trim().length > 2 &&
      isPhoneValid &&
      isEmailValid &&
      selectedStateId.length > 0 &&
      selectedCityId.length > 0 &&
      selectedLocationId.length > 0 &&
      fromDate.length > 0 &&
      toDate.length > 0 &&
      isDateValid &&
      items.length > 0
    );
  }, [contactName, contactPhone, contactEmail, selectedStateId, selectedCityId, selectedLocationId, fromDate, toDate, items]);

  // 2. Map state directly to the new StorageSolutionEnquiry_POST interface
  const submit = () => {
    setShowConfirmSheet(false);
    setSubmitting(true);
    
    createStorageSolutionEnquiry({
      contact_name: contactName.trim(),
      contact_phone: contactPhone,
      contact_email: contactEmail.trim() || null,
      
      state_id: Number(selectedStateId),
      state_name: selectedStateName || null,
      
      city_id: Number(selectedCityId),
      city_name: selectedCityName || null,
      
      locality_id: Number(selectedLocationId),
      locality_name: selectedLocationName || null,
      
      start_date: new Date(fromDate).toISOString(),
      start_time: formatTime12h(timeHHmmToDate(fromTime)),
      end_date: new Date(toDate).toISOString(),
      end_time: formatTime12h(timeHHmmToDate(toTime)),
      
      items: items.map(item => ({
        name: item.name.trim(),
        category: item.category,
        quantity: Number(item.quantity) || 1,
        weight: item.weight ? Number(item.weight) : undefined,
        description: item.description.trim() || undefined,
      })),
      
      notes: notes.trim() || null,
    })
      .then(() => {
        haptic.success();
        setDone(true);
      })
      .catch((err) => {
        console.error('Storage enquiry submission failed:', err);
        alert('Submission failed', err.message || 'There was an error submitting your request. Please try again.');
        setShowConfirmSheet(true); // Pop the confirmation sheet back up so they can edit
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  if (done) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <SuccessBurst size={170} />
        <Text variant="h1" align="center" style={{ marginTop: spacing.lg }}>Request submitted</Text>
        <Text variant="bodyLg" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.sm, maxWidth: 320 }}>
          Your luggage storage request has been sent to the property manager. We'll update you shortly.
        </Text>
        <Button label="Done" onPress={() => router.back()} style={{ marginTop: spacing.xl, alignSelf: 'center' }} />
      </View>
    );
  }

  const renderDateTimeRow = (
    label: string, 
    dateValue: string, 
    timeValue: string, 
    onPressDate: () => void, 
    onPressTime: () => void
  ) => (
    <View style={{ gap: spacing.xs }}>
      <Text variant="bodySm" weight="500" color={palette.inkSecondary}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Pressable
          onPress={onPressDate}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.sm,
            height: 48,
            borderRadius: radius.sm,
            backgroundColor: pressed ? palette.surfaceRaised : palette.surface,
            borderWidth: 1.5,
            borderColor: palette.border,
          })}
        >
          <Ionicons name="calendar-outline" size={16} color={palette.inkTertiary} />
          <Text variant="body" color={dateValue ? palette.ink : palette.inkTertiary} style={{ flex: 1 }} numberOfLines={1}>
            {dateValue ? formatDate(dateValue) : 'Select Date'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onPressTime}
          style={({ pressed }) => ({
            flex: 0.8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.sm,
            height: 48,
            borderRadius: radius.sm,
            backgroundColor: pressed ? palette.surfaceRaised : palette.surface,
            borderWidth: 1.5,
            borderColor: palette.border,
          })}
        >
          <Ionicons name="time-outline" size={16} color={palette.inkTertiary} />
          <Text variant="body" color={palette.ink} style={{ flex: 1 }} numberOfLines={1}>
            {formatTime12h(timeHHmmToDate(timeValue))}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader
        title="Luggage Storage"
        subtitle="Store your luggage safely for a selected period."
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + 110, gap: spacing.base }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* User Details */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>USER DETAILS</Text>
          <Input label="Name" value={contactName} editable={false} style={{ opacity: 0.7 }} />
          <Input label="Phone" value={contactPhone} editable={false} prefix="+91" style={{ opacity: 0.7 }} />
          <Input label="Email" value={contactEmail} editable={false} style={{ opacity: 0.7 }} />
        </Card>

        {/* Storage Location */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>STORAGE LOCATION</Text>
          <Dropdown
            label="Select State"
            placeholder="Select state"
            value={selectedStateId}
            options={stateOptions}
            onChange={(v) => {
              setSelectedStateId(v);
              setSelectedCityId('');
              setSelectedLocationId('');
            }}
            pickerTitle="Select State"
          />
          {selectedStateId ? (
            <Dropdown
              label="Select City"
              placeholder="Select city"
              value={selectedCityId}
              options={cityOptions}
              onChange={(v) => {
                setSelectedCityId(v);
                setSelectedLocationId('');
              }}
              pickerTitle="Select City"
            />
          ) : null}
          {selectedCityId ? (
            <Dropdown
              label="Select Storage Location"
              placeholder="Select a location"
              value={selectedLocationId}
              options={locationOptions}
              onChange={setSelectedLocationId}
              pickerTitle="Storage Location"
            />
          ) : null}
        </Card>

        {/* Storage Duration */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>STORAGE DURATION</Text>
          
          {renderDateTimeRow(
            'Storage From', 
            fromDate, 
            fromTime, 
            () => { setDraftFromDate(fromDate); setShowFromDate(true); }, 
            () => setShowFromTime(true)
          )}
          
          {renderDateTimeRow(
            'Storage To', 
            toDate, 
            toTime, 
            () => { setDraftToDate(toDate); setShowToDate(true); }, 
            () => setShowToTime(true)
          )}
        </Card>

        {/* Items to Store */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>ITEMS TO STORE</Text>
          
          {items.length === 0 ? (
            <View style={{ paddingVertical: spacing.lg, alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="cube-outline" size={40} color={palette.inkTertiary} style={{ opacity: 0.5 }} />
              <Text variant="bodyMd" weight="500" color={palette.inkSecondary}>No items added yet</Text>
              <Text variant="caption" color={palette.inkTertiary} align="center" style={{ maxWidth: 200 }}>
                Add the luggage or items you want to store.
              </Text>
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {items.map((item) => (
                <View 
                  key={item.id} 
                  style={{ 
                    padding: spacing.md, 
                    borderRadius: radius.md, 
                    backgroundColor: palette.surfaceRaised, 
                    borderWidth: 1, 
                    borderColor: palette.border 
                  }}
                >
                  <Text variant="bodyMd" weight="600" color={palette.ink} style={{ marginBottom: spacing.xs }}>{item.name}</Text>
                  
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: item.description ? spacing.xs : 0 }}>
                    <Text variant="caption" color={palette.inkSecondary}>Category: <Text weight="600">{item.category}</Text></Text>
                    <Text variant="caption" color={palette.inkTertiary}>•</Text>
                    <Text variant="caption" color={palette.inkSecondary}>Qty: <Text weight="600">{item.quantity}</Text></Text>
                    {item.weight ? (
                      <>
                        <Text variant="caption" color={palette.inkTertiary}>•</Text>
                        <Text variant="caption" color={palette.inkSecondary}>Weight: <Text weight="600">{item.weight}</Text></Text>
                      </>
                    ) : null}
                  </View>
                  
                  {item.description ? (
                    <Text variant="caption" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>{item.description}</Text>
                  ) : <View style={{ height: spacing.sm }} />}
                  
                  <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs, borderTopWidth: 1, borderTopColor: palette.border, paddingTop: spacing.sm }}>
                    <Pressable onPress={() => editItem(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="pencil" size={14} color={palette.coral} />
                      <Text variant="caption" weight="600" color={palette.coral}>Edit</Text>
                    </Pressable>
                    <Pressable onPress={() => deleteItem(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="trash" size={14} color={palette.danger} />
                      <Text variant="caption" weight="600" color={palette.danger}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          <Button label="+ Add Item" variant="outline" onPress={openAddItem} style={{ marginTop: spacing.xs }} />
        </Card>

        {/* Additional Notes */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="overline" color={palette.inkTertiary}>ADDITIONAL NOTES</Text>
          <Input 
            placeholder="Add any special instructions..." 
            value={notes} 
            onChangeText={setNotes} 
            multiline 
            numberOfLines={4} 
            style={{ height: 80, textAlignVertical: 'top' }} 
          />
        </Card>

      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
        <Button label="Submit Storage Request" onPress={() => setShowConfirmSheet(true)} disabled={!valid || submitting} loading={submitting} full size="lg" />
      </View>

      {/* Date & Time Sheets */}
      <Sheet visible={showFromDate} onClose={() => setShowFromDate(false)} title="Select From Date" scroll>
        <View style={{ gap: spacing.lg }}>
          <MonthRangeCalendar
            checkIn={draftFromDate}
            checkOut={draftFromDate}
            onChange={({ checkIn: ci }) => {
              setDraftFromDate(ci);
            }}
          />
          <Button 
            label="Confirm date" 
            full 
            size="lg"
            disabled={!draftFromDate}
            onPress={() => {
              setFromDate(draftFromDate);
              setShowFromDate(false);
            }} 
          />
        </View>
      </Sheet>

      <Sheet visible={showFromTime} onClose={() => setShowFromTime(false)} title="Select From Time">
        <TimeSpinnerPicker 
          value={fromTime} 
          onChange={setFromTime} 
          onDone={() => setShowFromTime(false)} 
        />
      </Sheet>

      <Sheet visible={showToDate} onClose={() => setShowToDate(false)} title="Select To Date" scroll>
        <View style={{ gap: spacing.lg }}>
          <MonthRangeCalendar
            checkIn={draftToDate}
            checkOut={draftToDate}
            onChange={({ checkIn: ci }) => {
              setDraftToDate(ci);
            }}
          />
          <Button 
            label="Confirm date" 
            full 
            size="lg"
            disabled={!draftToDate}
            onPress={() => {
              setToDate(draftToDate);
              setShowToDate(false);
            }} 
          />
        </View>
      </Sheet>

      <Sheet visible={showToTime} onClose={() => setShowToTime(false)} title="Select To Time">
        <TimeSpinnerPicker 
          value={toTime} 
          onChange={setToTime} 
          onDone={() => setShowToTime(false)} 
        />
      </Sheet>

      {/* Add Item Sheet */}
      <Sheet visible={showItemForm} onClose={() => setShowItemForm(false)} title={editingItemId ? "Edit Item" : "Add Item"} scroll>
        <View style={{ gap: spacing.md, paddingBottom: spacing.xxl }}>
          <Input label="Item Name" placeholder="e.g. Large Suitcase" value={draftName} onChangeText={setDraftName} />
          <Dropdown
            label="Category"
            placeholder="Select category"
            value={draftCategory}
            options={ITEM_CATEGORIES}
            onChange={setDraftCategory}
            pickerTitle="Select Category"
          />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Input label="Quantity" keyboardType="number-pad" value={draftQuantity} onChangeText={(v) => setDraftQuantity(onlyDigits(v))} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Approx. Weight" placeholder="e.g. 20 kg" value={draftWeight} onChangeText={setDraftWeight} />
            </View>
          </View>
          <Input 
            label="Description (Optional)" 
            placeholder="Add any specific details..." 
            value={draftDescription} 
            onChangeText={setDraftDescription} 
            multiline 
            numberOfLines={3} 
            style={{ height: 60, textAlignVertical: 'top' }} 
          />
          
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
            <Button label="Cancel" variant="outline" full style={{ flex: 1 }} onPress={() => setShowItemForm(false)} />
            <Button label={editingItemId ? "Save Changes" : "Add Item"} full style={{ flex: 1 }} onPress={saveItem} />
          </View>
        </View>
      </Sheet>

      {/* Confirmation Sheet */}
      <Sheet visible={showConfirmSheet} onClose={() => setShowConfirmSheet(false)} title="Confirm Storage Request" scroll>
        <View style={{ gap: spacing.lg, paddingBottom: spacing.xxl }}>
          <Text variant="bodyMd" color={palette.inkSecondary}>
            Please review your details before submitting your request.
          </Text>

          {/* User Details */}
          <View style={{ gap: spacing.sm }}>
            <Text variant="overline" color={palette.inkTertiary}>USER DETAILS</Text>
            <View>
              <Text variant="caption" color={palette.inkSecondary}>Name</Text>
              <Text variant="body" weight="500">{contactName}</Text>
            </View>
            <View>
              <Text variant="caption" color={palette.inkSecondary}>Phone</Text>
              <Text variant="body" weight="500">+91 {contactPhone}</Text>
            </View>
            <View>
              <Text variant="caption" color={palette.inkSecondary}>Email</Text>
              <Text variant="body" weight="500">{contactEmail}</Text>
            </View>
          </View>

          {/* Storage Location */}
          <View style={{ gap: spacing.sm }}>
            <Text variant="overline" color={palette.inkTertiary}>STORAGE LOCATION</Text>
            <View>
              <Text variant="caption" color={palette.inkSecondary}>State</Text>
              <Text variant="body" weight="500">{selectedStateName}</Text>
            </View>
            <View>
              <Text variant="caption" color={palette.inkSecondary}>City</Text>
              <Text variant="body" weight="500">{selectedCityName}</Text>
            </View>
            <View>
              <Text variant="caption" color={palette.inkSecondary}>Storage Location</Text>
              <Text variant="body" weight="500">{selectedLocationName}</Text>
            </View>
          </View>

          {/* Storage Duration */}
          <View style={{ gap: spacing.sm }}>
            <Text variant="overline" color={palette.inkTertiary}>STORAGE DURATION</Text>
            <View>
              <Text variant="caption" color={palette.inkSecondary}>From</Text>
              <Text variant="body" weight="500">
                {fromDate ? `${formatDate(fromDate)} · ${formatTime12h(timeHHmmToDate(fromTime))}` : '—'}
              </Text>
            </View>
            <View>
              <Text variant="caption" color={palette.inkSecondary}>To</Text>
              <Text variant="body" weight="500">
                {toDate ? `${formatDate(toDate)} · ${formatTime12h(timeHHmmToDate(toTime))}` : '—'}
              </Text>
            </View>
          </View>

          {/* Items */}
          <View style={{ gap: spacing.sm }}>
            <Text variant="overline" color={palette.inkTertiary}>ITEMS TO STORE</Text>
            {items.map((item, index) => (
              <View 
                key={item.id} 
                style={{ 
                  padding: spacing.md, 
                  borderRadius: radius.md, 
                  backgroundColor: palette.surfaceRaised, 
                  borderWidth: 1, 
                  borderColor: palette.border 
                }}
              >
                <Text variant="bodyMd" weight="600" color={palette.ink} style={{ marginBottom: spacing.xs }}>
                  {index + 1}. {item.name}
                </Text>
                
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: item.description ? spacing.xs : 0 }}>
                  <Text variant="caption" color={palette.inkSecondary}>Category: <Text weight="600">{item.category}</Text></Text>
                  <Text variant="caption" color={palette.inkTertiary}>•</Text>
                  <Text variant="caption" color={palette.inkSecondary}>Qty: <Text weight="600">{item.quantity}</Text></Text>
                  {item.weight ? (
                    <>
                      <Text variant="caption" color={palette.inkTertiary}>•</Text>
                      <Text variant="caption" color={palette.inkSecondary}>Weight: <Text weight="600">{item.weight}</Text></Text>
                    </>
                  ) : null}
                </View>
                
                {item.description ? (
                  <Text variant="caption" color={palette.inkSecondary}>Description: <Text weight="600">{item.description}</Text></Text>
                ) : null}
              </View>
            ))}
          </View>

          {/* Additional Notes */}
          {notes.trim().length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <Text variant="overline" color={palette.inkTertiary}>ADDITIONAL NOTES</Text>
              <Text variant="body">{notes}</Text>
            </View>
          ) : null}
          
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
            <Button label="Go Back / Edit" variant="outline" full style={{ flex: 1 }} onPress={() => setShowConfirmSheet(false)} />
            <Button label="Confirm & Submit" full style={{ flex: 1.5 }} onPress={submit} />
          </View>
        </View>
      </Sheet>

    </View>
  );
}
