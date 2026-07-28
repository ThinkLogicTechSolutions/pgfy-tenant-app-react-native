const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function parseIso(iso: string): Date {
  const d = new Date(`${iso}T00:00:00`);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** The real device date — booking dates go to a real API, so "today" must track actual
 * today, not the app's mock `NOW` (otherwise dates already in the past look bookable). */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isBeforeDay(isoA: string, isoB: string): boolean {
  return parseIso(isoA).getTime() < parseIso(isoB).getTime();
}

export function isSameDay(isoA: string, isoB: string): boolean {
  return isoA === isoB;
}

export function isInRange(iso: string, start: string, end: string): boolean {
  const t = parseIso(iso).getTime();
  return t >= parseIso(start).getTime() && t <= parseIso(end).getTime();
}

export function formatMonthYear(year: number, month: number): string {
  return `${MONTHS_FULL[month]} ${year}`;
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export type CalendarCell =
  | { kind: 'empty'; key: string }
  | { kind: 'day'; key: string; iso: string; day: number; disabled: boolean };

/** Build a 6-row month grid (Sun–Sat) with leading blanks. `minDate` defaults to today (the
 * booking-flow default — no past dates); pass an explicit `minDate`/`maxDate` for a picker
 * that instead needs to bound a historical range (e.g. billing). */
export function buildMonthGrid(year: number, month: number, minDate?: Date, maxDate?: Date): CalendarCell[] {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const min = new Date(minDate ?? startOfToday());
  min.setHours(0, 0, 0, 0);
  const max = maxDate ? new Date(maxDate) : null;
  if (max) max.setHours(23, 59, 59, 999);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < startPad; i++) {
    cells.push({ kind: 'empty', key: `e-${year}-${month}-${i}` });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    const iso = toIso(d);
    cells.push({
      kind: 'day',
      key: iso,
      iso,
      day,
      disabled: d.getTime() < min.getTime() || (max ? d.getTime() > max.getTime() : false),
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ kind: 'empty', key: `t-${cells.length}` });
  }
  return cells;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = parseIso(checkOut).getTime() - parseIso(checkIn).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}
