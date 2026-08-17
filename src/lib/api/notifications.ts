/** Tenant notifications (`GET/PATCH /notification-management/tenant-notification`). */
import { request } from './client';
import type { ApiTenantNotification, ListResponse, Paginated } from './types';

export interface ListNotificationsQuery {
  limit?: number;
  skip?: number;
}

export async function listNotifications({ limit = 20, skip = 0 }: ListNotificationsQuery = {}): Promise<Paginated<ApiTenantNotification>> {
  const res = await request<ListResponse<ApiTenantNotification>>('/notification-management/tenant-notification', {
    query: { $limit: limit, $skip: skip, '$sort[created_at]': -1 },
  });
  if (Array.isArray(res)) return { data: res, total: res.length, skip: 0, limit: res.length };
  return res;
}

// The reference curl for these two used `owner-notification` — almost certainly copied from
// the owner app's equivalent doc, since the list endpoint above (and every other tenant-side
// pairing in this API) is `tenant-notification`. Using that base path here for consistency;
// flag/fix if the backend actually expects `owner-notification` for a tenant caller too.

/** Marks a single notification seen. */
export async function markNotificationSeen(id: number): Promise<ApiTenantNotification> {
  return request<ApiTenantNotification>(`/notification-management/tenant-notification/${id}`, {
    method: 'PATCH',
    body: {},
  });
}

/** Marks every notification seen. */
export async function markAllNotificationsSeen(): Promise<unknown> {
  return request<unknown>('/notification-management/tenant-notification', {
    method: 'PATCH',
    body: {},
  });
}
