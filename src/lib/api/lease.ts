/** Tenant lease agreements (`GET /tenant/lease-agreements` — list/detail). */
import { request } from './client';
import type { ListResponse, Paginated } from './types';

export type LeaseAgreementStatus =
  | 'PENDING_TENANT'
  | 'SIGNED'
  | 'CANCELLED'
  | 'EXPIRED'
  | (string & {});

export interface LeaseAgreementPropertyRef {
  id: number;
  name: string;
  code: string;
}

export interface LeaseAgreementRoomRef {
  id: number;
  room_number: string;
}

export interface LeaseAgreementBedRef {
  id: number;
  bed_number: string;
}

export interface LeaseAgreementBookingRef {
  id: number;
  code: string;
  status: string;
  booking_mode: 'MONTHLY' | 'DAILY' | 'HOURLY' | (string & {});
  lock_in_period_months: number;
  notice_period_days: number;
}

export interface LeaseAgreement {
  id: number;
  booking_id: number;
  status: LeaseAgreementStatus;
  agreement_url: string | null;
  signed_pdf_url: string | null;
  /** Hosted e-sign session URL(s) from the sign provider — shape varies by provider, so this
   * is read defensively (see `leaseSigningUrl` in `@/lib/leaseDisplay`) rather than typed strictly. */
  lease_signing_urls: unknown;
  payment_link: string | null;
  doqfy_document_id: string | null;
  lease_start_date: string;
  lease_end_date: string;
  lock_in_end: string;
  notice_period_days: number;
  signed_on: string | null;
  tenant_signed_on: string | null;
  owner_signed_on: string | null;
  renewed_to_agreement_id: number | null;
  renewed_on: string | null;
  expired_on: string | null;
  created_at: string;
  updated_at: string;
  property: LeaseAgreementPropertyRef;
  room: LeaseAgreementRoomRef | null;
  bed: LeaseAgreementBedRef | null;
  booking: LeaseAgreementBookingRef;
}

export interface LeaseAgreementCounts {
  awaiting_signature: number;
  expiring_within_60_days: number;
  total: number;
  active_signed: number;
}

export type LeaseAgreementListResponse = Paginated<LeaseAgreement> & { counts: LeaseAgreementCounts };

/** The three filter presets the tenant-facing list screen offers — 'ALL' omits the `status`
 * query param entirely rather than being a real backend status value. */
export type LeaseAgreementStatusFilter = 'ALL' | 'PENDING_TENANT' | 'SIGNED';

export interface ListLeaseAgreementsQuery {
  limit?: number;
  skip?: number;
  /** Filters by property name. */
  search?: string;
  status?: LeaseAgreementStatusFilter;
  bookingId?: number;
}

export async function listLeaseAgreements({
  limit = 10,
  skip = 0,
  search,
  status,
  bookingId,
}: ListLeaseAgreementsQuery = {}): Promise<LeaseAgreementListResponse> {
  const res = await request<ListResponse<LeaseAgreement> & Partial<Pick<LeaseAgreementListResponse, 'counts'>>>('/tenant/lease-agreements', {
    query: {
      $limit: limit,
      $skip: skip,
      '$sort[created_at]': -1,
      $search: search?.trim() || undefined,
      status: status && status !== 'ALL' ? status : undefined,
      booking_id: bookingId,
    },
  });
  if (Array.isArray(res)) {
    return { data: res, total: res.length, skip: 0, limit: res.length, counts: { awaiting_signature: 0, expiring_within_60_days: 0, total: res.length, active_signed: 0 } };
  }
  return { ...res, counts: res.counts ?? { awaiting_signature: 0, expiring_within_60_days: 0, total: res.total, active_signed: 0 } };
}

/** The current (latest) lease agreement for a booking — used by My Stay's lease section. */
export async function getLeaseAgreementForBooking(bookingId: number): Promise<LeaseAgreement | null> {
  const page = await listLeaseAgreements({ bookingId, limit: 1 });
  return page.data[0] ?? null;
}

export async function getLeaseAgreement(id: number): Promise<LeaseAgreement> {
  return request<LeaseAgreement>(`/tenant/lease-agreements/${id}`);
}
