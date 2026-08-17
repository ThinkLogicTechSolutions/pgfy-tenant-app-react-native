/** PGfy Owner — formatting helpers (INR money, dates, numbers). */

/** ₹1,23,456 — Indian grouping, no decimals. */
export function inr(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const n = Math.abs(Math.round(amount));
  return `${sign}₹${n.toLocaleString('en-IN')}`;
}

/** Compact money: ₹4.2L / ₹85K / ₹980 (good for KPI tiles & axis labels). */
export function inrCompact(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const n = Math.abs(amount);
  if (n >= 10000000) return `${sign}₹${trim(n / 10000000)}Cr`;
  if (n >= 100000) return `${sign}₹${trim(n / 100000)}L`;
  if (n >= 1000) return `${sign}₹${trim(n / 1000)}K`;
  return `${sign}₹${Math.round(n)}`;
}

function trim(v: number): string {
  return v.toFixed(v % 1 === 0 ? 0 : 1);
}

export function pct(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 5 Jun 2026 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** 5 Jun */
export function formatDayMonth(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** 4:00 PM */
export function formatTime12h(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const mm = minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`;
  return `${hours}${mm} ${ampm}`;
}

/**
 * Human "time ago". Uses a fixed reference (NOW) so the mockup is deterministic
 * relative to its seeded dates.
 */
export const NOW = new Date('2026-05-29T10:00:00+05:30');

/** Real current time, not the frozen mock `NOW` above — real API timestamps (e.g.
 * notifications) are newer than that frozen date, which would otherwise make every diff
 * negative and every item silently show "just now" forever. */
export function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return formatDayMonth(iso);
}

/** Days between an ISO date and NOW (positive = future). */
export function daysFromNow(iso: string): number {
  const d = new Date(iso);
  return Math.round((d.getTime() - NOW.getTime()) / 86400000);
}

/** `IN_PROGRESS` → `In Progress`. */
export function titleCaseFromSnake(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

/** Mask all but the last 4 digits: +91 98••• ••210 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (digits.length < 10) return phone;
  return `+91 ${digits.slice(0, 2)}••• ••${digits.slice(8)}`;
}
