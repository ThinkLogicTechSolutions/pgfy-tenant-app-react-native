/** Property search (auth_api.md — Search property API). */
import { request } from './client';
import { unwrapList } from './types';
import type {
  ApiBookingMode,
  ApiProperty,
  ApiPropertyDetails,
  ApiRoomBedAvailability,
  ListResponse,
  PropertyCategory,
  PropertyGender,
  PropertySubCategory,
} from './types';

export interface SearchPropertiesQuery {
  cityId?: number;
  localityId?: number;
  gender?: PropertyGender;
  category?: PropertyCategory;
  subCategory?: PropertySubCategory;
}

export interface PropertyPage {
  data: ApiProperty[];
  total: number;
  skip: number;
  limit: number;
}

/** Properties operational in a given city/locality (optionally scoped by gender/category). */
export async function searchProperties({ cityId, localityId, gender, category, subCategory }: SearchPropertiesQuery = {}): Promise<PropertyPage> {
  const res = await request<ListResponse<ApiProperty>>('/property-management/property', {
    query: { city_id: cityId, locality_id: localityId, gender, property_category: category, property_sub_category: subCategory },
  });
  if (Array.isArray(res)) {
    return { data: res, total: res.length, skip: 0, limit: res.length };
  }
  return { data: unwrapList(res), total: res.total, skip: res.skip, limit: res.limit };
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
