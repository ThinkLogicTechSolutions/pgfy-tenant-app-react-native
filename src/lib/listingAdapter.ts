/**
 * Maps API property shapes (auth_api.md) onto the richer `Listing` shape the existing
 * discovery/booking UI expects. The shallow search/continue-browsing responses don't return
 * floors/rooms/beds/reviews/food menu, so those stay empty for those adapters — only
 * `propertyDetailsToListing` (the `/tenant/properties/:id` detail endpoint) populates them.
 */
import type {
  ApiFoodMenu,
  ApiProperty,
  ApiPropertyDetails,
  ApiPropertyRating,
  ApiRoomBedAvailability,
  ContinueBrowsingProperty,
  PropertyCategory,
  PropertySubCategory,
  SearchProperty,
  VerificationDocStatus,
} from '@/lib/api';
import { propertySubCategoryLabel } from '@/lib/propertyCategory';
import type {
  Bed,
  Certificate,
  Floor,
  Listing,
  PropertyType,
  Gender,
  PricingVariant,
  Room,
  Review,
  SharingType,
  TenantRating,
  WeeklyMenuDay,
} from '@/data/types';

const TYPE_BY_ID: Record<number, PropertyType> = {
  1: 'PG',
  2: 'Hostel',
  3: 'Co-living',
};

function toGender(g: ApiProperty['gender']): Gender {
  if (g === 'MALE') return 'Male';
  if (g === 'FEMALE') return 'Female';
  return 'Co-ed';
}

function toPropertyType(t: string): PropertyType {
  const s = t.toUpperCase();
  if (s.includes('HOSTEL')) return 'Hostel';
  if (s.includes('CO-LIVING') || s.includes('COLIVING')) return 'Co-living';
  return 'PG';
}

/** My Stay's `/tenant/beds` and `/tenant/my-stay` hand back `property_category` (`FLAT`/
 * `HOMESTAY`) directly — a whole-unit booking has no room/bed/floor or AC/food room-tier to
 * show. Falls back to the plain `property_type` string on older responses that lack it. */
export function isUnitPropertyType(property: { property_category?: string | null; property_type?: string | null }): boolean {
  if (property.property_category) {
    const category = property.property_category.toUpperCase();
    return category === 'FLAT' || category === 'HOMESTAY';
  }
  if (!property.property_type) return false;
  const s = property.property_type.toUpperCase();
  return s.includes('FLAT') || s.includes('HOME');
}

/** Resolves a property's `type`/`subType`/`isUnitProperty` from the new category fields,
 *  falling back to the legacy Hostel `type_id` lookup for pre-existing (Hostel) properties. */
function resolvePropertyType(p: {
  type_id?: number | null;
  property_category?: PropertyCategory;
  property_sub_category?: PropertySubCategory | null;
}): { type: PropertyType; subType?: string; isUnitProperty: boolean } {
  if (p.property_category === 'FLAT') {
    const label = propertySubCategoryLabel(p.property_sub_category);
    return { type: 'Flat', subType: label || undefined, isUnitProperty: true };
  }
  if (p.property_category === 'HOMESTAY') {
    return { type: 'Home stay', isUnitProperty: true };
  }
  return { type: (p.type_id != null ? TYPE_BY_ID[p.type_id] : undefined) ?? 'PG', isUnitProperty: false };
}

