/** Tenant billing / rent invoices (billing_api.md — `GET /tenant/billing-rent`, pay-rent). */
import { request } from './client';
import type { ApiBillingRentResponse, ApiInvoice, ApiPayRentResponse, PayRentInput } from './types';

export interface ListBillingRentQuery {
  /** Inclusive lower bound on `due_date`, full ISO datetime (e.g. `2026-05-01T00:00:00.000Z`). */
  fromIso: string;
  /** Inclusive upper bound on `due_date`, full ISO datetime (e.g. `2026-07-31T23:59:59.999Z`). */
  toIso: string;
  limit?: number;
  skip?: number;
  /** Include the aggregate summary for this same filtered range. Defaults on. */
  summary?: boolean;
  /** Eager-load property/room/booking listing details. Defaults on. */
  listing?: boolean;
}

export async function listBillingRent({
  fromIso,
  toIso,
  limit = 50,
  skip = 0,
  summary = true,
  listing = true,
}: ListBillingRentQuery): Promise<ApiBillingRentResponse> {
  return request<ApiBillingRentResponse>('/tenant/billing-rent', {
    query: {
      summary,
      listing,
      'due_date[$gte]': fromIso,
      'due_date[$lte]': toIso,
      $limit: limit,
      $skip: skip,
    },
  });
}

/** A single invoice — fetched fresh rather than trusting the list response's `pdf_attachment`,
 * which is often still `null` there even once the PDF exists. */
export async function getBillingRentInvoice(id: number): Promise<ApiInvoice> {
  return request<ApiInvoice>(`/tenant/billing-rent/${id}`);
}

/** Pays (or starts paying) a single rent invoice. CASH resolves immediately (offline, owner
 * verifies via OTP); online methods return a Razorpay order to complete, and `AUTOPAY` also
 * returns a second order to authorize the recurring mandate. */
export async function payRent(input: PayRentInput): Promise<ApiPayRentResponse> {
  return request<ApiPayRentResponse>('/tenant/pay-rent', {
    method: 'POST',
    body: input,
  });
}
