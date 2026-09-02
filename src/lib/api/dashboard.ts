/** Tenant home dashboard (auth_api.md — Tenant dashboard API). */
import { request } from './client';
import type { LocalityMaster } from './types';
import type { ContinueBrowsingProperty } from './continueBrowsing';

export type DashboardStayDuration = 'MONTHLY' | 'DAILY' | 'HOURLY';

/** Home's "near you" category tabs — matches the Home screen's All / PGs/Hostels / Flats /
 * Homestay tiles. `ALL` (the default) omits the filter server-side and shows every category. */
export type DashboardPropertyCategory = 'HOSTEL' | 'FLAT' | 'HOMESTAY';

export interface DashboardQuery {
  cityId: number;
  /** [latitude, longitude] — only sent for a GPS-resolved location, per the doc. */
  coordinates?: [number, number];
  /** Scopes `near_you` to properties supporting this stay type. Booking mode is now chosen
   * inside property details, not on Home, so Home no longer sends this — kept optional for any
   * other caller that still wants a stay-type-scoped dashboard. */
  stayDuration?: DashboardStayDuration;
  /** Scopes `near_you` to this property category. Omitted (or `undefined`) shows every
   * category — the Home screen's default "All" tab. */
  propertyCategory?: DashboardPropertyCategory;
}

export interface DashboardResponse {
  near_you: ContinueBrowsingProperty[];
  popular_areas: LocalityMaster[];
  continue_browsing: ContinueBrowsingProperty[];
}

export async function getDashboard({ cityId, coordinates, stayDuration, propertyCategory }: DashboardQuery): Promise<DashboardResponse> {
  const params = [`city_id=${encodeURIComponent(cityId)}`];
  if (coordinates) {
    params.push(`coordinates[]=${encodeURIComponent(coordinates[0])}`, `coordinates[]=${encodeURIComponent(coordinates[1])}`);
  }
  if (stayDuration) {
    params.push(`stay_duration=${encodeURIComponent(stayDuration)}`);
  }
  if (propertyCategory) {
    params.push(`property_category[]=${encodeURIComponent(propertyCategory)}`);
  }
  return request<DashboardResponse>(`/tenant/dashboard?${params.join('&')}`);
}
