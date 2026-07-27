/** Tenant home dashboard (auth_api.md — Tenant dashboard API). */
import { request } from './client';
import type { LocalityMaster } from './types';
import type { ContinueBrowsingProperty } from './continueBrowsing';

export interface DashboardQuery {
  cityId: number;
  /** [latitude, longitude] — only sent for a GPS-resolved location, per the doc. */
  coordinates?: [number, number];
}

export interface DashboardResponse {
  near_you: ContinueBrowsingProperty[];
  popular_areas: LocalityMaster[];
  continue_browsing: ContinueBrowsingProperty[];
}

export async function getDashboard({ cityId, coordinates }: DashboardQuery): Promise<DashboardResponse> {
  const params = [`city_id=${encodeURIComponent(cityId)}`];
  if (coordinates) {
    params.push(`coordinates[]=${encodeURIComponent(coordinates[0])}`, `coordinates[]=${encodeURIComponent(coordinates[1])}`);
  }
  return request<DashboardResponse>(`/tenant/dashboard?${params.join('&')}`);
}
