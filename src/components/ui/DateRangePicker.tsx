/** Single date-range filter button — This Month / Last Month / This Year / Last Year / Custom.
 * Custom opens an inline range calendar capped to [today - 2 years, today]. */
import { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/theme';
import { Text } from './Text';
import { PressableScale } from './PressableScale';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { haptic } from '@/lib/haptics';
import {
  DATE_RANGE_PRESETS,
  MIN_SELECTABLE,
  MAX_SELECTABLE,
  dateRangeLabel,
  fmtShort,
  rangeForPreset,
  toISO,
  fromISO,
  type DateRangeValue,
  type DateRangePreset,
} from '@/lib/dateRange';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

interface Props {
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
}

export function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'menu' | 'calendar'>('menu');
  const [draftFrom, setDraftFrom] = useState(value.from);
  const [draftTo, setDraftTo] = useState(value.to);
  const [pickingStart, setPickingStart] = useState(true);
  const [month, setMonth] = useState(() => fromISO(value.to || MAX_SELECTABLE));

  const min = fromISO(MIN_SELECTABLE);
  const max = fromISO(MAX_SELECTABLE);

  const openSheet = () => {
    setView('menu');
    setDraftFrom(value.from);
    setDraftTo(value.to);
    setPickingStart(true);
    setMonth(fromISO(value.to || MAX_SELECTABLE));
    setOpen(true);
  };

  const pickPreset = (id: Exclude<DateRangePreset, 'custom'>) => {
    onChange({ preset: id, ...rangeForPreset(id) });
    haptic.select();
    setOpen(false);
  };

  const openCustom = () => {
    setView('calendar');
    haptic.select();
  };

  const goMonth = (delta: number) => {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
    haptic.select();
  };

  const tapDay = (date: Date) => {
    const iso = toISO(date);
    if (pickingStart) {
      setDraftFrom(iso);
      setDraftTo(iso);
      setPickingStart(false);
    } else if (iso < draftFrom) {
      setDraftFrom(iso);
      setDraftTo(draftFrom);
      setPickingStart(true);
    } else {
      setDraftTo(iso);
      setPickingStart(true);
    }
    haptic.select();
  };

  const applyCustom = () => {
    onChange({ preset: 'custom', from: draftFrom, to: draftTo });
    haptic.success();
    setOpen(false);
  };

  const year = month.getFullYear();
  const mIdx = month.getMonth();
  const firstWeekday = new Date(year, mIdx, 1).getDay();
  const daysInMonth = new Date(year, mIdx + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const atMinMonth = sameMonth(month, min) || startOfMonthDate(month) < startOfMonthDate(min);
  const atMaxMonth = sameMonth(month, max) || startOfMonthDate(month) > startOfMonthDate(max);

  return (
    <>
      <PressableScale
        onPress={openSheet}
        haptics={false}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: palette.navyTint,
          borderWidth: 1,
          borderColor: palette.navy,
          borderRadius: radius.pill,
          paddingVertical: 8,
          paddingHorizontal: 14,
        }}
      >
        <Ionicons name="calendar-outline" size={15} color={palette.navy} />
        <Text variant="bodySm" weight="700" color={palette.navy}>
          {dateRangeLabel(value)}
        </Text>
        <Ionicons name="chevron-down" size={15} color={palette.navy} />
      </PressableScale>

      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        title={view === 'menu' ? 'Filter by date' : 'Custom range'}
      >
        {view === 'menu' ? (
          <View>
            {DATE_RANGE_PRESETS.map((p) => {
              const active = value.preset === p.id;
              return (
                <PressableScale
                  key={p.id}
                  onPress={() => pickPreset(p.id)}
                  scaleTo={0.98}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md }}
                >
                  <Text variant="bodyMd" weight={active ? '700' : '500'} color={active ? palette.navy : palette.ink}>
                    {p.label}
                  </Text>
                  {active ? <Ionicons name="checkmark-circle" size={22} color={palette.navy} /> : null}
                </PressableScale>
              );
            })}
            <PressableScale
              onPress={openCustom}
              scaleTo={0.98}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md }}
            >
              <Text variant="bodyMd" weight={value.preset === 'custom' ? '700' : '500'} color={value.preset === 'custom' ? palette.navy : palette.ink}>
                Custom
              </Text>
              <Ionicons name="chevron-forward" size={18} color={value.preset === 'custom' ? palette.navy : palette.inkTertiary} />
            </PressableScale>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="bodySm" color={palette.inkSecondary}>
                {pickingStart ? 'Select start date' : 'Select end date'}
              </Text>
              <Text variant="bodySm" weight="700" color={palette.navy}>
                {fmtShort(draftFrom)} – {fmtShort(draftTo)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs }}>
              <PressableScale onPress={() => goMonth(-1)} disabled={atMinMonth} style={[navBtn, atMinMonth && { opacity: 0.35 }]}>
                <Ionicons name="chevron-back" size={20} color={palette.ink} />
              </PressableScale>
              <Text variant="bodyLg" weight="700">{MONTHS[mIdx]} {year}</Text>
              <PressableScale onPress={() => goMonth(1)} disabled={atMaxMonth} style={[navBtn, atMaxMonth && { opacity: 0.35 }]}>
                <Ionicons name="chevron-forward" size={20} color={palette.ink} />
              </PressableScale>
            </View>

            <View style={{ flexDirection: 'row' }}>
              {WEEKDAYS.map((w, i) => (
                <Text key={i} variant="caption" color={palette.inkTertiary} align="center" style={{ flex: 1 }}>{w}</Text>
              ))}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {cells.map((day, i) => {
                if (day === null) return <View key={`b${i}`} style={{ width: `${100 / 7}%`, height: 40 }} />;
                const date = new Date(year, mIdx, day);
                const iso = toISO(date);
                const disabled = startOfDay(date) < startOfDay(min) || startOfDay(date) > startOfDay(max);
                const isStart = iso === draftFrom;
                const isEnd = iso === draftTo;
                const inRange = iso > draftFrom && iso < draftTo;
                return (
                  <View
                    key={day}
                    style={{
                      width: `${100 / 7}%`,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: inRange ? palette.navyTint : 'transparent',
                    }}
                  >
                    <PressableScale
                      disabled={disabled}
                      onPress={() => tapDay(date)}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isStart || isEnd ? palette.navy : 'transparent',
                      }}
                    >
                      <Text
                        variant="bodyMd"
                        weight={isStart || isEnd ? '700' : '500'}
                        color={disabled ? palette.inkTertiary : isStart || isEnd ? palette.white : palette.ink}
                      >
                        {day}
                      </Text>
                    </PressableScale>
                  </View>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button label="Back" variant="outline" onPress={() => setView('menu')} style={{ flex: 1 }} />
              <Button label="Apply" onPress={applyCustom} style={{ flex: 1 }} />
            </View>
          </View>
        )}
      </Sheet>
    </>
  );
}

function startOfMonthDate(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

const navBtn = {
  width: 36,
  height: 36,
  borderRadius: radius.md,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  backgroundColor: palette.surfaceRaised,
};
