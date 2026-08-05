/** Tenant home dashboard (auth_api.md — Tenant dashboard API). */
import { request } from './client';
import type { LocalityMaster } from './types';
import type { ContinueBrowsingProperty } from './continueBrowsing';

export type DashboardStayDuration = 'MONTHLY' | 'DAILY' | 'HOURLY';

export interface DashboardQuery {
  cityId: number;
  /** [latitude, longitude] — only sent for a GPS-resolved location, per the doc. */
  coordinates?: [number, number];
  /** Scopes `near_you` to properties supporting this stay type — defaults to `MONTHLY`
   * server-side when omitted, matching the Home screen's default stay-type tab. */
  stayDuration?: DashboardStayDuration;
}

export interface DashboardResponse {
  near_you: ContinueBrowsingProperty[];
  popular_areas: LocalityMaster[];
  continue_browsing: ContinueBrowsingProperty[];
}

export async function getDashboard({ cityId, coordinates, stayDuration }: DashboardQuery): Promise<DashboardResponse> {
  const params = [`city_id=${encodeURIComponent(cityId)}`];
  if (coordinates) {
    params.push(`coordinates[]=${encodeURIComponent(coordinates[0])}`, `coordinates[]=${encodeURIComponent(coordinates[1])}`);
  }
  params.push(`stay_duration=${encodeURIComponent(stayDuration ?? 'MONTHLY')}`);
  return request<DashboardResponse>(`/tenant/dashboard?${params.join('&')}`);
}
