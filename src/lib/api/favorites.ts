/** Tenant favorite/saved properties (auth_api.md — Save/unsave property API). */
import { request } from './client';
import type { ApiFavoritePropertyItem, ListResponse, Paginated, TenantFavoriteProperty } from './types';

/** Save a property to the tenant's favorites. */
export async function addFavoriteProperty(propertyId: number): Promise<TenantFavoriteProperty> {
  return request<TenantFavoriteProperty>('/tenant-management/tenant-favorite-property', {
    method: 'POST',
    body: { property_id: propertyId },
  });
}

/** Remove a property from favorites — `favoriteId` is the favorite record's own id, not the property's. */
export async function removeFavoriteProperty(favoriteId: number): Promise<TenantFavoriteProperty> {
  return request<TenantFavoriteProperty>(`/tenant-management/tenant-favorite-property/${favoriteId}`, {
    method: 'DELETE',
  });
}

export interface ListFavoritePropertiesQuery {
  limit?: number;
  skip?: number;
}

/** The tenant's saved properties, eager-loaded with the full property row. */
export async function listFavoriteProperties({ limit = 10, skip = 0 }: ListFavoritePropertiesQuery = {}): Promise<Paginated<ApiFavoritePropertyItem>> {
  const res = await request<ListResponse<ApiFavoritePropertyItem>>('/tenant-management/tenant-favorite-property', {
    query: { '$eager[]': 'property', $limit: limit, $skip: skip },
  });
  if (Array.isArray(res)) return { data: res, total: res.length, skip: 0, limit: res.length };
  return res;
}
