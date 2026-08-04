/** Tenant bookings (booking_api.md — list/detail/create/cancel). */
import { request } from './client';
import type {
  ApiBooking,
  ApiBookingCancelResponse,
  ApiBookingCreateResponse,
  ApiBookingDetail,
  CancelBookingInput,
  CreateBookingInput,
  ListResponse,
  Paginated,
} from './types';

export interface ListBookingsQuery {
  limit?: number;
  skip?: number;
}

/** Paginated booking history — `$limit`/`$skip` are Feathers' standard pagination params. */
export async function listBookings({ limit = 10, skip = 0 }: ListBookingsQuery = {}): Promise<Paginated<ApiBooking>> {
  const res = await request<ListResponse<ApiBooking>>('/tenant/booking', {
    query: { $limit: limit, $skip: skip },
  });
  if (Array.isArray(res)) {
    return { data: res, total: res.length, skip: 0, limit: res.length };
  }
  return res;
}

export async function getBooking(id: number): Promise<ApiBookingDetail> {
  return request<ApiBookingDetail>(`/tenant/booking/${id}`);
}

/** Creates a booking hold + invoice + payment transaction in one call. */
export async function createBooking(input: CreateBookingInput): Promise<ApiBookingCreateResponse> {
  return request<ApiBookingCreateResponse>('/tenant/booking', {
    method: 'POST',
    // Every booking made from this app is tagged so the backend can attribute it correctly.
    body: { ...input, source: 'APP' },
  });
}

export async function cancelBooking(input: CancelBookingInput): Promise<ApiBookingCancelResponse> {
  return request<ApiBookingCancelResponse>('/tenant/cancel-booking', {
    method: 'POST',
    body: input,
  });
}
