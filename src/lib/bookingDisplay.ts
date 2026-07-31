/** Display helpers for the real `/tenant/booking` API — status labels/tones and cover images.
 * The status enum isn't fully documented, so unknown values fall back gracefully. */
import type { Tone } from '@/components/ui';
import type { ApiBookingProperty, ApiStayExtension, BookingStatusApi } from '@/lib/api';
import { formatDate } from '@/lib/format';

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

/** Flat/Homestay bookings book the whole (single, unit-level) property — no room/bed/floor
 * or AC/food room-tier to show, unlike a Hostel booking. `guests`/`guest_count` are only
 * ever populated on this kind of booking (per `CreateBookingInput`'s own doc comment). */
export function isUnitBooking(booking: { guests?: unknown[] | null; guest_count?: number | null }): boolean {
  return (booking.guests?.length ?? 0) > 0 || (booking.guest_count ?? 0) > 0;
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

/** Most recently confirmed extension for a booking, if any — `extensions` isn't guaranteed
 * to arrive sorted, so pick by `confirmed_at` (falling back to `created_at`). */
export function latestConfirmedExtension(extensions?: ApiStayExtension[] | null): ApiStayExtension | null {
  const confirmed = (extensions ?? []).filter((e) => e.status === 'CONFIRMED');
  if (!confirmed.length) return null;
  return confirmed.reduce((latest, e) => {
    const t = new Date(e.confirmed_at ?? e.created_at).getTime();
    const latestT = new Date(latest.confirmed_at ?? latest.created_at).getTime();
    return t > latestT ? e : latest;
  });
}

/** "Booking extended upto 5 Jun 2026" for Daily/Monthly stays; hourly stays don't have a
 * move-out date to show, so they fall back to a duration-based message. */
export function extensionBannerMessage(extension: ApiStayExtension): string {
  if (extension.new_check_out_date) {
    return `Booking extended upto ${formatDate(extension.new_check_out_date)}`;
  }
  if (extension.new_duration_hours != null) {
    return `Booking extended to ${extension.new_duration_hours} hour${extension.new_duration_hours === 1 ? '' : 's'} total`;
  }
  return 'Booking extended';
}
