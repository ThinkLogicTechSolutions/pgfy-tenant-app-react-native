/**
 * Booking-extension rules (T-S new feature). Hourly/daily checked-in tenants can
 * extend their stay up to an owner-configured cap. In the real product the cap is
 * a global owner setting; here the tenant app reads a local mock of that value.
 */
import type { ActiveBooking } from './types';
import { getListing } from './listings';

/** Mirror of the owner's global "max extension" Settings value (mock). */
export const EXTENSION_LIMITS = { maxHours: 6, maxDays: 5 };

/** Mock: how many further days this bed is free before another guest's booking. */
const BED_FREE_DAYS = 4;

export interface AvailabilityResult {
  available: boolean;
  reason?: string;
}

export function maxExtensionUnits(booking: ActiveBooking): number {
  return booking.bookingMode === 'hourly' ? EXTENSION_LIMITS.maxHours : EXTENSION_LIMITS.maxDays;
}

export function extensionUnitLabel(booking: ActiveBooking, n: number): string {
  if (booking.bookingMode === 'hourly') return n === 1 ? '1 hour' : `${n} hours`;
  return n === 1 ? '1 day' : `${n} days`;
}

export function extensionRate(booking: ActiveBooking): number {
  return booking.bookingMode === 'hourly' ? booking.ratePerHour ?? 0 : booking.ratePerDay ?? 0;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function addHours(hhmm: string, hours: number): string {
  const total = toMinutes(hhmm) + hours * 60;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Validate a requested extension against the owner cap, the property's hourly
 *  window, and (mock) other guests' bookings on the same bed. */
export function checkExtensionAvailability(booking: ActiveBooking, units: number): AvailabilityResult {
  if (booking.bookingMode === 'monthly') {
    return { available: false, reason: 'Monthly stays cannot be extended.' };
  }
  if (units < 1) {
    return { available: false, reason: 'Choose how long you want to extend.' };
  }
  const max = maxExtensionUnits(booking);
  if (units > max) {
    const unit = booking.bookingMode === 'hourly' ? 'hours' : 'days';
    return { available: false, reason: `The property allows extending by up to ${max} ${unit}.` };
  }

  if (booking.bookingMode === 'hourly') {
    const listing = getListing(booking.listingId);
    const windowEnd = listing?.bookingConfig.hourly?.windowEnd;
    if (windowEnd && booking.endTime) {
      const newEnd = addHours(booking.endTime, units);
      if (toMinutes(newEnd) > toMinutes(windowEnd)) {
        return {
          available: false,
          reason: `Extension would run past the property's hourly window (closes ${windowEnd}).`,
        };
      }
    }
    return { available: true };
  }

  // daily: bed is booked by another guest beyond BED_FREE_DAYS
  if (units > BED_FREE_DAYS) {
    return {
      available: false,
      reason: 'This bed is booked by another guest right after your stay. Try a shorter extension.',
    };
  }
  return { available: true };
}

export interface ExtensionPrice {
  base: number;
  gst: number;
  total: number;
}

export function priceExtension(rate: number, units: number): ExtensionPrice {
  const base = rate * units;
  const gst = Math.round(base * 0.18);
  return { base, gst, total: base + gst };
}
