import { request } from './client';
import type { StorageSolutionEnquiryRequest, StorageSolutionEnquiryResponse } from './types';

export async function createStorageSolutionEnquiry(
  input: StorageSolutionEnquiryRequest
): Promise<StorageSolutionEnquiryResponse> {
  return request<StorageSolutionEnquiryResponse>('/tenant/storage-solution-enquiry', {
    method: 'POST',
    body: input,
  });
}