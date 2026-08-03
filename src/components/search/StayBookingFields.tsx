/** Stay booking inputs — hourly, daily, or monthly (used on home & property detail). */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Sheet, Button, PressableScale } from '@/components/ui';
import { formatDayMonth, formatTime12h } from '@/lib/format';
import { defaultCheckOut } from '@/lib/dates';
import { MonthRangeCalendar } from './MonthRangeCalendar';
import { TimeSpinnerPicker, timeHHmmToDate } from './TimeSpinnerPicker';
import type { BookingMode } from '@/data/types';

export interface StayBookingValues {
  checkIn: string;
  checkOut: string;
  startTime: string;
  hours: number;
}

const STAY_TYPE_LABELS: Record<BookingMode, string> = {
  monthly: 'Monthly stay',
  daily: 'Daily stay',
  hourly: 'Hourly stay',
};

const MIN_HOURS = 1;
const MAX_HOURS = 18;

function formatTime12(t: string) {
  return formatTime12h(timeHHmmToDate(t));
}

interface Props {
  mode: BookingMode;
  values: StayBookingValues;
  onChange: (values: StayBookingValues) => void;
  /** Show stay-type label (property detail). Hidden on home where tabs are above. */
  showModeLabel?: boolean;
  compact?: boolean;
}

export function StayBookingFields({ mode, values, onChange, showModeLabel, compact }: Props) {
  if (mode === 'hourly') {
    return (
      <View style={{ gap: compact ? spacing.sm : spacing.md }}>
        {showModeLabel ? <StayTypeRow mode={mode} /> : null}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <FieldButton
            label="Date"
            value={values.checkIn ? formatDayMonth(values.checkIn) : 'Select date'}
            icon="calendar-outline"
            flex
            renderSheet={(close) => (
              <SingleDateSheet
                title="Select date"
                date={values.checkIn}
                onApply={(date) => {
                  onChange({ ...values, checkIn: date, checkOut: date });
                  close();
                }}
              />
            )}
          />
          <FieldButton
            label="Start time"
            value={values.startTime ? formatTime12(values.startTime) : 'Select time'}
            icon="time-outline"
            flex
            renderSheet={(close) => (
              <TimeSpinnerPicker
                value={values.startTime || '10:00'}
                onChange={(startTime) => {
                  onChange({ ...values, startTime });
                  close();
                }}
                applyLabel="Apply time"
              />
            )}
          />
        </View>
        <FieldButton
          label="Duration"
          value={values.hours ? `${values.hours} ${values.hours === 1 ? 'hour' : 'hours'}` : 'Select duration'}
          icon="hourglass-outline"
          renderSheet={(close) => (
            <DurationPickerSheet
              value={values.hours}
              onApply={(hours) => {
                onChange({ ...values, hours });
                close();
              }}
            />
          )}
        />
      </View>
    );
  }

  if (mode === 'daily') {
    return (
      <View style={{ gap: compact ? spacing.sm : spacing.md }}>
        {showModeLabel ? <StayTypeRow mode={mode} /> : null}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <FieldButton
            label="Check-in"
            value={values.checkIn ? formatDayMonth(values.checkIn) : 'Add date'}
            icon="calendar-outline"
            flex
            renderSheet={(close) => (
              <RangeDateSheet
                title="Select stay dates"
                checkIn={values.checkIn}
                checkOut={values.checkOut}
                onApply={({ checkIn, checkOut }) => {
                  onChange({ ...values, checkIn, checkOut });
                  close();
                }}
              />
            )}
          />
          <FieldButton
            label="Check-out"
            value={values.checkOut ? formatDayMonth(values.checkOut) : 'Add date'}
            icon="calendar-outline"
            flex
            renderSheet={(close) => (
              <RangeDateSheet
                title="Select stay dates"
                checkIn={values.checkIn}
                checkOut={values.checkOut}
                onApply={({ checkIn, checkOut }) => {
                  onChange({ ...values, checkIn, checkOut });
                  close();
                }}
              />
            )}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: compact ? spacing.sm : spacing.md }}>
      {showModeLabel ? <StayTypeRow mode={mode} /> : null}
      <FieldButton
        label="Move-in date"
        value={values.checkIn ? formatDayMonth(values.checkIn) : 'Add date'}
        icon="calendar-outline"
        flex
        renderSheet={(close) => (
          <SingleDateSheet
            title="Select move-in date"
            date={values.checkIn}
            onApply={(checkIn) => {
              onChange({ ...values, checkIn, checkOut: defaultCheckOut(checkIn) });
              close();
            }}
          />
        )}
      />
    </View>
  );
}

const fieldRowStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: spacing.sm,
  minHeight: 50,
  paddingHorizontal: spacing.base,
  backgroundColor: palette.surface,
  borderRadius: radius.md,
  borderWidth: 1.5,
  borderColor: palette.border,
};

