/** Wire types for the PGfy API (see auth_api.md). Snake_case mirrors the server. */

export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | (string & {});
export type BankVerificationStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | (string & {});
export type ProfileStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | (string & {});

/** An uploaded file reference as stored on the tenant profile (avatar, KYC docs, occupation docs). */
export interface ProfileAsset {
  link: string;
  type: number;
  metadata?: { size?: number; duration?: number } | null;
  thumbnail?: string | null;
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | (string & {});

export interface PersonalDetails {
  dob?: string | null;
  gender?: Gender | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  emergency_phone?: string | null;
  guardian_relation?: string | null;
  emergency_relation?: string | null;
}

export interface KycDocuments {
  aadhaar_no?: string | null;
  masked_aadhaar?: string | null;
  passport_photo?: ProfileAsset | null;
  aadhaar_address?: string | null;
  enrolment_number?: string | null;
  registered_mobile?: string | null;
}

export type Occupation = 'STUDENT' | 'WORKING_PROFESSIONAL' | (string & {});

export interface OccupationDetails {
  occupation?: Occupation | null;
  /** STUDENT */
  college_id_card?: ProfileAsset | null;
  admission_letter?: ProfileAsset | null;
  enrollment_no?: string | null;
  /** WORKING_PROFESSIONAL */
  employee_id_card?: ProfileAsset | null;
  employment_letter?: ProfileAsset | null;
  company_email?: string | null;
  company_email_verified?: boolean;
}

export interface BankDetails {
  bank_name?: string | null;
  ifsc_code?: string | null;
  account_number?: string | null;
  account_holder_name?: string | null;
}

// ---------------------------------------------------------------------------
// Roommate preferences (`PATCH /profile/tenant-profile/:id`) — optional, consent-gated
// lifestyle prefs that drive the room match score shown during room/bed selection.
// ---------------------------------------------------------------------------

export type SleepScheduleApi = 'EARLY_BIRD' | 'NIGHT_OWL' | (string & {});
export type DietPreferenceApi = 'VEGETARIAN' | 'VEGAN' | 'NON_VEGETARIAN' | (string & {});

export interface RoommatePreferences {
  sleep_schedule: SleepScheduleApi | null;
  diet_preference: DietPreferenceApi | null;
  smoking_pref: boolean | null;
  alcohol_pref: boolean | null;
  about_me: string | null;
  show_preferences_to_roommates: boolean;
}

/** The `user` object returned by `/authenticate` and the `/profile/tenant-profile` service. */
export interface ApiProfile {
  id: number;
  credential_id: number;
  name: string;
  email: string | null;
  phone: string;
  referral_code: string | null;
  avatar: ProfileAsset | null;
  kyc_status: KycStatus;
  bank_verification_status: BankVerificationStatus;
  personal_details: PersonalDetails | null;
  occupation_details: OccupationDetails | null;
  kyc_documents: KycDocuments | null;
  roommate_preferences: RoommatePreferences | null;
  bank_details: BankDetails | null;
  status: ProfileStatus;
  push_notification_enabled: boolean;
  verification_request_on: string | null;
  approved_on: string | null;
  rejected_on: string | null;
  blocked_on: string | null;
  created_at: string;
  updated_at: string;
  role: 'TENANT' | (string & {});
}

export interface AuthResponse {
  access_token: string;
  user: ApiProfile;
  newLogin: boolean;
}

/** Guest sessions authenticate without a phone number and have no tenant profile. */
export interface GuestAuthResponse {
  access_token: string;
  newLogin: boolean;
}

/** Feathers paginates list endpoints; some deployments return a bare array instead. */
export interface Paginated<T> {
  total: number;
  limit: number;
  skip: number;
  data: T[];
}

export type ListResponse<T> = Paginated<T> | T[];

/** Feathers may paginate (`{ data: [...] }`) or return a bare array; accept both. */
export function unwrapList<T>(response: ListResponse<T> | null | undefined): T[] {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  return [];
}

// ===========================================================================
// Master data
// ===========================================================================

export type MasterStatus = 'ACTIVE' | 'INACTIVE' | (string & {});
export type MasterChargeType = 'FLAT' | 'PERCENT' | (string & {});

/** Uploaded asset reference attached to master rows (locality banners, category icons). */
export interface MasterMediaAsset {
  key: string;
  link: string;
  type: number;
  metadata?: { size?: number } | null;
  thumbnail?: string | null;
}

export interface StateMaster {
  id: number;
  name: string;
  code: string;
  city_count: number;
  property_count: number;
  priority: number;
  status: MasterStatus;
  created_at: string;
  updated_at: string;
}

export interface CityMaster {
  id: number;
  state_id: number;
  code: string;
  name: string;
  property_count: number;
  priority: number;
  status: MasterStatus;
  created_at: string;
  updated_at: string;
}

export interface LocalityMaster {
  id: number;
  city_id: number;
  name: string;
  avatar?: MasterMediaAsset | null;
  property_count: number;
  priority: number;
  status: MasterStatus;
  created_at: string;
  updated_at: string;
}

export interface AmenityMaster {
  id: number;
  name: string;
  /** Optional grouping label (e.g. "Safety", "Connectivity"); null when ungrouped. */
  group: string | null;
  avatar?: MasterMediaAsset | null;
  priority: number;
  status: MasterStatus;
  created_at: string;
  updated_at: string;
}

export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | (string & {});

export interface MaintenanceCategoryMaster {
  id: number;
  name: string;
  avatar?: MasterMediaAsset | null;
  default_sla_hours: number;
  default_priority: MaintenancePriority;
  priority: number;
  status: MasterStatus;
  created_at: string;
  updated_at: string;
}

/** Which app panel a support category belongs to. */
export type SupportPanel = 'TENANT' | 'MANAGER' | 'OWNER' | (string & {});

export interface PlatformSupportCategoryMaster {
  id: number;
  name: string;
  panel: SupportPanel;
  priority: number;
  status: MasterStatus;
  created_at: string;
  updated_at: string;
}

/** A curated home-page destination city, eager-loaded with its city/state rows. */
export interface PopularDestinationMaster {
  id: number;
  city_id: number;
  state_id: number;
  avatar?: MasterMediaAsset | null;
  priority: number;
  status: MasterStatus;
  created_at: string;
  updated_at: string;
  city: CityMaster;
  state: StateMaster;
}

/** Platform-wide business config (commission, payouts, reminders, cancellation charges). */
export interface MasterConfig {
  id: number;
  platform_commission_value: number;
  platform_commission_type: MasterChargeType;
  auto_payout_schedule: string;
  late_fee_per_day: number;
  referrer_reward_value: number;
  referrer_reward_type: MasterChargeType;
  referred_user_reward_value: number;
  referred_user_reward_type: MasterChargeType;
  max_referrals_per_tenant: number;
  rent_reminder_days_before: number;
  lease_expiry_reminder_days_before: number;
  admin_session_timeout_minutes: number;
  monthly_booking_cancellation_charge_value: number;
  monthly_booking_cancellation_charge_type: MasterChargeType;
  daily_booking_cancellation_charge_value: number;
  daily_booking_cancellation_charge_type: MasterChargeType;
  hourly_booking_cancellation_charge_value: number;
  hourly_booking_cancellation_charge_type: MasterChargeType;
  status: MasterStatus;
  created_at: string;
  updated_at: string;
}

// ===========================================================================
// Property search (auth_api.md — Search property API)
// ===========================================================================

export type PropertyGender = 'MALE' | 'FEMALE' | 'UNISEX' | (string & {});

/** Top-level property taxonomy. Hostel keeps `type_id`/`property_type` (PG/Hostel/Co-living);
 *  Flat uses `property_sub_category` (BHK_1..5); Homestay has no subcategory. */
export type PropertyCategory = 'HOSTEL' | 'FLAT' | 'HOMESTAY' | (string & {});
/** Flat-only subcategory. */
export type PropertySubCategory = 'BHK_1' | 'BHK_2' | 'BHK_3' | 'BHK_4' | 'BHK_5' | (string & {});
/** Flat/Homestay only. */
export type Furnishing = 'UNFURNISHED' | 'SEMI_FURNISHED' | 'FULLY_FURNISHED' | (string & {});
/** Flat/Homestay only — replaces `gender` for these categories. */
export type AllowedTenantType = 'FAMILY_ONLY' | 'BACHELOR_ONLY' | 'MALE' | 'FEMALE' | 'FAMILY_AND_BACHELOR' | (string & {});

/** A single uploaded file reference. `type` is the attachment kind (1 = image). */
export interface MediaAttachment {
  link: string;
  type: number;
}

/** A named gallery section on a property (e.g. "Rooms", "Washroom"). */
export interface PropertyMediaSection {
  section_name: string;
  attachments: MediaAttachment[];
}

export type PropertyGstMode = 'AUTO' | 'MANUAL' | (string & {});

/**
 * Shallow property shape as returned by `GET /property-management/property` (search).
 * The doc doesn't cover a richer detail endpoint (floors/rooms/beds/pricing/reviews),
 * so those stay out of this type — see `src/lib/listingAdapter.ts`.
 */
export interface ApiProperty {
  id: number;
  code: string;
  type_id: number | null;
  /** Defaults to `HOSTEL` server-side (pre-existing properties). */
  property_category?: PropertyCategory;
  /** Flat only. */
  property_sub_category?: PropertySubCategory | null;
  /** Flat/Homestay only. */
  furnishing?: Furnishing | null;
  /** Flat/Homestay only — replaces `gender` for these categories. */
  allowed_tenant_type?: AllowedTenantType | null;
  /** Flat/Homestay only — max occupants per booking. */
  max_occupancy?: number | null;
  name: string;
  description: string | null;
  address_line_1: string;
  landmark: string | null;
  city_id: number;
  locality_id: number;
  /** [longitude, latitude]. */
  coordinates: [number, number] | null;
  /** Hostel only — null on Flat/Homestay properties (see `allowed_tenant_type`). */
  gender: PropertyGender | null;
  media: PropertyMediaSection[];
  amenities: string[];
  house_rules: string[];
  owner_id: number;
  status: string;
  is_verified: boolean;
  verification_expiry: string | null;
  show_in_marketplace: boolean;
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
  rating_count?: number;
  avg_cleanliness_rating?: number | null;
  avg_food_rating?: number | null;
  avg_safety_rating?: number | null;
  avg_staff_rating?: number | null;
  avg_price_rating?: number | null;
  avg_overall_rating?: number | null;
  created_at: string;
  updated_at: string;
}

// ===========================================================================
// Property details (`GET /tenant/properties/:id`)
// ===========================================================================

export type ApiBookingMode = 'MONTHLY' | 'DAILY' | 'HOURLY';

/** One room layout's pricing, scoped to the `booking_mode` requested. Hostel: the 4 AC/food
 *  rates. Flat/Homestay: a single `rent` (layout is always `SINGLE`, AC/food don't apply). */
export interface ApiPropertyPricingTier {
  id: number;
  booking_mode: ApiBookingMode;
  /** Room layout code, e.g. `SINGLE`, `DUO`, `TRIPLE`. */
  layout: string;
  ac_with_food?: number | null;
  ac_no_food?: number | null;
  non_ac_with_food?: number | null;
  non_ac_no_food?: number | null;
  /** Flat/Homestay only. */
  rent?: number | null;
  available_beds: number;
  /** MONTHLY only — null on DAILY/HOURLY tiers. Owner-side config now lives per rate card
   * (one per room layout) rather than on the property record. */
  security_deposit?: number | null;
  lock_in_period_months?: number | null;
  notice_period_days?: number | null;
}

export interface ApiFoodMenuSlot {
  is_enabled: boolean;
  menu_items: string;
  prep_by_time: number;
  serving_start_time: number;
  serving_end_time: number;
}

export interface ApiFoodMenuDay {
  /** 0 = Sunday .. 6 = Saturday. */
  day_of_week: number;
  morning_tea: ApiFoodMenuSlot;
  breakfast: ApiFoodMenuSlot;
  lunch: ApiFoodMenuSlot;
  evening_tea: ApiFoodMenuSlot;
  dinner: ApiFoodMenuSlot;
}

export interface ApiFoodMenu {
  today_day_of_week: number;
  /** Not every day of the week is guaranteed an entry — a missing day has no meals configured. */
  days: ApiFoodMenuDay[];
}

export type VerificationDocStatus = 'VERIFIED' | 'UNDER_VERIFICATION' | 'REJECTED' | 'NOT_SUBMITTED' | (string & {});

export interface ApiVerificationDocument {
  key: string;
  status: VerificationDocStatus;
}

export interface ApiPropertyVerification {
  is_verified: boolean;
  documents: ApiVerificationDocument[];
}

// ---------------------------------------------------------------------------
// Property ratings (GET/POST/PATCH/DELETE /tenant/ratings) — a tenant's rating of a
// property they've booked. The same shape appears in a property's `reviews`/`my_rating`
// (GET /tenant/properties/:id) and standalone in the ratings CRUD responses.
// ---------------------------------------------------------------------------

export interface ApiRatingCategoryScores {
  cleanliness: number;
  food: number;
  safety: number;
  staff: number;
  price: number;
  overall: number;
}

export type PropertyRatingStatus = 'ACTIVE' | (string & {});

export interface ApiPropertyRating {
  id: number;
  property_id: number;
  booking_id: number;
  tenant_id: number;
  tenant_name: string;
  tenant_avatar: ProfileAsset | null;
  ratings: ApiRatingCategoryScores;
  review: string | null;
  status: PropertyRatingStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateRatingInput {
  property_id: number;
  cleanliness_rating: number;
  food_rating: number;
  safety_rating: number;
  staff_rating: number;
  price_rating: number;
  review?: string;
}

export interface UpdateRatingInput {
  cleanliness_rating: number;
  food_rating: number;
  safety_rating: number;
  staff_rating: number;
  price_rating: number;
  review?: string;
}

/** A property's aggregate rating (`GET /tenant/properties/:id`'s `rating` field). */
/** Aggregate rating across all tenants. Every score is nullable: a category nobody has rated
 * yet comes back `null` (not 0), and `overall` is null until there's at least one rating. */
export interface ApiPropertyRatingSummary {
  overall: number | null;
  count: number;
  categories: {
    cleanliness: number | null;
    food: number | null;
    safety: number | null;
    staff: number | null;
    price: number | null;
  };
}

// ---------------------------------------------------------------------------
// Referral discount (surfaced on GET /tenant/properties/:id — applies at booking checkout)
// ---------------------------------------------------------------------------

export type DiscountTypeEnum = 'FLAT' | 'PERCENTAGE' | (string & {});

export interface ApiDiscountDetail {
  applicable: boolean;
  referral_id: number | null;
  value: number | null;
  type: DiscountTypeEnum | null;
}

/** `referred_user_discount` applies to *this* tenant's own (first) booking at this property;
 * `referrer_reward` describes what the tenant who referred them earns on their own next
 * checkout — not something this booking's checkout ever applies itself. */
export interface ApiReferralDiscountInfo {
  applicable: boolean;
  referred_user_discount: ApiDiscountDetail;
  referrer_reward: ApiDiscountDetail;
}

/** `GET /tenant/properties/:id?booking_mode=&record_view=` — full property details. */
export interface ApiPropertyDetails {
  id: number;
  name: string;
  code: string;
  description: string | null;
  /** Hostel only — null on Flat/Homestay properties (see `allowed_tenant_type`). */
  gender: PropertyGender | null;
  property_type: string;
  /** Defaults to `HOSTEL` server-side (pre-existing properties). */
  property_category?: PropertyCategory;
  /** Flat only. */
  property_sub_category?: PropertySubCategory | null;
  /** Flat/Homestay only. */
  furnishing?: Furnishing | null;
  /** Flat/Homestay only — replaces `gender` for these categories. */
  allowed_tenant_type?: AllowedTenantType | null;
  /** Flat/Homestay only — max occupants per booking (drives the guest-details step). */
  max_occupancy?: number | null;
  locality: string;
  city: string;
  media: PropertyMediaSection[];
  amenities: string[];
  house_rules: string[];
  is_favorite: boolean;
  favorite_id: number | null;
  security_deposit: number;
  lock_in_period_months: number;
  notice_period_days: number;
  stay_options: {
    monthly?: { enabled: boolean };
    daily?: { enabled: boolean; check_in_time?: number; check_out_time?: number };
    hourly?: { enabled: boolean; window_start?: number; window_end?: number };
  };
  starting_rent: number;
  starting_rent_type: ApiBookingMode;
  pricing: ApiPropertyPricingTier[];
  food_menu_enabled: boolean;
  food_menu: ApiFoodMenu | null;
  verification: ApiPropertyVerification;
  rating: ApiPropertyRatingSummary | null;
  reviews: ApiPropertyRating[];
  can_rate: boolean;
  /** The signed-in tenant's own rating of this property, or `null` if they haven't rated it. */
  my_rating: ApiPropertyRating | null;
  referral_discount: ApiReferralDiscountInfo;
}

// ===========================================================================
// Room / bed availability (same endpoint, scoped by layout/is_ac/with_food)
// ===========================================================================

export type ApiBedStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'HOLD' | (string & {});

export interface ApiRoomBed {
  id: number;
  bed_number: string;
  status: ApiBedStatus;
}

/** One current occupant's lifestyle prefs, as surfaced on a room in the availability
 * response — a room can have more than one occupant, so this is a per-tenant entry, not an
 * aggregate. Only occupants who've filled in prefs (and consented to share them) appear. */
export interface ApiRoomRoommatePreference {
  tenant_id: number;
  sleep_schedule: SleepScheduleApi | null;
  diet_preference: DietPreferenceApi | null;
  smoking_pref: boolean | null;
  alcohol_pref: boolean | null;
}

export interface ApiPropertyRoom {
  id: number;
  room_number: string;
  layout: string;
  is_ac: boolean;
  sharing_count: number;
  filled: number;
  available: number;
  price: number;
  /** 0–100 roommate compatibility score, computed server-side against the tenant's own
   * saved `roommate_preferences` — 0 (or absent signal) when the tenant hasn't set any. */
  match_score: number;
  roommate_preferences: ApiRoomRoommatePreference[] | null;
  beds: ApiRoomBed[];
}

export interface ApiPropertyFloor {
  id: number;
  name: string;
  rooms: ApiPropertyRoom[];
}

export interface ApiSelectedOccupancy {
  layout: string;
  is_ac: boolean;
  with_food: boolean;
  booking_mode: ApiBookingMode;
  /** MONTHLY only — absent/null on DAILY/HOURLY selections. */
  security_deposit?: number | null;
  lock_in_period_months?: number | null;
  notice_period_days?: number | null;
}

/** `GET /tenant/properties/:id?is_ac=&booking_mode=&layout=&with_food=` — room/bed availability. */
export interface ApiRoomBedAvailability {
  id: number;
  name: string;
  selected_occupancy: ApiSelectedOccupancy;
  floors: ApiPropertyFloor[];
}

// ===========================================================================
// Favorite / saved properties
// ===========================================================================

export type FavoriteStatus = 'ACTIVE' | 'DELETED' | (string & {});

export interface TenantFavoriteProperty {
  id: number;
  tenant_id: number;
  property_id: number;
  status: FavoriteStatus;
  created_at: string;
  updated_at: string;
}

/** `GET /tenant-management/tenant-favorite-property?$eager[]=property` list item — the
 * favorite record eager-loaded with the full property row. */
export interface ApiFavoritePropertyItem extends TenantFavoriteProperty {
  property: ApiProperty;
}

// ===========================================================================
// Bookings (booking_api.md — `/tenant/booking`, `/tenant/cancel-booking`)
// ===========================================================================

/** Full enum isn't documented — treat as an open string set and format defensively. */
export type BookingStatusApi =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'COMPLETED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | (string & {});

export type PaymentMethod = 'UPI' | 'CARD' | 'NETBANKING' | 'CASH' | 'BANK_TRANSFER';
export type PaymentFrequency = 'PAY_ONCE' | 'AUTOPAY';

/** One named occupant on a Flat/Homestay booking (`Booking.guests`, Flat/Homestay only). */
export interface BookingGuestItem {
  name: string;
  gender: PropertyGender;
  age: number;
}

export interface ApiBookingProperty {
  id: number;
  name: string;
  media: PropertyMediaSection[];
  locality: string;
  city: string;
  property_type: string;
  /** `FLAT`/`HOMESTAY` book the whole unit — no room/bed/floor tier applies. */
  property_category?: PropertyCategory | null;
}

/** Shared shape of `GET /tenant/booking` list items and the base of `GET /tenant/booking/:id`. */
export interface ApiBooking {
  id: number;
  code: string;
  status: BookingStatusApi;
  booking_mode: ApiBookingMode;
  property: ApiBookingProperty;
  room_number: string;
  bed_number: string;
  room_layout: string;
  /** Flat/Homestay only — the named occupants for a whole-property booking. */
  guests?: BookingGuestItem[] | null;
  guest_count?: number | null;
  check_in_date: string;
  check_out_date: string | null;
  actual_check_in: string | null;
  actual_check_out: string | null;
  hourly_start_slot: number | null;
  hourly_end_slot: number | null;
  /** Full recurring monthly rent (MONTHLY bookings) — unchanged by first-month proration. */
  base_rent: number;
  /** Actually-charged move-in rent — equals `base_rent` unless the check-in day (8+) prorated
   * it down to the days remaining in that calendar month. DAILY/HOURLY: same as `base_rent`. */
  move_in_rent?: number;
  /** Calendar days in the check-in month (MONTHLY only) — null otherwise. */
  days_in_month?: number | null;
  /** Days actually charged on the move-in invoice — equals `days_in_month` when not
   * prorated, so `prorated_days < days_in_month` is the "was this booking prorated?" check. */
  prorated_days?: number | null;
  security_deposit: number;
  total_paid: number | null;
  next_rent_due: string | null;
  check_in_otp: string | null;
  check_in_qr: ProfileAsset | null;
  has_check_in_pass: boolean;
  /** Post move-out-approval check-out pass — same shape as the check-in pass. */
  check_out_otp?: string | null;
  check_out_qr?: ProfileAsset | null;
  /** Undocumented shape — always `null` in observed responses. */
  lease: Record<string, unknown> | null;
  /** Extend-stay history for this booking, most recent first — empty when never extended. */
  extensions?: ApiStayExtension[];
}

/** `GET /tenant/booking/:id` — the list item shape plus the full check-in pass. Carries the
 * original payment transaction (same shape `POST /tenant/booking` returns) while the booking
 * is still `PENDING_PAYMENT`, so a stalled/abandoned payment can be resumed. */
export interface ApiBookingDetail extends ApiBooking {
  check_in_pass: Record<string, unknown> | null;
  transaction?: ApiBookingTransaction | null;
  /** Hosted booking receipt (PDF/web page) for a paid booking — opened in an external
   * browser rather than rendered in-app. Absent until the payment has settled. */
  receipt_url?: string | null;
}

/** `GET /tenant/booking-invoice?booking_id=` — the booking's move-in invoice PDF. */
export interface ApiBookingInvoiceLink {
  booking_id: number;
  invoice_id: number;
  invoice_number: string;
  invoice_type: string;
  /** Same URL as `pdf_attachment.link` — a direct, external-browser-openable S3 link. */
  invoice_link: string;
  pdf_attachment: ProfileAsset;
}

/** Hostel: room/bed/layout are required. Flat/Homestay: omit them and send `guests`/`guest_count`
 *  instead — the whole (single default) unit is booked. */
export interface CreateBookingInput {
  property_id: number;
  /** Hostel only. */
  room_id?: number;
  bed_id?: number;
  floor_id?: number;
  booking_mode: ApiBookingMode;
  is_ac?: boolean;
  has_food?: boolean;
  /** Hostel only. */
  room_layout?: string;
  /** Flat/Homestay only — named occupants (min 1, max the property's `max_occupancy`). */
  guests?: BookingGuestItem[];
  guest_count?: number;
  /** Hourly: date only (`YYYY-MM-DD`), no time component — the start time is
   * `hourly_start_slot` instead. Daily/Monthly: full ISO datetime. */
  check_in_date: string;
  /** Daily bookings only — the response already echoes this back per `ApiBookingCreateResponse`. */
  check_out_date?: string | null;
  /** Hourly bookings only — the response already echoes this back per `ApiBookingCreateResponse`. */
  duration_hours?: number | null;
  /** Hourly bookings only — minutes since midnight (e.g. 840 = 14:00), local to the property. */
  hourly_start_slot?: number | null;
  payment_method: PaymentMethod;
  payment_frequency: PaymentFrequency;
  coupon_code?: string | null;
}

export interface ApiBookingInvoice {
  id: number;
  invoice_number: string;
  booking_id: number;
  tenant_id: number;
  property_id: number;
  room_id: number;
  type: string;
  billing_month: string;
  due_date: string;
  rent_amount: number;
  penalty_amount: number;
  other_charges: number;
  amount: number;
  paid: number;
  status: string;
  line_items: Record<string, number | null>;
  payment_history: unknown | null;
  offline_otp_code: string | null;
  offline_otp_expires_at: string | null;
  paid_on: string | null;
  pdf_attachment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiBookingBill {
  base_rent: number;
  security_deposit: number;
  registration_fee: number;
  platform_commission: number;
  gst_rate: number;
  gst_amount: number;
  coupon_id: number | null;
  coupon_discount: number;
  custom_discount_name: string | null;
  custom_discount_amount: number;
  total_payable: number;
  lock_in_period_months: number;
  notice_period_days: number;
  room_layout: string;
  is_ac: boolean;
  has_food: boolean;
  quantity: number;
  unit_rate: number;
}

export interface ApiBookingTransaction {
  id: number;
  transaction_code: string;
  gateway_transaction_id: string | null;
  key: string | null;
  customer_id: string | null;
  payment_link: string | null;
  price: number;
  total_amount: number;
}

export interface ApiBookingPaymentHint {
  payment_method: PaymentMethod;
  payment_frequency: PaymentFrequency;
  note: string;
}

/** `POST /tenant/booking` response — the created booking plus its invoice/bill/transaction. */
export interface ApiBookingCreateResponse {
  id: number;
  code: string;
  tenant_id: number;
  property_id: number;
  floor_id: number | null;
  room_id: number;
  bed_id: number;
  booking_mode: ApiBookingMode;
  is_ac: boolean;
  room_layout: string;
  has_food: boolean;
  check_in_date: string;
  check_out_date: string | null;
  duration_hours: number | null;
  actual_check_in: string | null;
  actual_check_out: string | null;
  hourly_start_slot: number | null;
  hourly_end_slot: number | null;
  check_in_otp: string | null;
  check_in_otp_expires_at: string | null;
  check_in_qr: string | null;
  is_instant: boolean;
  lock_in_period_months: number;
  notice_period_days: number;
  base_rent: number;
  security_deposit: number;
  registration_fee: number;
  platform_commission: number;
  gst_rate: number;
  gst_amount: number;
  coupon_id: number | null;
  coupon_discount: number;
  custom_discount_name: string | null;
  custom_discount_amount: number;
  total_payable: number;
  payment_method: PaymentMethod;
  payment_frequency: PaymentFrequency;
  is_paid: boolean;
  paid_on: string | null;
  transaction_id: number | null;
  transaction_code: string | null;
  payment_link: string | null;
  status: BookingStatusApi;
  hold_expires_at: string | null;
  requested_on: string;
  approved_on: string | null;
  rejected_on: string | null;
  rejection_reason: string | null;
  cancelled_on: string | null;
  cancellation_reason: string | null;
  cancellation_note: string | null;
  created_at: string;
  updated_at: string;
  invoice: ApiBookingInvoice | null;
  bill: ApiBookingBill | null;
  transaction: ApiBookingTransaction | null;
  payment_hint: ApiBookingPaymentHint | null;
}

export interface CancelBookingInput {
  booking_id: number;
  cancellation_reason: string;
  /** Dry-run: return the refund breakdown without actually cancelling. */
  preview?: boolean;
}

/** `POST /tenant/cancel-booking` with `preview: true` — returns the same
 * amount-paid / charge / refund breakdown **without** cancelling anything, so the
 * confirmation sheet can show the authoritative charge (derived from master config
 * server-side) before the tenant commits. */
export interface ApiBookingCancelPreview {
  refund: ApiBookingRefund;
  payment_action: string;
  message: string;
}

export interface ApiBookingRefund {
  amount_paid: number;
  cancellation_charge: number;
  cancellation_charge_type: string | null;
  cancellation_charge_value: number | null;
  cancellation_charge_label: string;
  refund_to_tenant: number;
  booking_mode: ApiBookingMode;
  is_paid: boolean;
  will_refund_via_gateway: boolean;
}

/** `POST /tenant/cancel-booking` response. */
export interface ApiBookingCancelResponse extends Omit<ApiBookingCreateResponse, 'invoice' | 'bill' | 'transaction' | 'payment_hint'> {
  refund: ApiBookingRefund;
  payment_action: string;
  message: string;
}

// ===========================================================================
// Billing / rent invoices (`GET /tenant/billing-rent`)
// ===========================================================================

export type InvoiceStatusApi = 'PAID' | 'UNPAID' | 'PARTIAL' | (string & {});
/** Only `MOVE_IN` is documented so far — kept open for future invoice types (e.g. rent). */
export type InvoiceTypeApi = 'MOVE_IN' | (string & {});

export interface ApiInvoiceProperty {
  id: number;
  name: string;
  code: string;
}

export interface ApiInvoiceRoom {
  id: number;
  room_number: string;
}

export interface ApiInvoiceBooking {
  id: number;
  code: string;
  booking_mode: ApiBookingMode;
}

export interface ApiInvoiceTenant {
  id: number;
  name: string;
  phone: string;
  avatar: ProfileAsset | null;
}

export interface ApiInvoice {
  id: number;
  invoice_number: string;
  type: InvoiceTypeApi;
  /** `YYYY-MM`, or `null` for move-in invoices. */
  billing_month: string | null;
  due_date: string;
  amount: number;
  paid: number;
  outstanding: number;
  status: InvoiceStatusApi;
  paid_on: string | null;
  payment_history: unknown | null;
  pdf_attachment: ProfileAsset | null;
  booking_mode: ApiBookingMode;
  tenant: ApiInvoiceTenant;
  property: ApiInvoiceProperty;
  room: ApiInvoiceRoom;
  booking: ApiInvoiceBooking;
}

export interface ApiBillingSummary {
  billed: number;
  collected: number;
  due: number;
  /** 0-100. */
  collection_rate: number;
  counts: { paid: number; partial: number; unpaid: number; total: number };
}

/** `GET /tenant/billing-rent` — paginated invoice list plus a summary scoped to the same
 * `due_date` range/filters. */
export interface ApiBillingRentResponse {
  summary: ApiBillingSummary;
  total: number;
  limit: number;
  skip: number;
  data: ApiInvoice[];
}

// ===========================================================================
// Pay rent (`POST /tenant/pay-rent`)
// ===========================================================================

export interface PayRentInput {
  /** The invoice's numeric id, as a string (matches the documented request body). */
  invoice_id: string;
  payment_method: PaymentMethod;
  payment_frequency: PaymentFrequency;
}

/** The invoice as returned inside a pay-rent response — a slightly different projection
 * than the billing-rent list/detail shape (adds `rent_amount`/`penalty_amount`/`line_items`,
 * omits the eager `tenant`/`property`/`room`/`booking` objects). */
export interface ApiPayRentInvoice {
  id: number;
  invoice_number: string;
  booking_id: number;
  tenant_id: number;
  property_id: number;
  room_id: number;
  type: InvoiceTypeApi;
  billing_month: string | null;
  due_date: string;
  rent_amount: number;
  penalty_amount: number;
  paid_penalty: number;
  other_charges: number;
  amount: number;
  paid: number;
  status: InvoiceStatusApi;
  line_items: Record<string, number | null>;
  payment_history: unknown | null;
  offline_otp_code: string | null;
  offline_otp_expires_at: string | null;
  paid_on: string | null;
  pdf_attachment: ProfileAsset | null;
  created_at: string;
  updated_at: string;
}

export interface ApiPayRentMandate {
  id: number;
  booking_id: number;
  tenant_id: number;
  gateway_type: string;
  is_auto_pay: boolean;
  razorpay_customer_id: string | null;
  razorpay_token_id: string | null;
  payu_registration_txn_id: string | null;
  payu_si_id: string | null;
  mandate_max_amount: number;
  status: string;
  amount_per_cycle: number;
  starts_from: string;
  next_debit_on: string | null;
  last_charged_on: string | null;
  last_payment_id: number | null;
  created_at: string;
  updated_at: string;
}

/** A tiny (₹1) Razorpay authorization charge that sets up the recurring UPI Autopay mandate
 * — separate from, and completed after, the invoice's own payment transaction. */
export interface ApiPayRentRazorpayAuth {
  key: string;
  order_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  transaction_code: string;
  name: string;
  contact: string;
}

export interface ApiPayRentAutopay {
  mandate: ApiPayRentMandate;
  booking: unknown | null;
  transaction: ApiBookingTransaction | null;
  razorpay: ApiPayRentRazorpayAuth | null;
}

/** `POST /tenant/pay-rent` response. `transaction` is the gateway order for the invoice
 * payment itself (null for CASH); `autopay` is only present when `payment_frequency` is
 * `AUTOPAY` and carries the separate mandate-authorization order. */
export interface ApiPayRentResponse {
  invoice: ApiPayRentInvoice;
  amount_due: number;
  penalty_due: number;
  rent_due: number;
  payment_method: PaymentMethod;
  payment_frequency: PaymentFrequency;
  transaction: ApiBookingTransaction | null;
  autopay: ApiPayRentAutopay | null;
  payment_hint: ApiBookingPaymentHint;
}

// ===========================================================================
// Coupons (`GET /billing/coupon`)
// ===========================================================================

export type CouponDiscountType = 'PERCENTAGE' | 'FLAT';
export type CouponStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | (string & {});

export interface ApiCoupon {
  id: number;
  owner_id: number;
  code: string;
  description: string;
  discount_type: CouponDiscountType;
  discount_amount: number;
  max_discount: number | null;
  target_all_properties: boolean;
  valid_from: string;
  expiry_date: string;
  max_uses: number | null;
  used_count: number;
  max_uses_per_user: number | null;
  status: CouponStatus;
  created_at: string;
  updated_at: string;
}

// ===========================================================================
// My Stay (`GET /tenant/beds`, `GET /tenant/my-stay`)
// ===========================================================================

export interface ApiStayProperty {
  id: number;
  name: string;
  media: PropertyMediaSection[];
  locality: string;
  city: string;
  code: string;
  property_type: string;
  /** `FLAT`/`HOMESTAY` book the whole unit — no room/bed/floor tier applies. */
  property_category?: PropertyCategory | null;
  /** [longitude, latitude] — drives the "View directions" map link. */
  coordinates?: [number, number] | null;
}

export interface ApiStayBookingSummary {
  id: number;
  code: string;
  status: BookingStatusApi;
  booking_mode: ApiBookingMode;
  check_in_date: string;
}

export interface ApiStayFloor {
  id: number;
  name: string;
}

export interface ApiStayRoom {
  id: number;
  room_number: string;
  layout: string;
  sharing_count: number;
}

export interface ApiStayBed {
  id: number;
  bed_number: string;
  status: string;
}

export interface ApiStayBilling {
  base_rent: number;
  security_deposit: number;
  next_rent_due: string | null;
}

/** `GET /tenant/beds` list item — one row per active bed/stay the tenant currently holds. */
export interface ApiBedStay {
  booking: ApiStayBookingSummary;
  property: ApiStayProperty;
  floor: ApiStayFloor;
  room: ApiStayRoom;
  bed: ApiStayBed;
  billing: ApiStayBilling;
  has_check_in_pass: boolean;
}

export interface ApiMyStayOwner {
  name: string;
  avatar: ProfileAsset | null;
  phone: string;
  email: string;
  type: string;
  role: string;
}

export interface ApiMyStayProperty extends ApiStayProperty {
  owner: ApiMyStayOwner;
}

export interface ApiMyStayRoom {
  id: number;
  room_number: string;
}

export interface ApiMyStayBooking {
  id: number;
  code: string;
  status: BookingStatusApi;
  booking_mode: ApiBookingMode;
  check_in_date: string;
  /** Daily/Monthly bookings — the current (possibly extended) move-out date. */
  check_out_date: string | null;
  /** Hourly bookings only — the current (possibly extended) end-of-slot/duration. */
  hourly_end_slot: number | null;
  duration_hours: number | null;
  check_in_otp: string | null;
  /** A real, pre-rendered QR image when the backend has generated one — prefer this over
   * building one client-side (see `buildCheckInPassPayload`) whenever it's present. */
  check_in_qr: ProfileAsset | null;
  /** Present once the tenant's move-out has been approved and they're cleared to check
   * out — the pass should switch from the check-in/PG pass to a check-out pass. */
  check_out_otp?: string | null;
  check_out_qr?: ProfileAsset | null;
  /** Extend-stay history for this booking, most recent first — empty when never extended. */
  extensions: ApiStayExtension[];
  property: ApiMyStayProperty;
  floor: ApiStayFloor;
  room: ApiMyStayRoom;
  bed: ApiStayBed;
}

/** Note: unlike `ApiInvoice.pdf_attachment` (an asset object), this endpoint's invoice
 * summaries give the PDF as a bare URL string. */
export interface ApiMyStayInvoice {
  id: number;
  invoice_number: string;
  type: InvoiceTypeApi;
  amount: number;
  paid: number;
  status: InvoiceStatusApi;
  due_date: string;
  paid_on: string | null;
  billing_month: string | null;
  pdf_attachment: string | null;
}

export interface ApiMyStayBilling {
  next_due_amount: number;
  next_due_date: string | null;
  due_invoice_id: number | null;
  outstanding_balance: number;
  invoices: ApiMyStayInvoice[];
}

export type AnnouncementGuestType = 'HOURLY' | 'DAILY' | 'MONTHLY' | (string & {});
export type AnnouncementStatus = 'SENT' | (string & {});

export interface ApiAnnouncement {
  id: number;
  owner_id: number;
  created_by_id: number;
  created_by_name: string;
  created_by_email: string | null;
  created_by_phone: string | null;
  created_by_avatar: ProfileAsset | null;
  target_all_properties: boolean;
  guest_types: AnnouncementGuestType[];
  title: string;
  description: string;
  recipient_count: number;
  status: AnnouncementStatus;
  created_at: string;
  updated_at: string;
}

/** `GET /tenant/my-stay?bed_id=` — full stay detail for one bed. `bed_changes` is this
 * booking's room/bed-change history — same shape `/tenant/change-bed` returns (see
 * `ApiChangeBedRequest`); a `SCHEDULED` entry is an upcoming, owner-approved move the
 * tenant hasn't been switched into yet. */
export interface ApiMyStayResponse {
  booking: ApiMyStayBooking;
  billing: ApiMyStayBilling;
  announcements: ApiAnnouncement[];
  maintenance: ApiMaintenanceTicket[];
  bed_changes: ApiChangeBedRequest[];
}

// ---------------------------------------------------------------------------
// Maintenance (`GET/POST /maintenance-management/maintenance`)
// ---------------------------------------------------------------------------

export type MaintenanceStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'DISMISSED'
  | 'CANCELLED'
  | (string & {});

/** One maintenance ticket — list rows and the `:id` detail response share this shape. */
export interface ApiMaintenanceTicket {
  id: number;
  tenant_id: number;
  tenant_name: string;
  property_name: string;
  floor_name: string;
  room_number: string;
  bed_number: string;
  tenant_avatar: ProfileAsset | null;
  property_id: number;
  floor_id: number;
  room_id: number;
  bed_id: number;
  category_id: number;
  category_name: string;
  /** Assigned once the property team picks it up — `null` immediately after creation. */
  code: string | null;
  description: string;
  images: string[];
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  sla_deadline: string;
  assigned_staff_id: number | null;
  assigned_staff_name: string | null;
  assigned_on: string | null;
  started_on: string | null;
  dismissed_on: string | null;
  cancelled_on: string | null;
  dismissed_by_id: number | null;
  dismissed_by_name: string | null;
  manager_notes: string | null;
  resolved_by_id: number | null;
  resolved_by_name: string | null;
  resolved_on: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMaintenanceInput {
  category_id: number;
  description: string;
  images?: string[];
  property_id: number;
  floor_id: number;
  room_id: number;
  bed_id: number;
}

/** `GET /maintenance-management/maintenance` — a plain paginated list, same shape as every
 * other Feathers list endpoint (`{total, skip, limit, data}`), not wrapped in a `listing` key. */
export type ApiMaintenanceListResponse = Paginated<ApiMaintenanceTicket>;

// ---------------------------------------------------------------------------
// Platform support — FAQs (`GET /support/faq`) & support queries
// (`GET/POST /support/support-query`, `GET /support/support-query/:id`)
// ---------------------------------------------------------------------------

export interface ApiFaq {
  id: number;
  question: string;
  answer: string;
  priority: number;
  panel: SupportPanel;
  status: MasterStatus;
  created_at: string;
  updated_at: string;
}

export type ApiFaqListResponse = Paginated<ApiFaq>;

export type SupportQueryStatus = 'PENDING' | 'RESOLVED' | (string & {});

/** Only present when the request eager-loads it (`$eager=[category]`). */
export interface ApiSupportQueryCategoryRef {
  id: number;
  name: string;
  panel: SupportPanel;
}

/** Shape of one row in `POST /upload`'s response — attach it to a query as-is. */
export interface ApiSupportQueryAttachment {
  link: string;
  thumbnail?: string | null;
  key?: string;
  purpose?: string;
  fileType?: number;
  metadata?: { size?: number; duration?: number } | null;
}

export interface ApiSupportQuery {
  id: number;
  owner_id?: number | null;
  tenant_id?: number | null;
  panel: SupportPanel;
  category_id: number;
  category?: ApiSupportQueryCategoryRef | null;
  description: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  avatar?: ApiSupportQueryAttachment | null;
  attachments?: ApiSupportQueryAttachment[] | null;
  resolved_by?: number | null;
  resolved_by_name?: string | null;
  resolved_by_email?: string | null;
  resolved_by_phone?: string | null;
  resolved_on?: string | null;
  status: SupportQueryStatus;
  created_at: string;
  updated_at: string;
}

export type ApiSupportQueryListResponse = Paginated<ApiSupportQuery>;

export interface CreateSupportQueryInput {
  category_id: number;
  description: string;
  attachments?: ApiSupportQueryAttachment[];
}

// ---------------------------------------------------------------------------
// Visitor log (`GET/POST/PATCH/DELETE /tenant-management/visitor-log`)
// ---------------------------------------------------------------------------

export type VisitorLogStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_IN' | 'CHECKED_OUT' | (string & {});

export interface ApiVisitorLog {
  id: number;
  tenant_id: number;
  property_id: number;
  floor_id: number;
  room_id: number;
  bed_id: number;
  name: string;
  phone: string;
  visit_date: string;
  visit_purpose: string;
  expected_exit_time: string;
  otp_code: string;
  status: VisitorLogStatus;
  approved_on: string | null;
  rejected_on: string | null;
  actual_in_time: string | null;
  actual_out_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVisitorLogInput {
  name: string;
  phone: string;
  visit_date: string;
  visit_purpose: string;
  expected_exit_time: string;
  property_id: number;
  floor_id: number;
  room_id: number;
  bed_id: number;
}

// ---------------------------------------------------------------------------
// Move-out (`GET/POST /tenant/move-out`)
// ---------------------------------------------------------------------------

export type MoveOutStatus =
  | 'REQUESTED'
  | 'REJECTED'
  | 'INSPECTING'
  | 'AWAITING_PAYMENT'
  | 'APPROVED'
  | 'CHECKED_OUT'
  | (string & {});

export type MoveOutRefundStatus = 'NOT_APPLICABLE' | 'PENDING' | 'PAID' | (string & {});

export interface MoveOutEstimateNotice {
  required_notice_days: number;
  notice_given_days: number;
  notice_met: boolean;
  within_lock_in: boolean;
  lock_in_end: string;
}

export interface MoveOutEstimateSettlement {
  security_deposit: number;
  pending_rent: number;
  damage_estimate: number;
  short_notice_penalty: number;
  estimated_refund: number;
}

/** Same shape as the profile's `BankDetails`, but always present (never `null` fields) when
 * `has_bank_details` is true. */
export interface MoveOutEstimateBankDetails {
  bank_name: string;
  ifsc_code: string;
  account_number: string;
  account_holder_name: string;
}

/** `GET /tenant/move-out?estimate=true&booking_id=&expected_move_out=` — a preview, not a
 * saved request. Prompt for bank details when `has_bank_details` is false. */
export interface ApiMoveOutEstimate {
  booking_id: number;
  expected_move_out: string;
  earliest_move_out: string;
  notice: MoveOutEstimateNotice;
  settlement: MoveOutEstimateSettlement;
  bank_details: MoveOutEstimateBankDetails | null;
  has_bank_details: boolean;
}

export interface MoveOutCharge {
  id: string;
  title: string;
  amount: number;
  added_at: string;
  added_by_id: number;
  added_by_name: string;
}

/** One submitted move-out/exit request — list rows and the `:id` detail response share this
 * shape; the create response additionally echoes a `message`. */
export interface ApiMoveOutRequest {
  id: number;
  booking_id: number;
  tenant_id: number;
  property_id: number;
  room_id: number;
  bed_id: number;
  tenant_name: string;
  property_name: string;
  room_number: string;
  bed_number: string;
  expected_move_out: string;
  required_notice_days: number;
  notice_given_days: number;
  security_deposit: number;
  pending_rent_dues: number;
  notice_shortfall_penalty: number;
  damage_deductions: number;
  settlement_amount: number;
  charges: MoveOutCharge[];
  reason: string | null;
  rejection_reason: string | null;
  inspection_notes: string | null;
  status: MoveOutStatus;
  refund_status: MoveOutRefundStatus;
  settlement_payment_method: string | null;
  settlement_payment_note: string | null;
  settlement_transaction_id: number | null;
  settlement_transaction_code: string | null;
  payout_transaction_id: number | null;
  payout_transaction_code: string | null;
  requested_by_id: number | null;
  approved_by_id: number | null;
  rejected_by_id: number | null;
  marked_paid_by_id: number | null;
  requested_on: string | null;
  inspection_started_on: string | null;
  inspection_completed_on: string | null;
  settlement_paid_on: string | null;
  approved_on: string | null;
  checked_out_on: string | null;
  rejected_on: string | null;
  refund_paid_on: string | null;
  created_at: string;
  updated_at: string;
  message?: string;
}

export interface CreateMoveOutInput {
  booking_id: number;
  /** Date-only (`yyyy-mm-dd`) — the API echoes back a full ISO datetime. */
  expected_move_out: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Group booking enquiry (`POST /booking-management/group-booking-enquiry`)
// ---------------------------------------------------------------------------

/** Not documented as a fixed enum — `CO_LIVE` is the only confirmed value; `MALE_ONLY`/
 * `FEMALE_ONLY` follow the same SCREAMING_SNAKE convention used across this API. */
export type GroupBookingArrangement = 'MALE_ONLY' | 'FEMALE_ONLY' | 'CO_LIVE' | (string & {});
/** `THREE_MEALS` is confirmed by the doc; `TWO_MEALS` is inferred from the same convention. */
export type GroupBookingMeals = 'TWO_MEALS' | 'THREE_MEALS' | (string & {});
export type GroupBookingFoodType = 'VEGETARIAN' | 'NON_VEG' | (string & {});
export type GroupBookingStatus = 'PENDING' | 'RESOLVED' | 'REJECTED' | (string & {});

export interface CreateGroupBookingEnquiryInput {
  contact_name: string;
  contact_phone: string;
  organisation?: string;
  beds_required: number;
  city_id: number;
  locality_id?: number | null;
  male_count?: number;
  female_count?: number;
  preferred_arrangement: GroupBookingArrangement;
  meals_per_day: GroupBookingMeals;
  food_type: GroupBookingFoodType;
  /** Date-only (`yyyy-mm-dd`) — the API echoes back a full ISO datetime. */
  check_in_date: string;
  check_out_date: string;
}

export interface ApiGroupBookingEnquiry {
  id: number;
  contact_name: string;
  contact_phone: string;
  organisation: string | null;
  beds_required: number;
  male_count: number;
  female_count: number;
  preferred_arrangement: GroupBookingArrangement;
  meals_per_day: GroupBookingMeals;
  food_type: GroupBookingFoodType;
  check_in_date: string;
  check_out_date: string;
  stay_dates: unknown | null;
  city_name: string;
  locality_name: string | null;
  locality_id: number | null;
  city_id: number;
  state_id: number;
  state_name: string;
  status: GroupBookingStatus;
  resolved_on: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Property lead (`POST /property-management/property-lead`) — a tenant reports a PG/hostel
// that isn't listed yet. Hostel-only (`PropertyTypeEnum` has no Flat/Homestay values).
// ---------------------------------------------------------------------------

export type PropertyLeadType = 'PG' | 'HOSTEL' | 'CO_LIVING' | (string & {});
export type PropertyLeadStatus = 'NEW' | 'REVIEWING' | 'CONTACTED' | 'ONBOARDED' | 'REJECTED' | (string & {});

export interface CreatePropertyLeadInput {
  property_name: string;
  property_type: PropertyLeadType;
  address_line_1: string;
  /** Photos of the property — note the field is `images`, not `media`. */
  images?: MediaAttachment[];
  state_id?: number | null;
  city_id: number;
  locality_id?: number | null;
  owner_name: string;
  owner_phone: string;
}

export interface ApiPropertyLead {
  id: number;
  property_name: string;
  property_type: PropertyLeadType;
  address_line_1: string;
  images: MediaAttachment[] | null;
  state_id: number | null;
  state_name: string | null;
  city_id: number;
  city_name: string;
  locality_id: number | null;
  locality_name: string | null;
  owner_name: string;
  owner_phone: string;
  status: PropertyLeadStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ===========================================================================
// Extend stay (`GET/POST /tenant/extend-stay`) — Daily/Hourly checked-in bookings only.
// ===========================================================================

export type ExtensionMode = 'HOURLY' | 'DAILY' | (string & {});

export interface ApiExtendStayProperty {
  id: number;
  name: string;
  max_hourly_extension_hours: number | null;
  max_daily_extension_days: number | null;
  hourly_window_start: number | null;
  hourly_window_end: number | null;
}

export interface ApiExtendStayBooking {
  id: number;
  code: string;
  booking_mode: ApiBookingMode;
  status: BookingStatusApi;
  check_in_date: string;
  check_out_date: string | null;
  duration_hours: number | null;
  hourly_start_slot: number | null;
  hourly_end_slot: number | null;
  room_number: string;
  bed_number: string;
}

/** `GET /tenant/extend-stay?booking_id=` — a preview, not a saved request. `can_extend` is
 * false (with no further detail documented) when the booking isn't eligible. */
export interface ApiExtendStayPreview {
  booking: ApiExtendStayBooking;
  property: ApiExtendStayProperty;
  can_extend: boolean;
  max_allowed: number;
  unit_rate: number;
  extension_mode: ExtensionMode;
}

export interface ExtendStayBillSummary {
  rate_label: string;
  unit_rate: number;
  quantity: number;
  base_amount: number;
  gst_rate: number;
  gst_amount: number;
  coupon_discount: number;
  total_payable: number;
}

export interface CheckExtensionAvailabilityInput {
  booking_id: string;
  quantity: number;
  coupon_code?: string | null;
}

/** `POST /tenant/extend-stay` with `action: 'check-availability'` — a preview, not a saved
 * request. */
export interface ApiExtendStayAvailability {
  available: boolean;
  /** Undocumented but expected alongside `available: false` (mirrors `checkExtensionAvailability`'s
   * mock shape) — treated as optional since no sample response shows it. */
  reason?: string | null;
  max_allowed: number;
  quantity: number;
  extension_mode: ExtensionMode;
  new_check_out_date: string | null;
  new_hourly_end_slot: number | null;
  new_duration_hours: number | null;
  bill_summary: ExtendStayBillSummary;
}

export interface CreateExtensionInput {
  booking_id: string;
  quantity: number;
  payment_method: PaymentMethod;
  coupon_code?: string | null;
}

export type ExtensionStatusApi = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | (string & {});

export interface ApiStayExtension {
  id: number;
  code: string;
  status: ExtensionStatusApi;
  extension_mode: ExtensionMode;
  quantity: number;
  initiated_by: string;
  previous_check_out_date: string | null;
  previous_hourly_end_slot: number | null;
  previous_duration_hours: number | null;
  new_check_out_date: string | null;
  new_hourly_end_slot: number | null;
  new_duration_hours: number | null;
  unit_rate: number;
  base_amount: number;
  gst_rate: number;
  gst_amount: number;
  total_payable: number;
  invoice_id: number;
  invoice_number: string;
  pdf_attachment: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export interface ApiExtendStayInvoiceSummary {
  id: number;
  invoice_number: string;
  type: string;
  amount: number;
  status: string;
}

export interface ApiExtendStayPaymentHint {
  payment_method: PaymentMethod;
  note: string;
}

/** `POST /tenant/extend-stay` (create) response. `transaction` is the gateway order for an
 * online payment method (null for CASH) — same shape the booking/pay-rent flows already use
 * to drive the Razorpay checkout. */
export interface ApiCreateExtensionResponse {
  extension: ApiStayExtension;
  invoice: ApiExtendStayInvoiceSummary;
  bill_summary: ExtendStayBillSummary;
  instantly_confirmed: boolean;
  transaction: ApiBookingTransaction | null;
  /** Undocumented shape when non-null — not consumed by the client. */
  payment: unknown | null;
  payment_hint: ApiExtendStayPaymentHint | null;
}

// ===========================================================================
// Room swap / bed change (`GET/POST /tenant/change-bed`, `GET/PATCH /tenant/change-bed/:id`)
// ===========================================================================

export interface ApiSwapBed {
  id: number;
  bed_number: string;
  status: string;
}

/** One room's availability for swap, within `GET /tenant/change-bed?booking_id=`'s
 * floor grouping. `monthly_rent` is `null` when the room's layout has no MONTHLY rate
 * card configured. */
export interface ApiSwapRoom {
  id: number;
  room_number: string;
  layout: string;
  sharing_count: number;
  is_ac: boolean;
  available_count: number;
  monthly_rent: number | null;
  beds: ApiSwapBed[];
}

export interface ApiSwapFloorGroup {
  id: number;
  name: string;
  rooms: ApiSwapRoom[];
}

export type ChangeBedRequestStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | (string & {});

/** The floor/room/bed a change-bed request moves from/to. `floor`/`room`/`bed` go `null`
 * once the request is cancelled (the `*_id`s remain). */
export interface ApiChangeBedLocation {
  floor_id: number;
  room_id: number;
  bed_id: number;
  floor: { id: number; name: string } | null;
  room: { id: number; room_number: string; layout: string; sharing_count: number } | null;
  bed: { id: number; bed_number: string; status: string } | null;
}

export interface ApiChangeBedRent {
  old_rent: number;
  new_rent: number;
  net_change: number;
}

/** A room/bed-change request — returned by create, by-id fetch, and cancel. */
export interface ApiChangeBedRequest {
  id: number;
  booking_id: number;
  tenant_id: number;
  property_id: number;
  status: ChangeBedRequestStatus;
  reason: string | null;
  effective_on: string;
  requested_by_role: string;
  requested_on: string;
  completed_on: string | null;
  cancelled_on: string | null;
  from: ApiChangeBedLocation;
  to: ApiChangeBedLocation;
  rent: ApiChangeBedRent;
}

export interface CreateChangeBedInput {
  booking_id: number;
  target_bed_id: number;
  reason: string;
}

export interface CancelChangeBedInput {
  booking_id: number;
  cancel_reason: string;
}

// ---------------------------------------------------------------------------
// Refer & earn (GET /tenant/refer-and-earn?summary=true&list=true)
// ---------------------------------------------------------------------------

export interface ApiReferralBenefit {
  value: number;
  type: 'FLAT' | (string & {});
}

export interface ApiReferralBenefits {
  you_get: ApiReferralBenefit;
  friend_gets: ApiReferralBenefit;
}

export interface ApiReferralStats {
  total_saved: number;
  referred_count: number;
  pending_count: number;
}

export type ReferralStatusApi = 'PENDING' | 'COMPLETED' | (string & {});

export interface ApiReferralItem {
  id: number;
  status: ReferralStatusApi;
  referred_name: string;
  referred_phone: string;
  referred_email: string | null;
  referred_avatar: string | null;
  referrer_reward_value: number;
  referrer_reward_type: string;
  referrer_reward_applied: boolean;
  referrer_reward_amount: number;
  referred_discount_applied: boolean;
  completed_at: string | null;
  created_at: string;
}

/** `referral_code` is `null` until the tenant has booked and checked in to their first
 * property — that's what gates the invite link (`share.pgfy.in/referral?code=...`). */
export interface ApiReferralSummary {
  referral_code: string | null;
  benefits: ApiReferralBenefits;
  stats: ApiReferralStats;
  referrals: ApiReferralItem[];
}

// ---------------------------------------------------------------------------
// Brand rewards (GET /tenant/rewards, GET /tenant/rewards/:id, PATCH /tenant/rewards/:id)
// A reward is a scratch card issued to the tenant (e.g. on check-in) for a partner-vendor
// offer; scratching it draws a coupon, which is then redeemed with that partner directly.
// ---------------------------------------------------------------------------

/** LOCKED → not yet scratched; SCRATCHED → coupon drawn; EXPIRED → lapsed unscratched. */
export type ScratchCardStatusApi = 'LOCKED' | 'SCRATCHED' | 'EXPIRED' | (string & {});
/** The drawn coupon's own lifecycle, independent of the scratch card's status above. */
export type RewardCouponStatusApi = 'AVAILABLE' | 'ASSIGNED' | 'REDEEMED' | 'EXPIRED' | (string & {});
export type OfferCouponTypeApi = 'UNIQUE' | 'COMMON' | (string & {});
export type RewardIssueSource = 'CHECK_IN' | (string & {});

/** Media reference shape used by rewards (vendor logos, offer banners) — lighter than
 * `ProfileAsset`/`MasterMediaAsset`: no `type`/`key` fields. */
export interface RewardAsset {
  link: string;
  metadata?: { size?: number } | null;
  thumbnail?: string | null;
}

export interface ApiRewardVendor {
  id: number;
  name: string;
  logo: RewardAsset | null;
  category: string;
  website: string;
  t_and_c: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ApiRewardOffer {
  id: number;
  vendor_id: number;
  title: string;
  description: string;
  banner: RewardAsset | null;
  offer_url: string;
  expiry_date: string;
  coupon_type: OfferCouponTypeApi;
  common_code: string | null;
  redemption_instructions: string;
  t_and_c: string;
  status: string;
  activated_on: string | null;
  expired_on: string | null;
  created_at: string;
  updated_at: string;
  vendor: ApiRewardVendor;
}

/** Only present once the reward has been scratched (drawn a real coupon). */
export interface ApiRewardCoupon {
  id: number;
  code: string;
  status: RewardCouponStatusApi;
  redeemed_on: string | null;
}

/** `GET /tenant/rewards` list item. */
export interface ApiReward {
  id: number;
  tenant_id: number;
  booking_id: number;
  offer_id: number;
  issue_source: RewardIssueSource;
  invoice_id: number | null;
  status: ScratchCardStatusApi;
  scratched_at: string | null;
  expiry_date: string;
  created_at: string;
  updated_at: string;
  offer: ApiRewardOffer;
  is_expired: boolean;
  coupon: ApiRewardCoupon | null;
}

/** `GET /tenant/rewards/:id` — the list item shape plus denormalized convenience fields
 * (duplicated from `offer`/`offer.vendor`) for a single-reward detail view. */
export interface ApiRewardDetail extends ApiReward {
  redemption_instructions: string;
  t_and_c: string;
  offer_url: string;
  vendor: ApiRewardVendor;
}

export type RewardAction = 'scratch' | 'redeem';

// ---------------------------------------------------------------------------
// Tenant notifications (`GET/PATCH /notification-management/tenant-notification`)
// ---------------------------------------------------------------------------

export type TenantNotificationAction =
  | 'PROFILE'
  | 'SUPPORT'
  | 'BOOKING'
  | 'INVOICE'
  | 'MAINTENANCE'
  | 'PAYOUT'
  | 'LEASE'
  | 'REWARD'
  | 'KYC'
  | 'ANNOUNCEMENT'
  | 'BROADCAST'
  | 'VISITOR'
  | 'MOVE_OUT'
  | 'BED_CHANGE'
  | 'TRANSACTION'
  | 'SUBSCRIPTION'
  | (string & {});

export type TenantNotificationStatus = 'SEEN' | 'UNSEEN' | 'DELETED' | (string & {});

export type TenantNotificationEntityType =
  | 'adminProfile'
  | 'ownerProfile'
  | 'tenantProfile'
  | 'supportQuery'
  | 'booking'
  | 'invoice'
  | 'maintenanceTicket'
  | 'ownerPayout'
  | 'leaseAgreement'
  | 'propertyAnnouncement'
  | 'notificationBroadcast'
  | 'moveOutRequest'
  | 'bedChangeRequest'
  | 'visitorLog'
  | 'scratchCard'
  | 'ownerSubscription'
  | 'property'
  | (string & {});

export interface ApiTenantNotification {
  id: number;
  tenant_id: number;
  title: string;
  message: string;
  icon: string | null;
  action: TenantNotificationAction;
  entity_type: TenantNotificationEntityType | null;
  entity_id: number | null;
  status: TenantNotificationStatus;
  /** Backend-suggested in-app path — the authoritative target for `BROADCAST` (a broadcast
   * isn't tied to any one entity type/id, so `action`+`entity_type` alone can't route it). */
  target_location: string | null;
  sound: string | null;
  channel_id: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Packer and mover service (`POST /tenant/packers-and-movers`) — a tenant requests a quote for
// moving their belongings to a new property.
// ---------------------------------------------------------------------------

export type PackersMoversStatusType =
  | 'SUBMITTED'
  | 'CANCELLED'
  | 'ASSIGNED'
;

export interface CreatePackersMoversEnquiryRequest {
    pickup_address: string;
    pickup_city: string;
    pickup_state: string;
    pickup_pincode: string;

    destination_address: string;
    destination_city: string;
    destination_state: string;
    destination_pincode: string;

    contact_name: string;
    contact_phone: string;
    contact_email?: string;

    preferred_date: Date | string;
    preferred_time: string;
    items: string[];
}

export interface CreatePackersMoversEnquiryResponse {
    id: number;
    tenant_id: number;
    status: PackersMoversStatusType;
    pickup_address: string;
    pickup_city: string;
    pickup_state: string;
    pickup_pincode: string;

    destination_address: string;
    destination_city: string;
    destination_state: string;
    destination_pincode: string;

    contact_name: string;
    contact_phone: string;
    contact_email: string | null;

    preferred_date: Date | string;
    preferred_time: string;
    items: string[];
    created_at: string;
    updated_at: string;
}
