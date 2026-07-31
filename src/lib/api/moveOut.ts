/** Move-out / exit requests (`GET/POST /tenant/move-out`). */
import { request } from './client';
import type { ApiMoveOutEstimate, ApiMoveOutRequest, CreateMoveOutInput, Paginated } from './types';

export interface MoveOutEstimateQuery {
  bookingId: number;
  /** Date-only (`yyyy-mm-dd`). */
  expectedMoveOut: string;
}

/** A preview only — nothing is saved until `createMoveOut`. */
export async function getMoveOutEstimate({ bookingId, expectedMoveOut }: MoveOutEstimateQuery): Promise<ApiMoveOutEstimate> {
  return request<ApiMoveOutEstimate>('/tenant/move-out', {
    query: { estimate: true, booking_id: bookingId, expected_move_out: expectedMoveOut },
  });
}

export async function createMoveOut(input: CreateMoveOutInput): Promise<ApiMoveOutRequest> {
  return request<ApiMoveOutRequest>('/tenant/move-out', { method: 'POST', body: input });
}

export interface ListMoveOutsQuery {
  limit?: number;
  skip?: number;
  /** Filter to the requests raised for one booking — Feathers-style field filter, same
   * convention `getMoveOutEstimate` already uses for `booking_id`. */
  bookingId?: number;
}

export async function listMoveOuts(query: ListMoveOutsQuery = {}): Promise<Paginated<ApiMoveOutRequest>> {
  return request<Paginated<ApiMoveOutRequest>>('/tenant/move-out', {
    query: { $limit: query.limit ?? 10, $skip: query.skip ?? 0, booking_id: query.bookingId },
  });
}

export async function getMoveOut(id: number): Promise<ApiMoveOutRequest> {
  return request<ApiMoveOutRequest>(`/tenant/move-out/${id}`);
}
