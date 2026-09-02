/**
 * Referral program — mirrors the admin-managed referral configuration
 * (admin-web → Master Data → Configuration → Referral program).
 * Tenants share their invite link (the referral code is embedded in it).
 * Both the referrer and the referred user are rewarded with a discount —
 * the referrer's discount applies to their next checkout, not as account credit.
 */
import { inr } from '@/lib/format';

export type RewardKind = 'percentage' | 'value';

export interface ReferralBenefit {
  kind: RewardKind;
  /** percent (e.g. 10) when kind === 'percentage', else rupee amount. */
  value: number;
}

export interface ReferralProgram {
  /** Discount the existing user (referrer) gets on their next checkout when a friend books. */
  referrerReward: ReferralBenefit;
  /** What the new user (referred) gets on their first booking. */
  referredReward: ReferralBenefit;
}

/** Defaults aligned with admin-web PLATFORM_CONFIG referral_* fields. */
export const REFERRAL_PROGRAM: ReferralProgram = {
  referrerReward: { kind: 'value', value: 500 },
  referredReward: { kind: 'percentage', value: 10 },
};

/** Store link used when inviting friends / promoting group booking. */
export const APP_STORE_URL = 'https://pgfy.in/app';

/** Human label for a referral benefit, e.g. "₹500" or "10% off". */
export function formatBenefit(b: ReferralBenefit): string {
  return b.kind === 'percentage' ? `${b.value}% off` : inr(b.value);
}
