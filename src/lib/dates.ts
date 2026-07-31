import { formatDate } from '@/lib/format';

export type DateOption = { iso: string; label: string };

/** Upcoming calendar days from a start date (default: the real device date — booking dates
 * are sent to a real API, so they must track actual today, not the app's mock `NOW`). */
export function dateOptions(count: number, startFrom?: string): DateOption[] {
  const base = startFrom ? new Date(`${startFrom}T00:00:00`) : new Date();
  base.setHours(0, 0, 0, 0);
  const out: DateOption[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    out.push({ iso, label: formatDate(iso) });
  }
  return out;
}

/** Late-night cutoff: past this local hour, "today" no longer makes sense as a move-in date. */
const LATE_NIGHT_CUTOFF_HOUR = 22;

/** Today's date, unless it's past 10pm — then tomorrow. Applies to monthly/daily/hourly alike
 * since every booking-mode date field defaults through this function. */
export function defaultCheckIn(): string {
  const today = dateOptions(1)[0].iso;
  const isLateNight = new Date().getHours() >= LATE_NIGHT_CUTOFF_HOUR;
  if (!isLateNight) return today;
  return dateOptions(2, today)[1].iso;
}

export function defaultCheckOut(checkIn: string): string {
  const opts = dateOptions(31, checkIn);
  return opts[14]?.iso ?? opts[Math.min(14, opts.length - 1)].iso;
}

export function isBefore(isoA: string, isoB: string): boolean {
  return new Date(`${isoA}T00:00:00`).getTime() < new Date(`${isoB}T00:00:00`).getTime();
}

/** A check-in date can arrive stale from anywhere — a route param carried over from an
 * earlier day, a frozen default computed once and reused across a long-lived session, a
 * shared deep link. No matter the source, it must never resolve to before today: bump it
 * forward to `defaultCheckIn()` whenever that happens. */
export function clampCheckInToFuture(checkIn: string | undefined | null): string {
  if (!checkIn) return defaultCheckIn();
  const today = dateOptions(1)[0].iso;
  return isBefore(checkIn, today) ? defaultCheckIn() : checkIn;
}