function minutesToTime(m: number | null | undefined): string | undefined {
  if (m == null) return undefined;
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function apiPropertyToListing(p: ApiProperty, ctx: { cityName: string; localityName: string }): Listing {
  const attachments = p.media.flatMap((section) => section.attachments);
  const images = attachments.filter((a) => a.type === 1).map((a) => a.link);
  const coverImage = images[0] ?? '';
  const [lng, lat] = p.coordinates ?? [0, 0];
  const { type, subType, isUnitProperty } = resolvePropertyType(p);

  return {
    id: `api-${p.id}`,
    name: p.name,
    type,
    subType,
    isUnitProperty,
    maxOccupancy: p.max_occupancy ?? undefined,
    gender: toGender(p.gender),
    locality: ctx.localityName,
    city: ctx.cityName,
    addressLine: p.address_line_1,
    pincode: '',
    lat,
    lng,
    coverImage,
    gallery: images,
    mediaSections: p.media.map((s, i) => ({ id: `${p.id}-${i}`, name: s.section_name, images: s.attachments.map((a) => a.link) })),
    hasVideoTour: false,
    description: p.description ?? '',
    priceFrom: 0,
    securityDeposit: p.security_deposit ?? 0,
    rating: 0,
    reviewCount: 0,
    pgfyScore: 0,
    verified: p.is_verified,
    certificates: [],
    distanceKm: 0,
    amenities: p.amenities,
    houseRules: p.house_rules,
    foodIncluded: false,
    foodMenu: [],
    pricing: [],
    floors: [],
    vacantBeds: p.available_beds,
    occupancyPct: p.total_beds > 0 ? Math.round(((p.total_beds - p.available_beds) / p.total_beds) * 100) : 0,
    tags: [],
    nearby: [],
    reviews: [],
    ratingBreakdown: [],
    noticePeriodDays: p.notice_period_days ?? 0,
    lockInMonths: p.lock_in_period_months ?? 0,
    addedOn: p.created_at,
    bookingConfig: {
      hourlyEnabled: p.hourly_booking_enabled,
      dailyEnabled: p.daily_booking_enabled,
      monthlyEnabled: p.monthly_booking_enabled,
      hourly:
        p.hourly_booking_enabled && p.hourly_window_start != null && p.hourly_window_end != null
          ? { windowStart: minutesToTime(p.hourly_window_start)!, windowEnd: minutesToTime(p.hourly_window_end)! }
          : undefined,
      daily:
        p.daily_booking_enabled && p.daily_check_in_time != null && p.daily_check_out_time != null
          ? { checkInTime: minutesToTime(p.daily_check_in_time)!, checkOutTime: minutesToTime(p.daily_check_out_time)! }
          : undefined,
    },
    hourlyPricing: [],
    dailyPricing: [],
    manager: { name: '', phone: '' },
  };
}

/** Maps a keyword `/tenant/search` result onto the `Listing` shape. Like `apiPropertyToListing`,
 * the endpoint doesn't return pricing/reviews/roommate data, so those stay empty. */
export function searchPropertyToListing(p: SearchProperty): Listing {
  const attachments = p.media.flatMap((section) => section.attachments);
  const images = attachments.filter((a) => a.type === 1).map((a) => a.link);
  const coverImage = images[0] ?? '';
  const [lng, lat] = p.coordinates ?? [0, 0];
  const { type, subType, isUnitProperty } = resolvePropertyType(p);

  return {
    id: `search-${p.id}`,
    name: p.name,
    type,
    subType,
    isUnitProperty,
    maxOccupancy: p.max_occupancy ?? undefined,
    gender: toGender(p.gender),
    locality: p.locality?.name ?? p.locality_name ?? '',
    city: p.city.name,
    addressLine: p.address_line_1,
    pincode: '',
    lat,
    lng,
    coverImage,
    gallery: images,
    mediaSections: p.media.map((s, i) => ({ id: `${p.id}-${i}`, name: s.section_name, images: s.attachments.map((a) => a.link) })),
    hasVideoTour: false,
    description: p.description ?? '',
    priceFrom: 0,
    securityDeposit: p.security_deposit ?? 0,
    rating: 0,
    reviewCount: 0,
    pgfyScore: 0,
    verified: p.is_verified,
    certificates: [],
    distanceKm: 0,
    amenities: p.amenities,
    houseRules: p.house_rules,
    foodIncluded: false,
    foodMenu: [],
    pricing: [],
    floors: [],
    vacantBeds: p.available_beds,
    occupancyPct: p.total_beds > 0 ? Math.round(((p.total_beds - p.available_beds) / p.total_beds) * 100) : 0,
    tags: [],
    nearby: [],
    reviews: [],
    ratingBreakdown: [],
    noticePeriodDays: p.notice_period_days ?? 0,
    lockInMonths: p.lock_in_period_months ?? 0,
    addedOn: p.created_at,
    bookingConfig: {
      hourlyEnabled: p.hourly_booking_enabled,
      dailyEnabled: p.daily_booking_enabled,
      monthlyEnabled: p.monthly_booking_enabled,
      hourly:
        p.hourly_booking_enabled && p.hourly_window_start != null && p.hourly_window_end != null
          ? { windowStart: minutesToTime(p.hourly_window_start)!, windowEnd: minutesToTime(p.hourly_window_end)! }
          : undefined,
      daily:
        p.daily_booking_enabled && p.daily_check_in_time != null && p.daily_check_out_time != null
          ? { checkInTime: minutesToTime(p.daily_check_in_time)!, checkOutTime: minutesToTime(p.daily_check_out_time)! }
          : undefined,
    },
    hourlyPricing: [],
    dailyPricing: [],
    manager: { name: '', phone: '' },
  };
}

/** Maps the `continue-browsing` (recently viewed) response onto the `Listing` shape. Fields
 * that endpoint doesn't return (address, coordinates, security deposit, roommate/food data)
 * are left empty — the listing-detail screen re-fetches full data by id. */
export function continueBrowsingToListing(p: ContinueBrowsingProperty): Listing {
  const attachments = p.media.flatMap((section) => section.attachments);
  const images = attachments.filter((a) => a.type === 1).map((a) => a.link);
  const coverImage = images[0] ?? '';
  const { type, subType, isUnitProperty } =
    p.property_category === 'FLAT' || p.property_category === 'HOMESTAY'
      ? resolvePropertyType(p)
      : { type: toPropertyType(p.property_type), subType: undefined, isUnitProperty: false };

  return {
    id: `cb-${p.id}`,
    name: p.name,
    type,
    subType,
    isUnitProperty,
    maxOccupancy: p.max_occupancy ?? undefined,
    gender: toGender(p.gender),
    locality: p.locality,
    city: p.city,
    addressLine: '',
    pincode: '',
    lat: 0,
    lng: 0,
    coverImage,
    gallery: images,
    mediaSections: p.media.map((s, i) => ({ id: `${p.id}-${i}`, name: s.section_name, images: s.attachments.map((a) => a.link) })),
    hasVideoTour: false,
    description: '',
    priceFrom: p.starting_rent,
    securityDeposit: 0,
    rating: p.rating ?? 0,
    reviewCount: 0,
    pgfyScore: 0,
    verified: false,
    certificates: [],
    distanceKm: p.distance != null ? Math.round((p.distance / 1000) * 10) / 10 : 0,
    amenities: p.amenities,
    houseRules: [],
    foodIncluded: false,
    foodMenu: [],
    pricing: [],
    floors: [],
    vacantBeds: p.available_beds,
    occupancyPct: 0,
    tags: [],
    nearby: [],
    reviews: [],
    ratingBreakdown: [],
    noticePeriodDays: 0,
    lockInMonths: 0,
    addedOn: '',
    bookingConfig: { hourlyEnabled: false, dailyEnabled: false, monthlyEnabled: true },
    hourlyPricing: [],
    dailyPricing: [],
    manager: { name: '', phone: '' },
  };
}

// ===========================================================================
// Property details (`GET /tenant/properties/:id`)
// ===========================================================================

/** Prefixes other adapters use to mark a `Listing.id` as backed by a real property id. */
const API_ID_PREFIX = /^(api|search|cb)-/;

/** Recovers the numeric property id from any `Listing.id` produced by these adapters, or
 * `null` for a mock listing id (e.g. `l1`) — the caller's cue to use mock data instead. */
export function parseApiPropertyId(id: string): number | null {
  const stripped = id.replace(API_ID_PREFIX, '');
  if (!/^\d+$/.test(stripped)) return null;
  return Number(stripped);
}

const LAYOUT_TO_SHARING: Record<string, SharingType> = {
  SINGLE: 'Single',
  DOUBLE: 'Double',
  DUO: 'Double',
  TRIPLE: 'Triple',
  QUAD: '4-sharing',
  QUADS: '4-sharing',
  FOUR: '4-sharing',
  DORM: 'Dormitory',
  DORMITORY: 'Dormitory',
};

/** Formats a layout code the map above doesn't know about, e.g. `DORM_10` → `Dorm 10`,
 * `QUAD` → `Quad` — title-cased per underscore-separated part, numbers left as-is. */
export function formatLayoutFallback(layout: string): string {
  return layout
    .split('_')
    .filter(Boolean)
    .map((part) => (/^\d+$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
    .join(' ');
}

function layoutToSharing(layout: string): SharingType {
  return LAYOUT_TO_SHARING[layout.toUpperCase()] ?? (formatLayoutFallback(layout) as SharingType);
}

const VERIFICATION_DOC_LABEL: Record<string, string> = {
  trade_license: 'Trade license',
  fire_safety_certificate: 'Fire safety certificate',
  fssai_license: 'FSSAI license',
  property_document: 'Property document',
  tax_document: 'Tax document',
};

function docLabel(key: string): string {
  return VERIFICATION_DOC_LABEL[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function toCertificateStatus(status: VerificationDocStatus): Certificate['status'] {
  if (status === 'VERIFIED') return 'Verified';
  if (status === 'UNDER_VERIFICATION') return 'Pending';
  if (status === 'REJECTED') return 'Expired';
  return 'Missing';
}

const FOOD_SLOTS = [
  { key: 'morning_tea', field: 'morningTea', label: 'Morning tea' },
  { key: 'breakfast', field: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', field: 'lunch', label: 'Lunch' },
  { key: 'evening_tea', field: 'eveningTea', label: 'Evening tea' },
  { key: 'dinner', field: 'dinner', label: 'Dinner' },
] as const;

/** Converts the raw per-day-of-week API schedule into the app's `WeeklyMenuDay` shape. */
export function apiFoodMenuToWeeklyMenu(menu: ApiFoodMenu): WeeklyMenuDay[] {
  return menu.days.map((day) => {
    const out: WeeklyMenuDay = { dayOfWeek: day.day_of_week };
    for (const slot of FOOD_SLOTS) {
      const raw = day[slot.key];
      out[slot.field] = { enabled: !!raw?.is_enabled, items: raw?.menu_items != null ? String(raw.menu_items) : '' };
    }
    return out;
  });
}

function toReview(r: ApiPropertyRating): Review {
  return {
    id: String(r.id),
    author: r.tenant_name,
    avatar: r.tenant_avatar?.link ?? '',
    rating: r.ratings.overall,
    date: r.created_at,
    text: r.review ?? '',
  };
}

export function toTenantRating(r: ApiPropertyRating): TenantRating {
  return {
    id: r.id,
    tenantName: r.tenant_name,
    tenantAvatar: r.tenant_avatar?.link ?? null,
    ratings: { ...r.ratings },
    review: r.review,
    createdAt: r.created_at,
  };
}

/** Maps the full property-details response onto the `Listing` shape. Unlike the search/
 * continue-browsing adapters, this endpoint returns real floors/pricing/food-menu/reviews,
 * so this is the one path that doesn't need mock enrichment downstream. */
export function propertyDetailsToListing(p: ApiPropertyDetails): Listing {
  const attachments = p.media.flatMap((section) => section.attachments);
  const images = attachments.filter((a) => a.type === 1).map((a) => a.link);
  const coverImage = images[0] ?? '';

  // Security deposit / lock-in / notice period now live on each MONTHLY rate card (one per
  // room layout) rather than on the property record — the UI already shows a single
  // "same for all room types" figure, so any MONTHLY tier is a representative source. Fall
  // back to the property-level fields for properties whose pricing hasn't been re-saved since.
  const monthlyTier = p.pricing.find((tier) => tier.booking_mode === 'MONTHLY');

  const pricingVariants: PricingVariant[] = p.pricing.map((tier) => ({
    sharingType: layoutToSharing(tier.layout),
    layout: tier.layout,
    available: tier.available_beds,
    acWithFood: tier.ac_with_food ?? undefined,
    acNoFood: tier.ac_no_food ?? undefined,
    nonAcWithFood: tier.non_ac_with_food ?? undefined,
    nonAcNoFood: tier.non_ac_no_food ?? undefined,
    rent: tier.rent ?? undefined,
  }));

  const pricing = pricingVariants.map((v) => {
    const rates = [v.acWithFood, v.acNoFood, v.nonAcWithFood, v.nonAcNoFood].filter((n): n is number => n != null);
    return {
      sharingType: v.sharingType,
      rent: v.rent ?? (rates.length ? Math.min(...rates) : 0),
      available: v.available,
    };
  });

  // `ApiPropertyDetails` has no `type_id` (only the Hostel-only `property_type` name string),
  // so only defer to `resolvePropertyType`'s category branch for Flat/Homestay.
  const { type, subType, isUnitProperty } =
    p.property_category === 'FLAT' || p.property_category === 'HOMESTAY'
      ? resolvePropertyType(p)
      : { type: toPropertyType(p.property_type), subType: undefined, isUnitProperty: false };

  const vacantBeds = pricingVariants.reduce((sum, v) => sum + v.available, 0);

  // Integer 0-5 trust score: how many verification documents are actually VERIFIED, scaled.
  const verificationDocs = p.verification.documents;
  const verifiedDocCount = verificationDocs.filter((d) => d.status === 'VERIFIED').length;
  const pgfyScore = verificationDocs.length > 0 ? Math.round((verifiedDocCount / verificationDocs.length) * 5) : 0;

  return {
    id: `api-${p.id}`,
    name: p.name,
    type,
    subType,
    isUnitProperty,
    maxOccupancy: p.max_occupancy ?? undefined,
    gender: p.gender === 'MALE' ? 'Male' : p.gender === 'FEMALE' ? 'Female' : 'Co-ed',
    locality: p.locality,
    city: p.city,
    addressLine: '',
    pincode: '',
    lat: 0,
    lng: 0,
    coverImage,
    gallery: images,
    mediaSections: p.media.map((s, i) => ({ id: `${p.id}-${i}`, name: s.section_name, images: s.attachments.map((a) => a.link) })),
    hasVideoTour: false,
    description: p.description ?? '',
    priceFrom: p.starting_rent,
    securityDeposit: monthlyTier?.security_deposit ?? p.security_deposit,
    rating: p.rating?.overall ?? 0,
    reviewCount: p.rating?.count ?? p.reviews.length,
    pgfyScore,
    verified: p.verification.is_verified,
    certificates: p.verification.documents.map((d) => ({ label: docLabel(d.key), status: toCertificateStatus(d.status) })),
    distanceKm: 0,
    amenities: p.amenities,
    houseRules: p.house_rules,
    foodIncluded: p.food_menu_enabled,
    foodMenu: [],
    weeklyFoodMenu: p.food_menu_enabled && p.food_menu ? apiFoodMenuToWeeklyMenu(p.food_menu) : [],
    pricing,
    pricingVariants,
    floors: [],
    vacantBeds,
    occupancyPct: 0,
    tags: [],
    nearby: [],
    reviews: p.reviews.map(toReview),
    // A category nobody has rated yet comes back null — drop it rather than charting it as
    // 0.0, which would read as a terrible score instead of "no data".
    ratingBreakdown: p.rating ? [
      { label: 'Cleanliness', value: p.rating.categories.cleanliness },
      { label: 'Food', value: p.rating.categories.food },
      { label: 'Safety', value: p.rating.categories.safety },
      { label: 'Staff', value: p.rating.categories.staff },
      { label: 'Price', value: p.rating.categories.price },
    ].filter((c): c is { label: string; value: number } => c.value != null) : [],
    noticePeriodDays: monthlyTier?.notice_period_days ?? p.notice_period_days,
    lockInMonths: monthlyTier?.lock_in_period_months ?? p.lock_in_period_months,
    addedOn: '',
    bookingConfig: {
      monthlyEnabled: p.stay_options.monthly?.enabled ?? false,
      dailyEnabled: p.stay_options.daily?.enabled ?? false,
      hourlyEnabled: p.stay_options.hourly?.enabled ?? false,
      daily: p.stay_options.daily?.enabled
        ? { checkInTime: minutesToTime(p.stay_options.daily.check_in_time) ?? '12:00', checkOutTime: minutesToTime(p.stay_options.daily.check_out_time) ?? '11:00' }
        : undefined,
      hourly: p.stay_options.hourly?.enabled
        ? { windowStart: minutesToTime(p.stay_options.hourly.window_start) ?? '06:00', windowEnd: minutesToTime(p.stay_options.hourly.window_end) ?? '22:00' }
        : undefined,
    },
    hourlyPricing: [],
    dailyPricing: [],
    manager: { name: '', phone: '' },
    canRate: p.can_rate,
    myRating: p.my_rating ? toTenantRating(p.my_rating) : null,
    referralDiscount: {
      applicable: p.referral_discount.referred_user_discount.applicable,
      value: p.referral_discount.referred_user_discount.value,
      type: (p.referral_discount.referred_user_discount.type as 'FLAT' | 'PERCENTAGE' | null) ?? null,
    },
    isFavorite: p.is_favorite,
    favoriteId: p.favorite_id,
  };
}

// ===========================================================================
// Room / bed availability (`GET /tenant/properties/:id?layout=&is_ac=&with_food=`)
// ===========================================================================

/** Shared with the room-swap picker (`app/room-swap.tsx`), which renders the same bed-status
 * vocabulary from a differently-shaped API response. */
export const BED_STATUS_MAP: Record<string, Bed['status']> = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  HOLD: 'reserved',
};

/** Maps the real floor/room/bed availability response onto the mock `Floor[]` shape the
 * room-selection screen renders. Fields the API doesn't return (deposit, amenities, photo,
 * aggregate roommate profile) fall back to neutral defaults — `match_score` and the
 * per-occupant `roommate_preferences` are surfaced as-is instead of being recomputed
 * client-side from a (nonexistent for real properties) profile. */
export function apiRoomAvailabilityToFloors(data: ApiRoomBedAvailability, gender: Gender): Floor[] {
  return data.floors.map((floor) => ({
    id: String(floor.id),
    name: floor.name,
    rooms: floor.rooms.map((room): Room => {
      const beds: Bed[] = room.beds.map((bed) => ({
        id: String(bed.id),
        label: bed.bed_number,
        status: BED_STATUS_MAP[bed.status] ?? 'occupied',
        gender,
        rent: room.price,
      }));
      return {
        id: String(room.id),
        number: room.room_number,
        sharingType: layoutToSharing(room.layout),
        capacity: room.sharing_count,
        rent: room.price,
        deposit: 0,
        amenities: room.is_ac ? ['AC'] : [],
        beds,
        occupied: room.filled,
        matchScore: room.match_score,
        roommatePrefs: room.roommate_preferences?.map((p) => ({
          tenantId: p.tenant_id,
          sleepSchedule: p.sleep_schedule,
          dietPreference: p.diet_preference,
          smokingPref: p.smoking_pref,
          alcoholPref: p.alcohol_pref,
        })),
      };
    }),
  }));
}
