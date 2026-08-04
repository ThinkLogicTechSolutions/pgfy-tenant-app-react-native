/**
 * Booking cancellation policy the tenant app reads. Mirrors the admin-configured per-mode
 * charge (admin-web PLATFORM_CONFIG); in production this would come from the platform config
 * API. When a tenant cancels before check-in the charge is deducted and the rest is refunded.
 */
import type { BookingMode } from './types';

export type CancellationChargeType = 'value' | 'percentage';

export interface CancellationModePolicy {
  /** Flat ₹ ('value') or a percentage of the amount paid ('percentage'). */
  type: CancellationChargeType;
  value: number;
}

export type CancellationPolicy = Record<BookingMode, CancellationModePolicy>;

export const CANCELLATION_POLICY: CancellationPolicy = {
  monthly: { type: 'percentage', value: 10 },
  daily: { type: 'percentage', value: 25 },
  hourly: { type: 'value', value: 50 },
};

/** Tenants are told refunds land within this window after cancelling. */
export const REFUND_ETA = '3–4 working days';

export interface CancellationCharge {
  chargeType: CancellationChargeType;
  chargeValue: number;
  /** ₹ deducted from the refund. */
  chargeAmount: number;
  /** amountPaid − chargeAmount. */
  refundAmount: number;
}

/** Cancellation charge + resulting refund for a booking cancelled before check-in. */
export function computeCancellationCharge(
  mode: BookingMode,
  amountPaid: number,
  policy: CancellationPolicy = CANCELLATION_POLICY,
): CancellationCharge {
  const { type, value } = policy[mode];
  const chargeAmount = type === 'percentage'
    ? Math.round((amountPaid * value) / 100)
    : Math.min(value, amountPaid);
  return { chargeType: type, chargeValue: value, chargeAmount, refundAmount: Math.max(0, amountPaid - chargeAmount) };
}

/** Recorded when a tenant cancels a booking before check-in. */
export interface BookingCancellation {
  reason: string;
  cancelledOn: string;            // ISO
  chargeType: CancellationChargeType;
  chargeAmount: number;
  amountPaid: number;
  refundAmount: number;
  refundEta: string;
}
