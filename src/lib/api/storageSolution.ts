import { request } from './client';
import type { StorageSolutionEnquiryRequest, StorageSolutionEnquiryResponse, ListResponse, StorageSolutionEnquiryStatus } from './types';

export interface StorageSolutionQuery {
  limit?: number;
  skip?: number;
  status?: StorageSolutionEnquiryStatus | 'ALL';
  tacking_id?: number;
  from_date?: string;
  to_date?: string;
}

export async function createStorageSolutionEnquiry(
  input: StorageSolutionEnquiryRequest
): Promise<StorageSolutionEnquiryResponse> {
  return request<StorageSolutionEnquiryResponse>('/tenant/storage-solution-enquiry', {
    method: 'POST',
    body: input,
  });
}

export async function listStorageSolutionEnquiries({
  limit = 10,
  skip = 0,
  status,
  tacking_id,
  from_date,
  to_date
}: StorageSolutionQuery): Promise<ListResponse<StorageSolutionEnquiryResponse>> {
  
  const queryObj: Record<string, any> = {
    $limit: limit,
    $skip: skip,
    '$sort[created_at]': -1,
    status: status && status !== 'ALL' ? status : undefined,
    id: tacking_id,
  };

  if (from_date) queryObj['created_at[$gte]'] = `${from_date}T00:00:00.000Z`;
  if (to_date) queryObj['created_at[$lte]'] = `${to_date}T23:59:59.999Z`;

  return request<ListResponse<StorageSolutionEnquiryResponse>>('/tenant/storage-solution-enquiry', { 
    query: queryObj
  });
}

export async function getStorageSolutionEnquiry(id: string): Promise<StorageSolutionEnquiryResponse> {
  return request<StorageSolutionEnquiryResponse>(`/tenant/storage-solution-enquiry/${id}`);
}

export async function cancelStorageSolutionEnquiry(id: string): Promise<StorageSolutionEnquiryResponse> {
  return request<StorageSolutionEnquiryResponse>(`/tenant/storage-solution-enquiry/${id}`, { 
    method: 'PATCH', 
    body: { status: 'CANCELLED' } 
  });
}