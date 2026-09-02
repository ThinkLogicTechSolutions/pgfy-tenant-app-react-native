/** Platform support — FAQs (`GET /support/faq`) & support queries
 * (`GET/POST /support/support-query`, `GET /support/support-query/:id`). */
import { request } from './client';
import type {
  ApiFaqListResponse,
  ApiSupportQuery,
  ApiSupportQueryListResponse,
  CreateSupportQueryInput,
  SupportPanel,
} from './types';

export interface ListFaqsQuery {
  panel: SupportPanel;
  limit?: number;
  skip?: number;
}

export async function listFaqs({ panel, limit = 20, skip = 0 }: ListFaqsQuery): Promise<ApiFaqListResponse> {
  return request<ApiFaqListResponse>('/support/faq', {
    query: { panel, status: 'ACTIVE', $limit: limit, $skip: skip },
  });
}

export interface ListSupportQueriesQuery {
  limit?: number;
  skip?: number;
}

/** Auto-scoped server-side to the signed-in tenant/owner's own queries. */
export async function listSupportQueries(query: ListSupportQueriesQuery = {}): Promise<ApiSupportQueryListResponse> {
  return request<ApiSupportQueryListResponse>('/support/support-query', {
    query: { $eager: '[category]', $limit: query.limit ?? 20, $skip: query.skip ?? 0 },
  });
}

export async function getSupportQuery(id: number): Promise<ApiSupportQuery> {
  return request<ApiSupportQuery>(`/support/support-query/${id}`, { query: { $eager: '[category]' } });
}

export async function createSupportQuery(input: CreateSupportQueryInput): Promise<ApiSupportQuery> {
  return request<ApiSupportQuery>('/support/support-query', { method: 'POST', body: input });
}
