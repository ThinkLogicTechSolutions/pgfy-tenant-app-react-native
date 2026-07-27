/** Recently viewed properties (auth_api.md — View all continue browsing API). */
import { request } from './client';
import type { MediaAttachment, PropertyGender } from './types';

export interface ContinueBrowsingMediaSection {
  section_name: string;
  attachments: MediaAttachment[];
}

export interface ContinueBrowsingProperty {
  id: number;
  name: string;
  code: string;
  is_promoted: boolean;
  is_favorite: boolean;
  favorite_id: number | null;
  distance: number | null;
  gender: PropertyGender;
  property_type: string;
  locality: string;
  city: string;
  amenities: string[];
  media: ContinueBrowsingMediaSection[];
  starting_rent: number;
  starting_rent_type: string;
  available_beds: number;
  rating: number | null;
}

export interface ContinueBrowsingPage {
  data: ContinueBrowsingProperty[];
  total: number;
  skip: number;
  limit: number;
}

export async function getContinueBrowsing({ limit = 10, skip = 0 }: { limit?: number; skip?: number } = {}): Promise<ContinueBrowsingPage> {
  const res = await request<{ total: number; $limit: number; $skip: number; data: ContinueBrowsingProperty[] }>('/tenant/continue-browsing', {
    query: { $limit: limit, $skip: skip },
  });
  return { data: res.data, total: res.total, skip: res.$skip, limit: res.$limit };
}
