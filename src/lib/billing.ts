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
import { resolveCoupon } from '@/data/coupons';

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
  /** Optional owner GST override carried from the property's price config. */
  gstConfig?: GstConfig;
  /** Charge the platform fee (defaults: true for new bookings, false otherwise). */
  applyPlatformFee?: boolean;
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
  couponTitle?: string;
  couponDiscount: number;
  total: number;
  lines: CheckoutLine[];
}

/** Price a checkout intent, optionally applying a coupon code. */
export function computeCheckout(intent: CheckoutIntent, couponCode?: string): CheckoutQuote {
  const base = Math.max(0, Math.round(intent.baseAmount));
  const deposit = Math.max(0, Math.round(intent.deposit ?? 0));
  const wantsFee = intent.applyPlatformFee ?? defaultPlatformFee(intent.kind);
  const wantsGst = intent.applyGst ?? defaultGst(intent.kind);
  const platformFee = wantsFee ? computePlatformFee(base) : 0;
  const rate = wantsGst ? gstRate(intent.billingMode, intent.unitRate, intent.gstConfig) : 0;
  const gst = Math.round((base * rate) / 100);

  const coupon = couponCode ? resolveCoupon(couponCode) : undefined;
  const preDiscount = base + deposit + platformFee + gst;
  const couponDiscount = coupon ? Math.min(coupon.discount, preDiscount) : 0;
  const total = Math.max(0, preDiscount - couponDiscount);

  const lines: CheckoutLine[] = [
    { label: intent.kind === 'invoice' ? 'Invoice amount' : 'Base amount', amount: base },
  ];
  if (deposit > 0) lines.push({ label: 'Security deposit', amount: deposit });
  if (wantsFee) lines.push({ label: 'Platform fee', amount: platformFee });
  if (wantsGst) lines.push({ label: rate === 0 ? 'GST (exempt)' : `GST (${rate}%)`, amount: gst, tone: 'muted' });
  if (couponDiscount > 0) {
    lines.push({ label: `Coupon ${coupon!.code}`, amount: -couponDiscount, tone: 'discount' });
  }

  return {
    base,
    deposit,
    platformFee,
    gstRate: rate,
    gst,
    couponCode: coupon?.code,
    couponTitle: coupon?.title,
    couponDiscount,
    total,
    lines,
  };
}
