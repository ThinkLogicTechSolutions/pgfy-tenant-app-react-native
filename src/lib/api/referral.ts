/** Refer & earn (GET /tenant/refer-and-earn). */
import { request } from './client';
import type { ApiReferralSummary } from './types';

export async function getReferralSummary(): Promise<ApiReferralSummary> {
  return request<ApiReferralSummary>('/tenant/refer-and-earn', {
    query: { summary: true, list: true },
  });
}
