/** Group booking enquiry (`POST /booking-management/group-booking-enquiry`). */
import { request } from './client';
import type { ApiGroupBookingEnquiry, CreateGroupBookingEnquiryInput } from './types';

export async function createGroupBookingEnquiry(input: CreateGroupBookingEnquiryInput): Promise<ApiGroupBookingEnquiry> {
  return request<ApiGroupBookingEnquiry>('/booking-management/group-booking-enquiry', { method: 'POST', body: input });
}
