/**
 * Platform-level fee & gateway config the tenant checkout reads. Replaces the old
 * "registration fee" charged at booking. In production this would be fetched from the
 * platform config API; here it is a static mock.
 */
export type FeeType = 'value' | 'percentage';

export interface PlatformFeeConfig {
  type: FeeType;
  /** Flat ₹ amount charged when type === 'value'. */
  value: number;
  /** Percentage of the booking value charged when type === 'percentage'. */
  pct: number;
  gateway: 'Razorpay';
}

export const PLATFORM_FEE: PlatformFeeConfig = {
  type: 'value',
  value: 199,
  pct: 2,
  gateway: 'Razorpay',
};

/** Platform fee charged to the tenant on a checkout with accommodation value `base`. */
export function computePlatformFee(base: number, config: PlatformFeeConfig = PLATFORM_FEE): number {
  if (config.type === 'percentage') return Math.round((base * config.pct) / 100);
  return config.value;
}
