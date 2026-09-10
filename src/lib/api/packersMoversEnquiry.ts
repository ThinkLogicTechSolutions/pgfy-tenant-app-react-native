import { request, type RequestOptions } from './client';
import type { CreatePackersMoversEnquiryRequest, CreatePackersMoversEnquiryResponse, ListResponse, PackersMoversStatusType } from './types';

export interface PackerMoversQuery {
  limit? : number;
  skip? : number;
  status? : PackersMoversStatusType | 'ALL';
  tacking_id? : number;
  from_date?: string;
  to_date?: string;
}

export async function createPackersMoversEnquiry(input: CreatePackersMoversEnquiryRequest): Promise<CreatePackersMoversEnquiryResponse> {
  return request<CreatePackersMoversEnquiryResponse>('/tenant/packers-movers-enquiry', { method: 'POST', body: input });
}

export async function listPackersMoversEnquiries({
  limit = 10,
  skip = 0,
  status,
  tacking_id,
  from_date,
  to_date
}: PackerMoversQuery): Promise<ListResponse<CreatePackersMoversEnquiryResponse>> {
  return request<ListResponse<CreatePackersMoversEnquiryResponse>>('/tenant/packers-movers-enquiry', { 
    query: {
      $limit: limit,
      $skip: skip,
      '$sort[created_at]': -1,
      status: status && status !== 'ALL' ? status : undefined,
      id: tacking_id,
      from_date: from_date,
      to_date: to_date
    }
  });
}

export async function getPackersMoversEnquiry(id: string): Promise<CreatePackersMoversEnquiryResponse> {
  return request<CreatePackersMoversEnquiryResponse>(`/tenant/packers-movers-enquiry/${id}`);
}

export async function cancelPackersMoversEnquiry(id: string): Promise<CreatePackersMoversEnquiryResponse> {
  // Assuming a PATCH to update status to CANCELLED, or a specific endpoint. We will use PATCH.
  return request<CreatePackersMoversEnquiryResponse>(`/tenant/packers-movers-enquiry/${id}`, { 
    method: 'PATCH', 
    body: { status: 'CANCELLED' } 
  });
}