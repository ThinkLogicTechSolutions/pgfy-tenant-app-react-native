import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Sheet, Button, PressableScale } from '@/components/ui';
import { formatDayMonth } from '@/lib/format';
import { defaultCheckOut } from '@/lib/dates';
import { MonthRangeCalendar } from './MonthRangeCalendar';

interface Props {
  checkIn: string;
  checkOut: string;
  onChange: (range: { checkIn: string; checkOut: string }) => void;
  checkInLabel?: string;
  checkOutLabel?: string;
  sheetTitle?: string;
  applyLabel?: string;
  /** Earliest/latest selectable date — defaults match `MonthRangeCalendar` (today, unbounded). */
  minDate?: Date;
  maxDate?: Date;
}

export function StayDateRangeField({
  checkIn,
  checkOut,
  onChange,
  checkInLabel = 'Check-in',
  checkOutLabel = 'Check-out',
  sheetTitle = 'Select stay dates',
  applyLabel = 'Apply dates',
  minDate,
  maxDate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [draftIn, setDraftIn] = useState(checkIn);
  const [draftOut, setDraftOut] = useState(checkOut);

  useEffect(() => {
    if (!open) {
      setDraftIn(checkIn);
      setDraftOut(checkOut);
    }
  }, [checkIn, checkOut, open]);

  const openPicker = () => {
    setDraftIn(checkIn);
    setDraftOut(checkOut);
    setOpen(true);
  };

  const apply = () => {
    if (!draftIn) return;
    const out = draftOut || defaultCheckOut(draftIn);
    onChange({ checkIn: draftIn, checkOut: out });
    setOpen(false);
  };

  return (
    <>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <DateField label={checkInLabel} value={checkIn ? formatDayMonth(checkIn) : 'Add date'} onPress={openPicker} />
        <DateField label={checkOutLabel} value={checkOut ? formatDayMonth(checkOut) : 'Add date'} onPress={openPicker} />
      </View>

      <Sheet visible={open} onClose={() => setOpen(false)} title={sheetTitle} scroll>
        <View style={{ gap: spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <SummaryChip label={checkInLabel} value={draftIn ? formatDayMonth(draftIn) : '—'} active={!!draftIn && !draftOut} />
            <SummaryChip label={checkOutLabel} value={draftOut ? formatDayMonth(draftOut) : '—'} active={!!draftOut} />
          </View>

          <MonthRangeCalendar
            checkIn={draftIn}
            checkOut={draftOut}
            onChange={({ checkIn: ci, checkOut: co }) => {
              setDraftIn(ci);
              setDraftOut(co);
            }}
            minDate={minDate}
            maxDate={maxDate}
          />

          <Button label={applyLabel} full size="lg" disabled={!draftIn} onPress={apply} />
        </View>
      </Sheet>
    </>
  );
}

function DateField({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  const empty = value === 'Add date';
  return (
    <View style={{ flex: 1 }}>
      <Text variant="caption" color={palette.inkSecondary} style={{ marginBottom: 6 }}>
        {label}
      </Text>
      <PressableScale
        onPress={onPress}
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
        <Text variant="body" color={empty ? palette.inkTertiary : palette.ink} style={{ flex: 1, minWidth: 0 }} numberOfLines={1}>
          {value}
        </Text>
        <Ionicons name="chevron-down" size={18} color={palette.inkTertiary} />
      </PressableScale>
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
      <Text variant="caption" color={palette.inkTertiary}>
        {label}
      </Text>
      <Text variant="bodySm" weight="600" color={active ? palette.coralDark : palette.ink} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
