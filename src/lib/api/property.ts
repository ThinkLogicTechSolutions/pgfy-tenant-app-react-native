/** Property search (auth_api.md — Search property API). */
import { request } from './client';
import type { ContinueBrowsingProperty } from './continueBrowsing';
import type {
  AllowedTenantType,
  ApiBookingMode,
  ApiPropertyDetails,
  ApiRoomBedAvailability,
  Furnishing,
  PropertyCategory,
  PropertyGender,
  PropertySubCategory,
} from './types';

/** Matches `GET /v1/tenant/properties` (`GetMarketplaceProperties`) — the real marketplace
 * search/filter endpoint, not `/property-management/property` (a bare listing with no filters). */
export interface SearchPropertiesQuery {
  cityId?: number;
  localityId?: number;
  /** [latitude, longitude] — needed for `distanceMax` to filter/sort by anything. */
  coordinates?: [number, number];
  gender?: PropertyGender;
  /** Free-text — matches property name/code (see `searchApi` for the richer location-aware
   * keyword search used by the search box itself). */
  search?: string;
  stayDuration?: ApiBookingMode;
  /** One or more categories — `HOSTEL`, `FLAT`, `HOMESTAY`. */
  propertyCategory?: PropertyCategory | PropertyCategory[];
  typeId?: number | number[];
  propertySubCategory?: PropertySubCategory | PropertySubCategory[];
  furnishing?: Furnishing;
  allowedTenantType?: AllowedTenantType;
  /** Monthly/daily/hourly rent range (₹), scoped by `stayDuration`. */
  priceMin?: number;
  priceMax?: number;
  /** Minimum overall rating, e.g. `4` → 4★ and up. */
  ratingMin?: number;
  /** Search radius in km — needs `coordinates` to have any effect. */
  distanceMax?: number;
  isAc?: boolean;
  /** Amenity name substrings — a property must have every one. */
  amenities?: string[];
  /** Roommate compatibility (hostel only — ignored for Flat/Homestay). */
  dietPreference?: string;
  occupation?: string;
  smokingPref?: boolean;
  alcoholPref?: boolean;
  sleepSchedule?: string;
  limit?: number;
  skip?: number;
}

export interface PropertyPage {
  data: ContinueBrowsingProperty[];
  total: number;
  skip: number;
  limit: number;
}

/** Properties in the marketplace, filtered by every criterion the search/filter sheet exposes. */
export async function searchProperties(query: SearchPropertiesQuery = {}): Promise<PropertyPage> {
  const {
    cityId, localityId, coordinates, gender, search, stayDuration, propertyCategory, typeId,
    propertySubCategory, furnishing, allowedTenantType, priceMin, priceMax, ratingMin, distanceMax,
    isAc, amenities, dietPreference, occupation, smokingPref, alcoholPref, sleepSchedule, limit, skip,
  } = query;

  // Key names are literal (matching `dashboard.ts`'s convention) — only values are encoded, so
  // `key[]` array-bracket notation survives for the backend's query parser.
  const params: string[] = [];
  const add = (key: string, value: string | number | boolean | undefined | null) => {
    if (value === undefined || value === null || value === '') return;
    params.push(`${key}=${encodeURIComponent(String(value))}`);
  };
  const addMany = (key: string, values: (string | number)[] | undefined) => {
    for (const v of values ?? []) params.push(`${key}[]=${encodeURIComponent(String(v))}`);
  };

  add('city_id', cityId);
  add('locality_id', localityId);
  if (coordinates) {
    params.push(`coordinates[]=${encodeURIComponent(coordinates[0])}`, `coordinates[]=${encodeURIComponent(coordinates[1])}`);
  }
  add('gender', gender);
  add('search', search);
  add('stay_duration', stayDuration ? stayDuration.toUpperCase() : undefined);
  Array.isArray(propertyCategory) ? addMany('property_category', propertyCategory) : add('property_category', propertyCategory);
  Array.isArray(typeId) ? addMany('type_id', typeId) : add('type_id', typeId);
  Array.isArray(propertySubCategory) ? addMany('property_sub_category', propertySubCategory) : add('property_sub_category', propertySubCategory);
  add('furnishing', furnishing);
  add('allowed_tenant_type', allowedTenantType);
  add('price_min', priceMin);
  add('price_max', priceMax);
  add('rating_min', ratingMin);
  add('distance_max', distanceMax);
  add('is_ac', isAc);
  addMany('amenities', amenities);
  add('diet_preference', dietPreference);
  add('occupation', occupation);
  add('smoking_pref', smokingPref);
  add('alcohol_pref', alcoholPref);
  add('sleep_schedule', sleepSchedule);
  add('$limit', limit);
  add('$skip', skip);

  const res = await request<{ total: number; $limit: number; $skip: number; data: ContinueBrowsingProperty[] } | ContinueBrowsingProperty[]>(
    `/tenant/properties${params.length ? `?${params.join('&')}` : ''}`,
  );
  if (Array.isArray(res)) {
    return { data: res, total: res.length, skip: 0, limit: res.length };
  }
  return { data: res.data, total: res.total, skip: res.$skip, limit: res.$limit };
}

export interface PropertyDetailsQuery {
  bookingMode?: ApiBookingMode;
  /** Log this view for the tenant's recently-viewed / analytics. */
  recordView?: boolean;
}

/** Full property details, scoped to a booking mode's pricing. */
export async function getPropertyDetails(
  id: number,
  { bookingMode = 'MONTHLY', recordView }: PropertyDetailsQuery = {},
): Promise<ApiPropertyDetails> {
  return request<ApiPropertyDetails>(`/tenant/properties/${id}`, {
    query: { booking_mode: bookingMode, record_view: recordView },
  });
}

export interface RoomBedAvailabilityQuery {
  bookingMode?: ApiBookingMode;
  /** Raw layout code from the pricing tier the tenant picked, e.g. `SINGLE`. */
  layout: string;
  isAc: boolean;
  withFood: boolean;
}

/** Floor/room/bed availability for one specific occupancy combination. */
export async function getRoomBedAvailability(
  id: number,
  { bookingMode = 'MONTHLY', layout, isAc, withFood }: RoomBedAvailabilityQuery,
): Promise<ApiRoomBedAvailability> {
  return request<ApiRoomBedAvailability>(`/tenant/properties/${id}`, {
    query: { booking_mode: bookingMode, layout, is_ac: isAc, with_food: withFood },
  });
}
