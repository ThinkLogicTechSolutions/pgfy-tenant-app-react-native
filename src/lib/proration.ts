/** Client-side estimate of the backend's MONTHLY move-in proration
 * (`pgfy-backend-nodejs/.../booking/utils/computeBookingBill.ts`) — for pre-payment preview
 * purposes only. The real charge is always computed server-side when the booking is created.
 *
 * Rule: check-in on day 1–7 of the month charges the full month; day 8+ prorates from
 * check-in through month-end (inclusive) at `monthlyRent / daysInMonth`. This doesn't know
 * about a property's separately configured DAILY price override, so on properties that have
 * one, the real charge can differ slightly from this estimate. */

const FULL_MONTH_CHECK_IN_DAY_MAX = 7;

export interface MonthlyProration {
  isProrated: boolean;
  daysInMonth: number;
  proratedDays: number;
  dailyRate: number;
  /** Estimated first-month charge — full monthly rent when not prorated. */
  moveInRent: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** @param checkInYmd `YYYY-MM-DD` — parsed as plain integers, not through `Date` ISO
 * parsing, so this is immune to timezone-shift-by-a-day bugs. */
export function computeMonthlyProration(monthlyRent: number, checkInYmd: string): MonthlyProration {
  const [year, month, day] = checkInYmd.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyRate = monthlyRent / daysInMonth;

  if (day <= FULL_MONTH_CHECK_IN_DAY_MAX) {
    return { isProrated: false, daysInMonth, proratedDays: daysInMonth, dailyRate, moveInRent: round2(monthlyRent) };
  }

  const proratedDays = daysInMonth - day + 1;
  return { isProrated: true, daysInMonth, proratedDays, dailyRate, moveInRent: round2(proratedDays * dailyRate) };
}
