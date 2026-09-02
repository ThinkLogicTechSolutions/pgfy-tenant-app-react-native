import { formatDate } from '@/lib/format';

export type DateOption = { iso: string; label: string };

/** `YYYY-MM-DD` from a `Date`'s own local calendar fields — never `toISOString().slice(0, 10)`,
 * which reads the UTC calendar date instead and is off by one day whenever the device's local
 * offset pushes local midnight across a UTC day boundary (e.g. anywhere east of UTC rolls
 * back to yesterday; anywhere west rolls forward to tomorrow). */
export function toLocalIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Upcoming calendar days from a start date (default: the real device date — booking dates
 * are sent to a real API, so they must track actual today, not the app's mock `NOW`). */
export function dateOptions(count: number, startFrom?: string): DateOption[] {
  const base = startFrom ? new Date(`${startFrom}T00:00:00`) : new Date();
  base.setHours(0, 0, 0, 0);
  const out: DateOption[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const iso = toLocalIso(d);
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

/** Whole calendar days from `fromYmd` to `toYmd` (e.g. 11 Aug → 15 Aug = 4) — a daily
 * booking's nights, priced at the per-day rate. Parsed as plain integers via `Date.UTC`
 * rather than through local-time parsing, so DST transitions in between can't shift the
 * count by an hour and round to the wrong day. Never negative — an inverted range clamps to 1
 * night rather than billing zero or a negative amount. */
export function daysBetween(fromYmd: string, toYmd: string): number {
  const [fy, fm, fd] = fromYmd.split('-').map(Number);
  const [ty, tm, td] = toYmd.split('-').map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  const nights = Math.round((to - from) / 86400000);
  return Math.max(1, nights);
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
