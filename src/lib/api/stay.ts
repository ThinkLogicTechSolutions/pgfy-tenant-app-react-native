/** My Stay (`GET /tenant/beds`, `GET /tenant/my-stay`). */
import { request } from './client';
import type { ApiBedStay, ApiMyStayResponse } from './types';

/** Every active bed/stay the tenant currently holds — `$limit=-1` disables pagination. */
export async function listBeds(): Promise<ApiBedStay[]> {
  return request<ApiBedStay[]>('/tenant/beds', { query: { $limit: -1 } });
}

/** Full stay detail (owner contact, check-in pass, billing, announcements) for one bed. */
export async function getMyStay(bedId: number): Promise<ApiMyStayResponse> {
  return request<ApiMyStayResponse>('/tenant/my-stay', { query: { bed_id: bedId } });
}

/** The tenant's last-viewed bed if it's still in the list, else the first active bed —
 * shared by every screen that needs "the tenant's current stay" (My Stay, visitor log,
 * property support) so they all resolve the same active property/floor/room/bed context. */
export function pickPreferredBed(beds: ApiBedStay[], preferredId: number | null): ApiBedStay | null {
  if (preferredId != null) {
    const match = beds.find((b) => b.bed.id === preferredId);
    if (match) return match;
  }
  return beds[0] ?? null;
}
