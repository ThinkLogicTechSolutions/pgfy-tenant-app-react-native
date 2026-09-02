/** Client-side estimate of the backend's MONTHLY move-in proration
 * (`pgfy-backend-nodejs/.../booking/utils/computeBookingBill.ts`) — for pre-payment preview
 * purposes only. The real charge is always computed server-side when the booking is created.
 *
 * Rule: check-in on day 1–7 of the month charges the full month; day 8+ prorates from
 * check-in through month-end (inclusive), at the property's own configured DAILY price for
 * that occupancy when one exists, else at `monthlyRent / daysInMonth`. */

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
 * parsing, so this is immune to timezone-shift-by-a-day bugs.
 * @param dailyRateOverride The property's own configured DAILY price for this occupancy, if
 * it has one — preferred over the `monthlyRent / daysInMonth` fallback. */
export function computeMonthlyProration(monthlyRent: number, checkInYmd: string, dailyRateOverride?: number | null): MonthlyProration {
  const [year, month, day] = checkInYmd.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyRate = dailyRateOverride && dailyRateOverride > 0 ? dailyRateOverride : monthlyRent / daysInMonth;

  if (day <= FULL_MONTH_CHECK_IN_DAY_MAX) {
    return { isProrated: false, daysInMonth, proratedDays: daysInMonth, dailyRate, moveInRent: round2(monthlyRent) };
  }

  const proratedDays = daysInMonth - day + 1;
  return { isProrated: true, daysInMonth, proratedDays, dailyRate, moveInRent: round2(proratedDays * dailyRate) };
}
