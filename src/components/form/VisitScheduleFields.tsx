/** Visit date & time pickers for visitor registration. */
import { useState } from 'react';
import { Platform, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, PressableScale } from '@/components/ui';
import { formatDate, formatTime12h, NOW } from '@/lib/format';
import { startOfToday, toIso } from '@/lib/calendar';

function defaultTime(): Date {
  const d = new Date(NOW);
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

interface Props {
  visitDate: string;
  visitTime: string;
  onChangeDate: (iso: string) => void;
  onChangeTime: (label: string) => void;
}

export function VisitScheduleFields({ visitDate, visitTime, onChangeDate, onChangeTime }: Props) {
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const [dateValue, setDateValue] = useState(() => (visitDate ? new Date(`${visitDate}T12:00:00`) : startOfToday()));
  const [timeValue, setTimeValue] = useState(defaultTime);

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setPicker(null);
    if (event.type === 'dismissed') {
      setPicker(null);
      return;
    }
    if (!selected) return;
    setDateValue(selected);
    onChangeDate(toIso(selected));
  };

  const onTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setPicker(null);
    if (event.type === 'dismissed') {
      setPicker(null);
      return;
    }
    if (!selected) return;
    setTimeValue(selected);
    onChangeTime(formatTime12h(selected));
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <PickerField
          label="Visit date"
          icon="calendar-outline"
          value={visitDate ? formatDate(visitDate) : 'Select date'}
          empty={!visitDate}
          onPress={() => setPicker((p) => (p === 'date' ? null : 'date'))}
        />
        <PickerField
          label="Visit time"
          icon="time-outline"
          value={visitTime || 'Select time'}
          empty={!visitTime}
          onPress={() => setPicker((p) => (p === 'time' ? null : 'time'))}
        />
      </View>

      {picker === 'date' ? (
        <View style={pickerWrapStyle}>
          <DateTimePicker
            value={dateValue}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={startOfToday()}
            onChange={onDateChange}
            themeVariant="light"
            textColor={palette.ink}
            accentColor={palette.coral}
          />
          {Platform.OS === 'ios' ? (
            <PressableScale onPress={() => setPicker(null)} scaleTo={0.98} style={{ alignSelf: 'flex-end', paddingVertical: spacing.sm }}>
              <Text variant="bodySm" weight="600" color={palette.coralDark}>Done</Text>
            </PressableScale>
          ) : null}
        </View>
      ) : null}

      {picker === 'time' ? (
        <View style={pickerWrapStyle}>
          <DateTimePicker
            value={timeValue}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
            is24Hour={false}
            locale={Platform.OS === 'ios' ? 'en-US' : undefined}
            themeVariant="light"
            textColor={palette.ink}
            accentColor={palette.coral}
          />
          {Platform.OS === 'ios' ? (
            <PressableScale onPress={() => setPicker(null)} scaleTo={0.98} style={{ alignSelf: 'flex-end', paddingVertical: spacing.sm }}>
              <Text variant="bodySm" weight="600" color={palette.coralDark}>Done</Text>
            </PressableScale>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const pickerWrapStyle = {
  backgroundColor: palette.surface,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: palette.border,
  overflow: 'hidden' as const,
};

function PickerField({
  label,
  icon,
  value,
  empty,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  empty: boolean;
  onPress: () => void;
}) {
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
        <Ionicons name={icon} size={18} color={palette.inkTertiary} />
        <Text variant="body" color={empty ? palette.inkTertiary : palette.ink} style={{ flex: 1 }} numberOfLines={1}>
          {value}
        </Text>
        <Ionicons name="chevron-down" size={18} color={palette.inkTertiary} />
      </PressableScale>
    </View>
  );
}

export function initialVisitSchedule() {
  return {
    visitDate: toIso(startOfToday()),
    visitTime: formatTime12h(defaultTime()),
  };
}
