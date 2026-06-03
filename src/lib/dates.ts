import { formatDate, NOW } from '@/lib/format';

export type DateOption = { iso: string; label: string };

/** Upcoming calendar days from a start date (default today per mock NOW). */
export function dateOptions(count: number, startFrom?: string): DateOption[] {
  const base = startFrom ? new Date(`${startFrom}T00:00:00`) : new Date(NOW);
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

export function defaultCheckIn(): string {
  return dateOptions(1)[0].iso;
}

export function defaultCheckOut(checkIn: string): string {
  const opts = dateOptions(31, checkIn);
  return opts[14]?.iso ?? opts[Math.min(14, opts.length - 1)].iso;
}

export function isBefore(isoA: string, isoB: string): boolean {
  return new Date(`${isoA}T00:00:00`).getTime() < new Date(`${isoB}T00:00:00`).getTime();
}
