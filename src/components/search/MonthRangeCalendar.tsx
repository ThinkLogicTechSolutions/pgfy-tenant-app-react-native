import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { palette, spacing, radius } from '@/theme';
import { Text, PressableScale } from '@/components/ui';
import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  formatMonthYear,
  addMonths,
  isSameDay,
  isInRange,
  isBeforeDay,
  startOfToday,
  parseIso,
  toIso,
  nightsBetween,
  type CalendarCell,
} from '@/lib/calendar';
import { haptic } from '@/lib/haptics';

const SWIPE_THRESHOLD = 48;
const SWIPE_VELOCITY = 380;

interface Props {
  checkIn: string;
  checkOut: string;
  onChange: (range: { checkIn: string; checkOut: string }) => void;
}

export function MonthRangeCalendar({ checkIn, checkOut, onChange }: Props) {
  const today = startOfToday();
  const initial = checkIn ? parseIso(checkIn) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const translateX = useSharedValue(0);

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth, today), [viewYear, viewMonth, today]);

  const canGoPrev =
    viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const goPrev = useCallback(() => {
    const { year, month } = addMonths(viewYear, viewMonth, -1);
    const min = today;
    if (year < min.getFullYear() || (year === min.getFullYear() && month < min.getMonth())) return;
    setViewYear(year);
    setViewMonth(month);
  }, [viewYear, viewMonth, today]);

  const goNext = useCallback(() => {
    const { year, month } = addMonths(viewYear, viewMonth, 1);
    setViewYear(year);
    setViewMonth(month);
  }, [viewYear, viewMonth]);

  const navigatePrev = useCallback(() => {
    if (!canGoPrev) return;
    haptic.select();
    goPrev();
  }, [canGoPrev, goPrev]);

  const navigateNext = useCallback(() => {
    haptic.select();
    goNext();
  }, [goNext]);

  const swipeMonth = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-22, 22])
        .failOffsetY([-16, 16])
        .onUpdate((e) => {
          const max = 120;
          let tx = e.translationX;
          if (tx > max) tx = max;
          if (tx < -max) tx = -max;
          translateX.value = tx;
        })
        .onEnd((e) => {
          if (e.translationX < -SWIPE_THRESHOLD || e.velocityX < -SWIPE_VELOCITY) {
            runOnJS(navigateNext)();
          } else if (e.translationX > SWIPE_THRESHOLD || e.velocityX > SWIPE_VELOCITY) {
            runOnJS(navigatePrev)();
          }
          translateX.value = withTiming(0, { duration: 220 });
        }),
    [navigateNext, navigatePrev, translateX],
  );

  const gridAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const pickDay = (iso: string) => {
    haptic.select();
    if (!checkIn || (checkIn && checkOut)) {
      onChange({ checkIn: iso, checkOut: '' });
      return;
    }
    if (isBeforeDay(iso, checkIn)) {
      onChange({ checkIn: iso, checkOut: '' });
      return;
    }
    if (isSameDay(iso, checkIn)) return;
    onChange({ checkIn, checkOut: iso });
  };

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <PressableScale onPress={navigatePrev} scaleTo={0.9} disabled={!canGoPrev} style={{ opacity: canGoPrev ? 1 : 0.35, padding: 8 }}>
          <Ionicons name="chevron-back" size={22} color={palette.navy} />
        </PressableScale>
        <Text variant="bodyMd" weight="700">
          {formatMonthYear(viewYear, viewMonth)}
        </Text>
        <PressableScale onPress={navigateNext} scaleTo={0.9} style={{ padding: 8 }}>
          <Ionicons name="chevron-forward" size={22} color={palette.navy} />
        </PressableScale>
      </View>

      <GestureDetector gesture={swipeMonth}>
        <Animated.View style={gridAnimStyle}>
          <View style={{ flexDirection: 'row' }}>
            {WEEKDAY_LABELS.map((w) => (
              <View key={w} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
                <Text variant="caption" color={palette.inkTertiary} weight="600">
                  {w}
                </Text>
              </View>
            ))}
          </View>

          <MonthGrid
            grid={grid}
            checkIn={checkIn}
            checkOut={checkOut}
            today={today}
            onPickDay={pickDay}
          />
        </Animated.View>
      </GestureDetector>

      <Text variant="caption" color={palette.inkTertiary} align="center">
        {checkIn && !checkOut
          ? 'Select your check-out date'
          : checkIn && checkOut
            ? `${nightsBetween(checkIn, checkOut)} night${nightsBetween(checkIn, checkOut) === 1 ? '' : 's'} selected`
            : 'Select check-in, then check-out'}
      </Text>
    </View>
  );
}

function MonthGrid({
  grid,
  checkIn,
  checkOut,
  today,
  onPickDay,
}: {
  grid: CalendarCell[];
  checkIn: string;
  checkOut: string;
  today: Date;
  onPickDay: (iso: string) => void;
}) {
  return (
    <View style={{ gap: 2, marginTop: 2 }}>
      {chunk(grid, 7).map((week, wi) => (
        <View key={`w-${wi}`} style={{ flexDirection: 'row' }}>
          {week.map((cell) => {
            if (cell.kind === 'empty') {
              return <View key={cell.key} style={{ flex: 1, aspectRatio: 1 }} />;
            }

            const isStart = checkIn && isSameDay(cell.iso, checkIn);
            const isEnd = checkOut && isSameDay(cell.iso, checkOut);
            const inRange =
              checkIn && checkOut && !isStart && !isEnd && isInRange(cell.iso, checkIn, checkOut);
            const isToday = isSameDay(cell.iso, toIso(today));

            let bg = 'transparent';
            let fg: string = palette.ink;
            if (cell.disabled) {
              fg = palette.inkTertiary;
            } else if (isStart || isEnd) {
              bg = palette.coral;
              fg = palette.white;
            } else if (inRange) {
              bg = palette.coralTint;
              fg = palette.coralDark;
            }

            return (
              <PressableScale
                key={cell.key}
                onPress={() => !cell.disabled && onPickDay(cell.iso)}
                scaleTo={0.92}
                disabled={cell.disabled}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: bg,
                  borderRadius: isStart || isEnd ? radius.md : inRange ? 0 : radius.sm,
                  borderWidth: isToday && !isStart && !isEnd ? 1.5 : 0,
                  borderColor: palette.coral,
                }}
              >
                <Text variant="bodySm" weight={isStart || isEnd ? '700' : '500'} color={fg}>
                  {cell.day}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
