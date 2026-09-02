/** Room swap / bed change (`GET/POST /tenant/change-bed`, `GET/PATCH /tenant/change-bed/:id`). */
import { request, ApiError } from './client';
import type {
  ApiSwapFloorGroup,
  ApiChangeBedRequest,
  CreateChangeBedInput,
  CancelChangeBedInput,
} from './types';

/** Beds available to swap into, grouped by floor. */
export async function getAvailableSwapRooms(bookingId: number): Promise<ApiSwapFloorGroup[]> {
  return request<ApiSwapFloorGroup[]>('/tenant/change-bed', { query: { booking_id: bookingId } });
}

/** The booking's active (most recent) change-bed request, or `null` when there isn't one. */
export async function getScheduledChangeBed(bookingId: number): Promise<ApiChangeBedRequest | null> {
  try {
    return await request<ApiChangeBedRequest>(`/tenant/change-bed/${bookingId}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function createChangeBedRequest(input: CreateChangeBedInput): Promise<ApiChangeBedRequest> {
  return request<ApiChangeBedRequest>('/tenant/change-bed', { method: 'POST', body: input });
}

export async function cancelChangeBedRequest(id: number, input: CancelChangeBedInput): Promise<ApiChangeBedRequest> {
  return request<ApiChangeBedRequest>(`/tenant/change-bed/${id}`, {
    method: 'PATCH',
    body: { ...input, action: 'CANCEL' },
  });
}
