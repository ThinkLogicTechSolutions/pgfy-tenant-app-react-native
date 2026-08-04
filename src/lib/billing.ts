/**
 * Tenant-side checkout billing — GST classification + fee/coupon math for the unified
 * checkout (T-S16). The GST rules mirror the owner pricing tab (`owner-app propertyGst.ts`):
 *   · Monthly residential rent ≤ ₹20,000/mo → exempt, else 12%.
 *   · Daily bed tariff ≤ ₹7,500/day → 5%, else 18%.
 *   · Hourly short-stay → 12%.
 * The rate is derived from the property's price config (the per-unit rate passed on the
 * CheckoutIntent), so "GST is calculated based on the property's pricing".
 */
import type { BookingMode } from '@/data/types';
import { computePlatformFee } from '@/data/platform';
import type { ApiCoupon, MasterConfig } from '@/lib/api';

/** Real platform commission from master data (auth_api.md), not the mock fee table. */
export function platformFeeFromMasterConfig(base: number, config: MasterConfig | null | undefined): number {
  if (!config) return 0;
  if (config.platform_commission_type === 'FLAT') return Math.max(0, Math.round(config.platform_commission_value));
  return Math.max(0, Math.round((base * config.platform_commission_value) / 100));
}

/** Whether a real coupon (billing_api.md) is currently redeemable — active, within its
 * validity window, and (if capped) not yet exhausted. Per-user caps aren't checkable
 * client-side, so those are left for the server to enforce on apply. */
export function isCouponUsable(coupon: ApiCoupon): boolean {
  if (coupon.status !== 'ACTIVE') return false;
  const now = Date.now();
  if (coupon.valid_from && now < new Date(coupon.valid_from).getTime()) return false;
  if (coupon.expiry_date && now > new Date(coupon.expiry_date).getTime()) return false;
  if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) return false;
  return true;
}

/** The real ₹ discount a coupon works out to against a given base amount — percentage
 * resolved to currency and capped by `max_discount` when set. */
export function couponDiscountAmount(coupon: ApiCoupon, base: number): number {
  const raw = coupon.discount_type === 'PERCENTAGE' ? (base * coupon.discount_amount) / 100 : coupon.discount_amount;
  const capped = coupon.max_discount != null ? Math.min(raw, coupon.max_discount) : raw;
  return Math.max(0, Math.round(capped));
}

/** A coupon already resolved to a specific ₹ amount for this checkout — computed by the
 * caller (who has the real coupon list) via `couponDiscountAmount`. Also doubles as the
 * carrier for an auto-applied referral discount (see `referralDiscountAmount`) — same
 * "already resolved to a ₹ amount" shape, just sourced differently. */
export interface AppliedCoupon {
  code: string;
  amount: number;
  /** Overrides the default "Coupon {code}" checkout line label — e.g. "Referral discount". */
  label?: string;
}

/** The real ₹ discount a referral signup benefit (`ApiReferralDiscountInfo.referred_user_
 * discount`) works out to against a given base amount — same FLAT/PERCENTAGE resolution as
 * `couponDiscountAmount`, uncapped (the API doesn't return a max for this one). */
export function referralDiscountAmount(type: 'FLAT' | 'PERCENTAGE' | null, value: number | null, base: number): number {
  if (!type || value == null) return 0;
  const raw = type === 'PERCENTAGE' ? (base * value) / 100 : value;
  return Math.max(0, Math.round(raw));
}

export type GstRate = 0 | 5 | 12 | 18;
export type GstMode = 'auto' | 'manual';

export interface GstConfig {
  mode: GstMode;
  manual: Record<BookingMode, GstRate>;
}

export const GST_RULES = {
  exemptMaxMonthlyRent: 20000,
  dormLowTariffMax: 7500,
};

/** Rule-based GST rate for a billing mode given the per-unit accommodation rate. */
export function autoGstRate(mode: BookingMode, unitRate: number): GstRate {
  if (mode === 'monthly') return unitRate <= GST_RULES.exemptMaxMonthlyRent ? 0 : 12;
  if (mode === 'daily') return unitRate <= GST_RULES.dormLowTariffMax ? 5 : 18;
  return 12; // hourly — always transient commercial accommodation
}

/** Effective GST rate after applying the property's manual override (if any). */
export function gstRate(mode: BookingMode, unitRate: number, config?: GstConfig): GstRate {
  if (config?.mode === 'manual') return config.manual[mode] ?? 0;
  return autoGstRate(mode, unitRate);
}

/* ---------------- Checkout intent ---------------- */

export type CheckoutKind =
  | 'booking-monthly'
  | 'booking-daily'
  | 'booking-hourly'
  | 'extend'
  | 'invoice';

/** Present only when this checkout should create a real booking via the booking API
 * (booking_api.md) on payment — everything `createBooking` needs besides the payment
 * method/frequency (chosen at checkout) and coupon code (already on the intent below). */
export interface CheckoutBookingGuest {
  name: string;
  gender: string;
  age: number;
}

/** Hostel: room/bed/layout required. Flat/Home stay: omit them and set `guests`/`guestCount`
 *  instead — the whole (single default) unit is booked. */
export interface CheckoutBookingPayload {
  propertyId: number;
  roomId?: number;
  bedId?: number;
  floorId?: number;
  bookingMode: 'MONTHLY' | 'DAILY' | 'HOURLY';
  isAc?: boolean;
  hasFood?: boolean;
  roomLayout?: string;
  /** Flat/Home stay only — named occupants (min 1, max the property's `max_occupancy`). */
  guests?: CheckoutBookingGuest[];
  guestCount?: number;
  checkInDate: string;
  /** Daily bookings only. */
  checkOutDate?: string;
  /** Hourly bookings only. */
  durationHours?: number;
}