function DurationPickerSheet({
  value,
  onApply,
}: {
  value: number;
  onApply: (hours: number) => void;
}) {
  const [draftHours, setDraftHours] = useState(value || 4);
  const atMin = draftHours <= MIN_HOURS;
  const atMax = draftHours >= MAX_HOURS;
  const label = draftHours === 1 ? '1 hour' : `${draftHours} hours`;

  return (
    <View style={{ gap: spacing.lg, paddingBottom: spacing.sm }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          backgroundColor: palette.surfaceRaised,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: palette.border,
        }}
      >
        <PressableScale
          onPress={() => !atMin && setDraftHours(draftHours - 1)}
          scaleTo={0.9}
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: atMin ? palette.border : palette.navyTint,
            opacity: atMin ? 0.35 : 1,
          }}
        >
          <Ionicons name="remove" size={24} color={atMin ? palette.inkTertiary : palette.navy} />
        </PressableScale>

        <Text variant="h2" color={palette.ink} style={{ textAlign: 'center', flex: 1 }}>
          {label}
        </Text>

        <PressableScale
          onPress={() => !atMax && setDraftHours(draftHours + 1)}
          scaleTo={0.9}
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: atMax ? palette.border : palette.navyTint,
            opacity: atMax ? 0.35 : 1,
          }}
        >
          <Ionicons name="add" size={24} color={atMax ? palette.inkTertiary : palette.navy} />
        </PressableScale>
      </View>

      <Button
        label="Apply duration"
        full
        size="lg"
        onPress={() => onApply(draftHours)}
      />
    </View>
  );
}

function StayTypeRow({ mode }: { mode: BookingMode }) {
  const icon = mode === 'hourly' ? 'time-outline' : mode === 'daily' ? 'sunny-outline' : 'calendar-outline';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.md,
          backgroundColor: palette.navyTint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={18} color={palette.navy} />
      </View>
      <View>
        <Text variant="caption" color={palette.inkTertiary}>Stay duration</Text>
        <Text variant="bodyMd" weight="700">{STAY_TYPE_LABELS[mode]}</Text>
      </View>
    </View>
  );
}

function FieldButton({
  label,
  value,
  icon,
  flex,
  renderSheet,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  flex?: boolean;
  renderSheet: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const empty = value.startsWith('Select') || value.startsWith('Add');

  return (
    <>
      <View style={flex ? { flex: 1, minWidth: 0 } : { width: '100%' }}>
        <Text variant="caption" color={palette.inkSecondary} style={{ marginBottom: 6 }}>
          {label}
        </Text>
        <PressableScale onPress={() => setOpen(true)} scaleTo={0.99} style={fieldRowStyle}>
          <Ionicons name={icon} size={18} color={palette.inkTertiary} />
          <Text variant="body" color={empty ? palette.inkTertiary : palette.ink} style={{ flex: 1, minWidth: 0 }} numberOfLines={1}>
            {value}
          </Text>
          <Ionicons name="chevron-down" size={18} color={palette.inkTertiary} />
        </PressableScale>
      </View>
      <Sheet visible={open} onClose={() => setOpen(false)} title={label} scroll>
        {renderSheet(() => setOpen(false))}
      </Sheet>
    </>
  );
}

function SingleDateSheet({
  title,
  date,
  onApply,
}: {
  title: string;
  date: string;
  onApply: (date: string) => void;
}) {
  const [draftIn, setDraftIn] = useState(date);
  const [draftOut, setDraftOut] = useState(date);

  useEffect(() => {
    setDraftIn(date);
    setDraftOut(date);
  }, [date]);

  return (
    <View style={{ gap: spacing.lg }}>
      <MonthRangeCalendar
        checkIn={draftIn}
        checkOut={draftOut}
        onChange={({ checkIn: ci }) => {
          setDraftIn(ci);
          setDraftOut(ci);
        }}
      />
      <Button label={title.includes('move') ? 'Apply date' : 'Apply'} full size="lg" disabled={!draftIn} onPress={() => onApply(draftIn)} />
    </View>
  );
}

function RangeDateSheet({
  title,
  checkIn,
  checkOut,
  onApply,
}: {
  title: string;
  checkIn: string;
  checkOut: string;
  onApply: (range: { checkIn: string; checkOut: string }) => void;
}) {
  const [draftIn, setDraftIn] = useState(checkIn);
  const [draftOut, setDraftOut] = useState(checkOut);

  useEffect(() => {
    setDraftIn(checkIn);
    setDraftOut(checkOut);
  }, [checkIn, checkOut]);

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <SummaryChip label="Check-in" value={draftIn ? formatDayMonth(draftIn) : '—'} active={!!draftIn && !draftOut} />
        <SummaryChip label="Check-out" value={draftOut ? formatDayMonth(draftOut) : '—'} active={!!draftOut} />
      </View>
      <MonthRangeCalendar
        checkIn={draftIn}
        checkOut={draftOut}
        onChange={({ checkIn: ci, checkOut: co }) => {
          setDraftIn(ci);
          setDraftOut(co);
        }}
      />
      <Button
        label="Apply dates"
        full
        size="lg"
        disabled={!draftIn}
        onPress={() => onApply({ checkIn: draftIn, checkOut: draftOut || defaultCheckOut(draftIn) })}
      />
    </View>
  );
}

function SummaryChip({ label, value, active }: { label: string; value: string; active?: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: active ? palette.coralTint : palette.surfaceRaised,
        borderWidth: 1,
        borderColor: active ? palette.coral : palette.border,
      }}
    >
      <Text variant="caption" color={palette.inkTertiary}>{label}</Text>
      <Text variant="bodySm" weight="600" color={active ? palette.coralDark : palette.ink} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
