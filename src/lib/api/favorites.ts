/** Tenant favorite/saved properties (auth_api.md — Save/unsave property API). */
import { request } from './client';
import type { TenantFavoriteProperty } from './types';

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
