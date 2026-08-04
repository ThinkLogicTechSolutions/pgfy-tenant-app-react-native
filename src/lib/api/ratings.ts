/** Property ratings (GET/POST/PATCH/DELETE /tenant/ratings) — a tenant's own rating/review
 * of a property they've booked. */
import { request } from './client';
import { unwrapList } from './types';
import type { ApiPropertyRating, CreateRatingInput, ListResponse, UpdateRatingInput } from './types';

/** The signed-in tenant's own rating for a property, or `null` if they haven't rated it yet. */
export async function getMyRating(propertyId: number): Promise<ApiPropertyRating | null> {
  const rows = unwrapList(
    await request<ListResponse<ApiPropertyRating>>('/tenant/ratings', { query: { property_id: propertyId } }),
  );
  return rows[0] ?? null;
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
