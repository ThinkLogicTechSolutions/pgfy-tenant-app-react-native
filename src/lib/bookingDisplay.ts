/** Display helpers for the real `/tenant/booking` API — status labels/tones and cover images.
 * The status enum isn't fully documented, so unknown values fall back gracefully. */
import type { Tone } from '@/components/ui';
import type { ApiBookingProperty, BookingStatusApi } from '@/lib/api';

const BOOKING_STATUS_TONE: Record<string, Tone> = {
  PENDING_PAYMENT: 'warning',
  CONFIRMED: 'success',
  CHECKED_IN: 'success',
  CHECKED_OUT: 'neutral',
  COMPLETED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'danger',
  CANCELLED: 'danger',
};

export function bookingStatusTone(status: BookingStatusApi): Tone {
  return BOOKING_STATUS_TONE[status] ?? 'neutral';
}

/** A currently live/upcoming stay (not yet resolved into a closed state) — gets the
 * highlighted "active stay" card; everything else (rejected/expired/cancelled/completed/
 * checked-out) gets the plain history-card treatment. */
const ACTIVE_BOOKING_STATUSES = ['PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN'];

export function isActiveBookingStatus(status: BookingStatusApi): boolean {
  return ACTIVE_BOOKING_STATUSES.includes(status);
}

/** `CHECKED_IN` → `Checked In`. */
export function bookingStatusLabel(status: BookingStatusApi): string {
  return status
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function bookingModeLabel(mode: string): string {
  return mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase();
}

export function bookingCoverImage(property: ApiBookingProperty): string {
  const attachments = property.media.flatMap((s) => s.attachments);
  return attachments.find((a) => a.type === 1)?.link ?? attachments[0]?.link ?? '';
}

/** True once the tenant has actually checked in — the pass switches from a pre-arrival
 * "check-in pass" to an ongoing "PG pass" at that point. */
export function isCheckedIn(booking: { status: BookingStatusApi; actual_check_in: string | null }): boolean {
  return booking.status === 'CHECKED_IN' || !!booking.actual_check_in;
}

/** The QR payload the property scanner expects: `PGFY|<booking code>|<6-digit OTP>`. */
export function buildCheckInPassPayload(code: string, otp: string): string {
  return `PGFY|${code}|${otp}`;
}