/** Present only when this checkout should pay a real rent invoice via `POST /tenant/pay-rent`
 * (billing_api.md) on payment. */
export interface CheckoutInvoicePayload {
  invoiceId: number;
}

/** Present only when this checkout should create a real stay extension via
 * `POST /tenant/extend-stay` (Daily/Hourly checked-in bookings only) on payment. */
export interface CheckoutExtensionPayload {
  bookingId: number;
  quantity: number;
}

/** Everything the unified checkout needs to render & price a single transaction. */
export interface CheckoutIntent {
  kind: CheckoutKind;
  /** Headline, e.g. "PGfy Nest — Monthly booking". */
  title: string;
  /** Secondary line, e.g. "Room 101 · Bed A · Single sharing". */
  subtitle?: string;
  /** monthly | daily | hourly. Invoices bill as 'monthly'. */
  billingMode: BookingMode;
  /** Accommodation amount before fee/GST/coupon (rent, tariff×qty or invoice amount). */
  baseAmount: number;
  /** Per-unit rate used to classify GST (monthly rent / per-day tariff / per-hour rate). */
  unitRate: number;
  /** Security deposit collected once at monthly booking (shown as a separate line). */
  deposit?: number;
  /** Whether UPI Autopay (mandate) can be offered — monthly bookings & invoices. */
  allowAutopay: boolean;
  listingId?: string;
  bookingRef?: string;
  /** Set for a genuine new-booking checkout — triggers `bookingApi.createBooking` on payment. */
  booking?: CheckoutBookingPayload;
  /** Set for a genuine invoice-payment checkout — triggers `billingApi.payRent` on payment. */
  invoicePayment?: CheckoutInvoicePayload;
  /** Set for a genuine stay-extension checkout — triggers `extendStayApi.createExtension` on
   * payment. */
  extension?: CheckoutExtensionPayload;
  /** Optional owner GST override carried from the property's price config. */
  gstConfig?: GstConfig;
  /** Charge the platform fee (defaults: true for new bookings, false otherwise). */
  applyPlatformFee?: boolean;
  /** Real platform fee from master data (see `platformFeeFromMasterConfig`) — takes priority
   * over the mock fee table whenever the caller has it. */
  platformFeeOverride?: number;
  /** Add GST on the base (defaults: true unless the amount already includes it, e.g. an invoice). */
  applyGst?: boolean;
}

/** Whether the platform fee applies to a given intent kind by default. */
function defaultPlatformFee(kind: CheckoutKind): boolean {
  return kind === 'booking-monthly' || kind === 'booking-daily' || kind === 'booking-hourly';
}
/** Whether GST is added on top by default (an invoice already bundles it). */
function defaultGst(kind: CheckoutKind): boolean {
  return kind !== 'invoice';
}

export interface CheckoutLine {
  label: string;
  amount: number;
  tone?: 'normal' | 'muted' | 'discount';
}

export interface CheckoutQuote {
  base: number;
  deposit: number;
  platformFee: number;
  gstRate: GstRate;
  gst: number;
  couponCode?: string;
  couponDiscount: number;
  total: number;
  lines: CheckoutLine[];
}

/** Price a checkout intent, optionally applying an already-resolved coupon (see
 * `AppliedCoupon` — the caller looks the code up against the real coupon list and computes
 * its ₹ amount via `couponDiscountAmount` before calling this). */
export function computeCheckout(intent: CheckoutIntent, coupon?: AppliedCoupon): CheckoutQuote {
  const base = Math.max(0, Math.round(intent.baseAmount));
  const deposit = Math.max(0, Math.round(intent.deposit ?? 0));
  const wantsFee = intent.applyPlatformFee ?? defaultPlatformFee(intent.kind);
  const wantsGst = intent.applyGst ?? defaultGst(intent.kind);
  const platformFee = wantsFee ? intent.platformFeeOverride ?? computePlatformFee(base) : 0;
  const rate = wantsGst ? gstRate(intent.billingMode, intent.unitRate, intent.gstConfig) : 0;
  const gst = Math.round((base * rate) / 100);

  const preDiscount = base + deposit + platformFee + gst;
  const couponDiscount = coupon ? Math.max(0, Math.min(Math.round(coupon.amount), preDiscount)) : 0;
  const total = Math.max(0, preDiscount - couponDiscount);

  const lines: CheckoutLine[] = [
    { label: intent.kind === 'invoice' ? 'Invoice amount' : 'Base amount', amount: base },
  ];
  if (deposit > 0) lines.push({ label: 'Security deposit', amount: deposit });
  if (wantsFee) lines.push({ label: 'Platform fee', amount: platformFee });
  if (wantsGst) lines.push({ label: rate === 0 ? 'GST (exempt)' : `GST (${rate}%)`, amount: gst, tone: 'muted' });
  if (couponDiscount > 0) {
    lines.push({ label: coupon!.label ?? `Coupon ${coupon!.code}`, amount: -couponDiscount, tone: 'discount' });
  }

  return {
    base,
    deposit,
    platformFee,
    gstRate: rate,
    gst,
    couponCode: coupon?.code,
    couponDiscount,
    total,
    lines,
  };
}
