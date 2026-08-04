/** Shared date-range filter model — This Month / Last Month / This Year / Last Year / Custom.
 * Selectable window is capped to [today - 2 years, today] everywhere this is used. */

export type DateRangePreset = 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';

export interface DateRangeValue {
  preset: DateRangePreset;
  /** ISO yyyy-mm-dd, always populated — ready to hand to an API call. */
  from: string;
  to: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function fromISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const startOfYear = (d: Date) => new Date(d.getFullYear(), 0, 1);
const endOfYear = (d: Date) => new Date(d.getFullYear(), 11, 31);
const addYears = (d: Date, n: number) => new Date(d.getFullYear() + n, d.getMonth(), d.getDate());

export const today = (): Date => new Date();

/** Earliest selectable date — 2 years before today. */
export const MIN_SELECTABLE = toISO(addYears(today(), -2));
/** Latest selectable date — today. */
export const MAX_SELECTABLE = toISO(today());

export const DATE_RANGE_PRESETS: { id: Exclude<DateRangePreset, 'custom'>; label: string }[] = [
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_year', label: 'This Year' },
  { id: 'last_year', label: 'Last Year' },
];

const PRESET_LABEL: Record<DateRangePreset, string> = {
  this_month: 'This Month',
  last_month: 'Last Month',
  this_year: 'This Year',
  last_year: 'Last Year',
  custom: 'Custom Range',
};

/** Resolves a named preset to a concrete {from, to} range, clamped to the selectable window. */
export function rangeForPreset(preset: Exclude<DateRangePreset, 'custom'>): { from: string; to: string } {
  const now = today();
  switch (preset) {
    case 'this_month':
      return { from: toISO(startOfMonth(now)), to: toISO(now) };
    case 'last_month': {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { from: toISO(startOfMonth(prev)), to: toISO(endOfMonth(prev)) };
    }
    case 'this_year':
      return { from: toISO(startOfYear(now)), to: toISO(now) };
    case 'last_year': {
      const prev = new Date(now.getFullYear() - 1, 0, 1);
      return { from: toISO(startOfYear(prev)), to: toISO(endOfYear(prev)) };
    }
  }
}

/** Default value shown before the user picks anything — last month's 1st through today. */
export function defaultDateRange(): DateRangeValue {
  const now = today();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { preset: 'custom', from: toISO(lastMonthStart), to: toISO(now) };
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtShort(iso: string): string {
  const d = fromISO(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** Short label for the filter pill — "This Month" or "1 Jun – 27 Jul". */
export function dateRangeLabel(v: DateRangeValue): string {
  if (v.preset !== 'custom') return PRESET_LABEL[v.preset];
  return `${fmtShort(v.from)} – ${fmtShort(v.to)}`;
}
