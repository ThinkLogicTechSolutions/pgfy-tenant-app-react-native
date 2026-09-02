/** Maintenance tickets (`GET/POST /maintenance-management/maintenance`). */
import { request } from './client';
import type { ApiMaintenanceListResponse, ApiMaintenanceTicket, CreateMaintenanceInput } from './types';

export interface ListMaintenanceQuery {
  limit?: number;
  skip?: number;
}

export async function listMaintenance(query: ListMaintenanceQuery = {}): Promise<ApiMaintenanceListResponse> {
  return request<ApiMaintenanceListResponse>('/maintenance-management/maintenance', {
    query: { $limit: query.limit ?? 20, $skip: query.skip ?? 0 },
  });
}

export async function createMaintenance(input: CreateMaintenanceInput): Promise<ApiMaintenanceTicket> {
  return request<ApiMaintenanceTicket>('/maintenance-management/maintenance', { method: 'POST', body: input });
}

const DETAIL_EAGER = '[property,floor,room,bed,category,assigned_staff,resolved_by]';

export async function getMaintenance(id: number): Promise<ApiMaintenanceTicket> {
  return request<ApiMaintenanceTicket>(`/maintenance-management/maintenance/${id}`, {
    query: { $eager: DETAIL_EAGER },
  });
}
