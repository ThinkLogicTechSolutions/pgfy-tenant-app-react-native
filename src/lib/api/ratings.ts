/** Property ratings (GET/POST/PATCH/DELETE /tenant/ratings) — a tenant's own rating/review
 * of a property they've booked. */
import { request } from './client';
import { unwrapList } from './types';
import type { ApiPropertyRating, CreateRatingInput, ListResponse, UpdateRatingInput } from './types';

/** The signed-in tenant's own rating for a property, or `null` if they haven't rated it yet.
 * `GET /tenant/ratings?property_id=` isn't reliably tenant-scoped — it can return other
 * tenants' rows for the same property — so this validates `property_id`/`tenant_id` (and,
 * when a `bookingId` is given, `booking_id`) itself rather than trusting `rows[0]`. Without
 * that check, a stale/wrong row would render as if it were the signed-in tenant's own rating. */
export async function getMyRating(propertyId: number, tenantId: number, bookingId?: number): Promise<ApiPropertyRating | null> {
  const rows = unwrapList(
    await request<ListResponse<ApiPropertyRating>>('/tenant/ratings', { query: { property_id: propertyId } }),
  );
  const mine = rows.filter((r) => r.property_id === propertyId && r.tenant_id === tenantId);
  if (bookingId != null) {
    const forThisStay = mine.find((r) => r.booking_id === bookingId);
    if (forThisStay) return forThisStay;
  }
  return mine[0] ?? null;
}

export async function createRating(input: CreateRatingInput): Promise<ApiPropertyRating> {
  return request<ApiPropertyRating>('/tenant/ratings', { method: 'POST', body: input });
}

export async function updateRating(id: number, input: UpdateRatingInput): Promise<ApiPropertyRating> {
  return request<ApiPropertyRating>(`/tenant/ratings/${id}`, { method: 'PATCH', body: input });
}

export async function deleteRating(id: number): Promise<void> {
  await request<unknown>(`/tenant/ratings/${id}`, { method: 'DELETE' });
}
