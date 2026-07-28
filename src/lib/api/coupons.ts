/** Tenant-facing booking coupons (billing_api.md — `GET /billing/coupon`). */
import { request } from './client';
import type { ApiCoupon } from './types';

export interface ListCouponsQuery {
  propertyId: number;
}

/** Coupons applicable to a property — property-specific ones plus any that target all
 * properties. `$limit: -1` disables pagination, matching the master-data list pattern. */
export async function listCoupons({ propertyId }: ListCouponsQuery): Promise<ApiCoupon[]> {
  return request<ApiCoupon[]>('/billing/coupon', {
    query: { property_id: propertyId, $limit: -1 },
  });
}
