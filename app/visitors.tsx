/** T-S22 — Visitor access management. */
import { useState } from 'react';
import { View, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing } from '@/theme';
import { Text, ScreenHeader, Button, Sheet, Input, IconButton, EmptyState } from '@/components/ui';
import { VisitorCard } from '@/components/domain';
import { EmptyGeneric } from '@/components/illustrations';
import { VISITORS } from '@/data';
import { VisitScheduleFields, initialVisitSchedule } from '@/components/form/VisitScheduleFields';
import { haptic } from '@/lib/haptics';

const EMPTY_FORM = {
  name: '',
  phone: '',
  ...initialVisitSchedule(),
  purpose: '',
};

export default function Visitors() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setSubmitted(false);
    setOpen(true);
  };

  const closeSheet = () => {
    setOpen(false);
    setSubmitted(false);
    setForm(EMPTY_FORM);
  };

  const submit = () => {
    haptic.success();
    setSubmitted(true);
  };

  const set = (key: keyof typeof EMPTY_FORM) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Visitor access" subtitle="Register and manage visitors" right={<IconButton icon="add" color={palette.white} bg={palette.coral} onPress={openNew} />} />
      <FlatList
        data={VISITORS}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'], gap: spacing.md, paddingTop: spacing.sm }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: 4 }}>VISITOR LOG</Text>}
        renderItem={({ item }) => <VisitorCard visitor={item} onShare={() => haptic.light()} />}
        ListEmptyComponent={<EmptyState illustration={<EmptyGeneric />} title="No visitors yet" message="Register a visitor to let them in." />}
      />

      <Sheet visible={open} onClose={closeSheet} title={submitted ? 'Visitor created successfully' : 'New visitor'} scroll>
        {submitted ? (
          <View style={{ gap: spacing.lg, alignItems: 'center', paddingVertical: spacing.md }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: palette.successTint,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="checkmark-circle" size={40} color={palette.success} />
            </View>
            <Text variant="body" color={palette.inkSecondary} align="center">
              {form.name.trim() ? `${form.name.trim()} has been registered.` : 'Your visitor has been registered.'} Property staff will be notified.
            </Text>
            <Button label="Done" onPress={closeSheet} full size="lg" />
          </View>
        ) : (
          <View style={{ gap: spacing.base }}>
            <Input label="Visitor name" icon="person-outline" placeholder="Full name" value={form.name} onChangeText={set('name')} />
            <Input label="Phone number" icon="call-outline" keyboardType="number-pad" placeholder="10-digit mobile" value={form.phone} onChangeText={set('phone')} />
            <VisitScheduleFields
              visitDate={form.visitDate}
              visitTime={form.visitTime}
              onChangeDate={(visitDate) => setForm((f) => ({ ...f, visitDate }))}
              onChangeTime={(visitTime) => setForm((f) => ({ ...f, visitTime }))}
            />
            <Input label="Purpose" icon="flag-outline" placeholder="e.g. Meeting, delivery, family visit" value={form.purpose} onChangeText={set('purpose')} />
            <Button label="Submit" icon="checkmark" onPress={submit} full size="lg" />
          </View>
        )}
      </Sheet>
    </View>
  );
}
