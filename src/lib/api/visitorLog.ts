/** Visitor log (`GET/POST/PATCH/DELETE /tenant-management/visitor-log`). */
import { request } from './client';
import type { ApiVisitorLog, CreateVisitorLogInput, Paginated } from './types';

export interface ListVisitorLogsQuery {
  limit?: number;
  skip?: number;
}

export async function listVisitorLogs(query: ListVisitorLogsQuery = {}): Promise<Paginated<ApiVisitorLog>> {
  return request<Paginated<ApiVisitorLog>>('/tenant-management/visitor-log', {
    query: { $limit: query.limit ?? 20, $skip: query.skip ?? 0 },
  });
}

export async function createVisitorLog(input: CreateVisitorLogInput): Promise<ApiVisitorLog> {
  return request<ApiVisitorLog>('/tenant-management/visitor-log', { method: 'POST', body: input });
}

/** `PATCH` with `regenerate_otp: true` — the only supported patch operation on a log. */
export async function regenerateVisitorOtp(id: number): Promise<ApiVisitorLog> {
  return request<ApiVisitorLog>(`/tenant-management/visitor-log/${id}`, {
    method: 'PATCH',
    body: { regenerate_otp: true },
  });
}

export async function deleteVisitorLog(id: number): Promise<void> {
  await request<void>(`/tenant-management/visitor-log/${id}`, { method: 'DELETE' });
}
