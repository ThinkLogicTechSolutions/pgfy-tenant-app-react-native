/** Property lead — a tenant reports a PG/hostel that isn't listed yet
 *  (`POST /property-management/property-lead`). */
import { request } from './client';
import type { ApiPropertyLead, CreatePropertyLeadInput } from './types';

export async function createPropertyLead(input: CreatePropertyLeadInput): Promise<ApiPropertyLead> {
  return request<ApiPropertyLead>('/property-management/property-lead', { method: 'POST', body: input });
}
