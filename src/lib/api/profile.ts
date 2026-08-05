/** Tenant profile endpoint (auth_api.md — Edit profile API). */
import { request } from './client';
import type { ApiProfile } from './types';

export type UpdateTenantProfileInput = Partial<
  Pick<
    ApiProfile,
    | 'name'
    | 'avatar'
    | 'personal_details'
    | 'occupation_details'
    | 'bank_details'
    | 'roommate_preferences'
    | 'push_notification_enabled'
  >
>;

export async function updateTenantProfile(id: number, patch: UpdateTenantProfileInput): Promise<ApiProfile> {
  return request<ApiProfile>(`/profile/tenant-profile/${id}`, { method: 'PATCH', body: patch });
}

/** `POST /tenant/delete-request` — doesn't delete the account immediately; the team verifies
 * there are no pending bookings/dues first, then processes it. */
export async function requestAccountDeletion(reason: string): Promise<void> {
  await request<unknown>('/tenant/delete-request', { method: 'POST', body: { reason } });
}
