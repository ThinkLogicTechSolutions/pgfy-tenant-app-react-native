/** Hour / minute / AM·PM spinner — same pattern as visitor schedule. */
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { palette, spacing, radius } from '@/theme';
import { Button } from '@/components/ui';

export function timeHHmmToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(Number.isFinite(h) ? h : 10, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

export function dateToTimeHHmm(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

interface Props {
  value: string;
  onChange: (hhmm: string) => void;
  /** Inline spinner (sheet body). When false, only renders after user taps (not used here). */
  onDone?: () => void;
  applyLabel?: string;
}

export function TimeSpinnerPicker({ value, onChange, onDone, applyLabel = 'Apply time' }: Props) {
  const [draft, setDraft] = useState(() => timeHHmmToDate(value || '10:00'));

  useEffect(() => {
    setDraft(timeHHmmToDate(value || '10:00'));
  }, [value]);

  const onTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android' && event.type === 'dismissed') return;
    if (!selected) return;
    setDraft(selected);
    if (Platform.OS === 'android') {
      onChange(dateToTimeHHmm(selected));
      onDone?.();
    }
  };

  const apply = () => {
    onChange(dateToTimeHHmm(draft));
    onDone?.();
  };

  return (
    <View style={{ gap: spacing.md }}>
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: palette.border,
          overflow: 'hidden',
        }}
      >
        <DateTimePicker
          value={draft}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
          is24Hour={false}
          locale={Platform.OS === 'ios' ? 'en-US' : undefined}
          themeVariant="light"
          textColor={palette.ink}
          accentColor={palette.coral}
        />
      </View>
      {Platform.OS === 'ios' ? (
        <Button label={applyLabel} full size="lg" onPress={apply} />
      ) : null}
    </View>
  );
}
