/** Brand rewards — scratch cards issued for partner-vendor offers (GET/PATCH /tenant/rewards). */
import { request } from './client';
import type { ApiReward, ApiRewardDetail, ListResponse, Paginated, RewardAction } from './types';

export interface ListRewardsQuery {
  limit?: number;
  skip?: number;
}

export async function listRewards({ limit = 20, skip = 0 }: ListRewardsQuery = {}): Promise<Paginated<ApiReward>> {
  const res = await request<ListResponse<ApiReward>>('/tenant/rewards', {
    query: { $limit: limit, $skip: skip },
  });
  if (Array.isArray(res)) return { data: res, total: res.length, skip: 0, limit: res.length };
  return res;
}

export async function getReward(id: number): Promise<ApiRewardDetail> {
  return request<ApiRewardDetail>(`/tenant/rewards/${id}`);
}

async function actOnReward(id: number, action: RewardAction): Promise<ApiRewardDetail> {
  return request<ApiRewardDetail>(`/tenant/rewards/${id}`, {
    method: 'PATCH',
    body: { action },
  });
}

/** Scratches the card, drawing a real coupon — call once the scratch gesture crosses the
 * reveal threshold. */
export async function scratchReward(id: number): Promise<ApiRewardDetail> {
  return actOnReward(id, 'scratch');
}

/** Marks the drawn coupon as redeemed with the partner — the tenant confirms this
 * themselves ("I have already redeemed it") since redemption happens off-platform. */
export async function redeemReward(id: number): Promise<ApiRewardDetail> {
  return actOnReward(id, 'redeem');
}
