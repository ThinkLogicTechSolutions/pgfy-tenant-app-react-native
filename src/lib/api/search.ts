/** Keyword search — property name / PGID (auth_api.md — Tenant search API). */
import { request } from './client';
import type { MasterMediaAsset, MediaAttachment, MasterStatus, PropertyGender, PropertyGstMode } from './types';

export interface SearchPropertyMediaSection {
  section_name: string;
  attachments: MediaAttachment[];
}

export interface SearchPropertyLocality {
  id: number;
  city_id: number;
  name: string;
  avatar?: MasterMediaAsset | null;
  property_count: number;
  priority: number;
  status: MasterStatus;
}

export interface SearchPropertyCity {
  id: number;
  state_id: number;
  code: string;
  name: string;
  property_count: number;
  priority: number;
  status: MasterStatus;
}

export interface SearchPropertyType {
  id: number;
  name: string;
  priority: number;
  status: MasterStatus;
}

/** Shallow property shape as returned by `GET /tenant/search`, eager-loaded with locality/city/type. */
export interface SearchProperty {
  id: number;
  code: string;
  type_id: number;
  name: string;
  description: string | null;
  address_line_1: string;
  landmark: string | null;
  city_id: number;
  locality_id: number;
  /** [longitude, latitude]. */
  coordinates: [number, number] | null;
  gender: PropertyGender;
  media: SearchPropertyMediaSection[];
  amenities: string[];
  house_rules: string[];
  owner_id: number;
  status: string;
  is_verified: boolean;
  verification_expiry: string | null;
  show_in_marketplace: boolean;
  is_promoted: boolean;
  security_deposit: number | null;
  lock_in_period_months: number | null;
  notice_period_days: number | null;
  hourly_booking_enabled: boolean;
  hourly_window_start: number | null;
  hourly_window_end: number | null;
  daily_booking_enabled: boolean;
  daily_check_in_time: number | null;
  daily_check_out_time: number | null;
  monthly_booking_enabled: boolean;
  gst_calculation_mode?: PropertyGstMode;
  gst_monthly_rate?: number;
  gst_daily_rate?: number;
  gst_hourly_rate?: number;
  total_rooms: number;
  total_beds: number;
  available_beds: number;
  reserved_beds: number;
  revenue_mtd?: number;
  created_at: string;
  updated_at: string;
  locality: SearchPropertyLocality;
  city: SearchPropertyCity;
  property_type: SearchPropertyType;
  is_favorite: boolean;
  favorite_id: number | null;
}

export interface SearchResponse {
  type: string;
  properties: SearchProperty[];
}

export async function searchProperties(search: string): Promise<SearchResponse> {
  return request<SearchResponse>('/tenant/search', { query: { search } });
}
