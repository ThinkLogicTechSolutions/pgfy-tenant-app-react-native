import { request } from './client';
import type {CreatePackersMoversEnquiryRequest, CreatePackersMoversEnquiryResponse} from './types';

export async function createPackersMoversEnquiry(input: CreatePackersMoversEnquiryRequest,): Promise<CreatePackersMoversEnquiryResponse> {
    return request<CreatePackersMoversEnquiryResponse>('/tenant/packers-movers-enquiry', { method: 'POST', body: input });
}