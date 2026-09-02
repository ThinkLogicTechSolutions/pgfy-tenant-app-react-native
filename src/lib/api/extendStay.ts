/** Extend a Daily/Hourly checked-in stay (`GET/POST /tenant/extend-stay`). */
import { request } from './client';
import type {
  ApiExtendStayPreview,
  ApiExtendStayAvailability,
  ApiCreateExtensionResponse,
  CheckExtensionAvailabilityInput,
  CreateExtensionInput,
} from './types';

/** A preview only — not a saved request. */
export async function getExtendStayPreview(bookingId: number): Promise<ApiExtendStayPreview> {
  return request<ApiExtendStayPreview>('/tenant/extend-stay', { query: { booking_id: bookingId } });
}

/** A preview only — not a saved request. */
export async function checkExtensionAvailability(input: CheckExtensionAvailabilityInput): Promise<ApiExtendStayAvailability> {
  return request<ApiExtendStayAvailability>('/tenant/extend-stay', {
    method: 'POST',
    body: { action: 'check-availability', ...input },
  });
}

export async function createExtension(input: CreateExtensionInput): Promise<ApiCreateExtensionResponse> {
  return request<ApiCreateExtensionResponse>('/tenant/extend-stay', { method: 'POST', body: input });
}
