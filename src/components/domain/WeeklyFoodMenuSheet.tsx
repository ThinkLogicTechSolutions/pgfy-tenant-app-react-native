/** Weekly food menu sheet — shared on property details and My Stay. */
import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/theme';
import { Text, Card, Sheet, PressableScale } from '@/components/ui';
import type { FoodDay, WeeklyMenuDay } from '@/data/types';

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export interface ResolvedDayMenu {
  day: WeekDay;
  meals: { meal: string; items: string }[];
}

/** JS `Date#getDay()` convention — 0 = Sunday .. 6 = Saturday — matching `WeeklyMenuDay.dayOfWeek`. */
const WEEKDAY_TO_JS_DOW: Record<WeekDay, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const API_FOOD_SLOTS = [
  { field: 'morningTea', label: 'Morning tea' },
  { field: 'breakfast', label: 'Breakfast' },
  { field: 'lunch', label: 'Lunch' },
  { field: 'eveningTea', label: 'Evening tea' },
  { field: 'dinner', label: 'Dinner' },
] as const;

/** Real per-day-of-week menu (API-backed listings) — unlike `buildWeeklyMenu`, a day with no
 * enabled/non-empty slots (or no entry at all) legitimately has no meals scheduled. */
export function buildWeeklyMenuFromApi(weeklyMenu: WeeklyMenuDay[]): ResolvedDayMenu[] {
  return WEEK_DAYS.map((day) => {
    const apiDay = weeklyMenu.find((d) => d.dayOfWeek === WEEKDAY_TO_JS_DOW[day]);
    const meals = apiDay
      ? API_FOOD_SLOTS
          .map((slot) => ({ label: slot.label, slot: apiDay[slot.field] }))
          .filter((s) => s.slot?.enabled && String(s.slot.items ?? '').trim())
          .map((s) => ({ meal: s.label, items: String(s.slot!.items ?? '') }))
      : [];
    return { day, meals };
  });
}

const WEEKLY_MENU_SUFFIX: Record<WeekDay, [string, string, string]> = {
  Mon: ['with fruit bowl', 'with curd & salad', 'with gulab jamun'],
  Tue: ['with banana smoothie', 'with buttermilk', 'with kheer'],
  Wed: ['with boiled eggs / sprouts', 'with pickle & papad', 'with halwa'],
  Thu: ['with corn chaat', 'with curd rice', 'with ice cream'],
  Fri: ['with tea cake', 'with veg pulao add-on', 'with brownie'],
  Sat: ['with juice', 'with raita', 'with sweet pongal'],
  Sun: ['with pancakes', 'with special biryani side', 'with pastry'],
};

export function weekDayFromDate(date = new Date()): WeekDay {
  const map: WeekDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return map[date.getDay()];
}

export function buildWeeklyMenu(foodMenu: FoodDay[]) {
  return WEEK_DAYS.map((day) => ({
    day,
    meals: foodMenu.map((meal, i) => ({
      meal: meal.meal,
      items: `${meal.items} ${WEEKLY_MENU_SUFFIX[day][i]}`,
    })),
  }));
}

export function WeeklyFoodMenuSheet({
  visible,
  onClose,
  foodMenu,
  weeklyMenu: apiWeeklyMenu,
  foodIncluded = true,
  initialDay,
}: {
  visible: boolean;
  onClose: () => void;
  foodMenu: FoodDay[];
  /** Real per-day-of-week menu (API-backed listings) — takes priority over `foodMenu` when present. */
  weeklyMenu?: WeeklyMenuDay[];
  foodIncluded?: boolean;
  initialDay?: WeekDay;
}) {
  const [selectedWeekDay, setSelectedWeekDay] = useState<WeekDay>(initialDay ?? weekDayFromDate());

  useEffect(() => {
    if (visible) setSelectedWeekDay(initialDay ?? weekDayFromDate());
  }, [visible, initialDay]);

  const resolvedWeeklyMenu = useMemo(
    () => (apiWeeklyMenu ? buildWeeklyMenuFromApi(apiWeeklyMenu) : buildWeeklyMenu(foodMenu)),
    [apiWeeklyMenu, foodMenu],
  );
  const dayMenu = resolvedWeeklyMenu.find((menu) => menu.day === selectedWeekDay) ?? resolvedWeeklyMenu[0];

  return (
    <Sheet visible={visible} onClose={onClose} title="Weekly food menu" scroll>
      {!foodIncluded ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Ionicons name="close-circle-outline" size={18} color={palette.inkTertiary} />
          <Text variant="bodySm" color={palette.inkSecondary}>Food is not available at this property.</Text>
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {WEEK_DAYS.map((day) => (
              <PressableScale
                key={day}
                onPress={() => setSelectedWeekDay(day)}
                haptics={false}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: selectedWeekDay === day ? palette.coral : palette.border,
                  backgroundColor: selectedWeekDay === day ? palette.coralTint : palette.surfaceRaised,
                }}
              >
                <Text variant="bodySm" weight="600" color={selectedWeekDay === day ? palette.coralDark : palette.inkSecondary}>
                  {day}
                </Text>
              </PressableScale>
            ))}
          </ScrollView>
          {(apiWeeklyMenu ? dayMenu.meals.length === 0 : dayMenu.day === 'Sun') ? (
            <Card style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
              <View
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 42,
                  backgroundColor: palette.warningTint,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.md,
                }}
              >
                <Ionicons name="restaurant-outline" size={34} color={palette.warning} />
                <View
                  style={{
                    position: 'absolute',
                    width: 54,
                    height: 3,
                    backgroundColor: palette.warning,
                    transform: [{ rotate: '-35deg' }],
                    borderRadius: 999,
                  }}
                />
              </View>
              <Text variant="h3" align="center">Mess is off</Text>
              <Text variant="bodySm" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.xs, maxWidth: 260, lineHeight: 21 }}>
                {apiWeeklyMenu ? 'No meals are scheduled for this property today.' : 'Sunday meal service is not available for this property. Please plan outside food for this day.'}
              </Text>
            </Card>
          ) : (
            dayMenu.meals.map((meal) => (
              <Card key={`${dayMenu.day}-${meal.meal}`}>
                <Text variant="bodyMd" weight="700">{meal.meal}</Text>
                <Text variant="bodySm" color={palette.inkSecondary} style={{ marginTop: spacing.xs }}>
                  {meal.items}
                </Text>
              </Card>
            ))
          )}
        </View>
      )}
    </Sheet>
  );
}
