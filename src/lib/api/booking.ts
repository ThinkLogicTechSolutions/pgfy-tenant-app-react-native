/** Tenant bookings (booking_api.md — list/detail/create/cancel). */
import { request } from './client';
import type {
  ApiBooking,
  ApiBookingCancelPreview,
  ApiBookingCancelResponse,
  ApiBookingCreateResponse,
  ApiBookingDetail,
  ApiBookingInvoiceLink,
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

/** The booking's move-in invoice PDF — fetched on demand (not embedded in `getBooking`)
 * since it's minted asynchronously and may not exist yet for an unpaid booking. */
export async function getBookingInvoice(bookingId: number): Promise<ApiBookingInvoiceLink> {
  return request<ApiBookingInvoiceLink>('/tenant/booking-invoice', {
    query: { booking_id: bookingId },
  });
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

/** The refund breakdown the tenant *would* get, without cancelling — the charge is derived
 * from the platform's master config server-side, so this is authoritative in a way a
 * client-side estimate wouldn't be. */
export async function previewCancellation(bookingId: number): Promise<ApiBookingCancelPreview> {
  return request<ApiBookingCancelPreview>('/tenant/cancel-booking', {
    method: 'POST',
    body: { booking_id: bookingId, cancellation_reason: 'preview', preview: true },
  });
}
