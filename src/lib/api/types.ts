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
  roommate_preferences: unknown | null;
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
  created_at: string;
  updated_at: string;
}

// ===========================================================================
// Property details (`GET /tenant/properties/:id`)
// ===========================================================================

export type ApiBookingMode = 'MONTHLY' | 'DAILY' | 'HOURLY';

/** One room layout's pricing, scoped to the `booking_mode` requested. */
export interface ApiPropertyPricingTier {
  id: number;
  booking_mode: ApiBookingMode;
  /** Room layout code, e.g. `SINGLE`, `DUO`, `TRIPLE`. */
  layout: string;
  ac_with_food: number;
  ac_no_food: number;
  non_ac_with_food: number;
  non_ac_no_food: number;
  available_beds: number;
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

/** Best-effort shape — the doc doesn't cover a populated example, so the adapter reads
 * defensively and falls back gracefully if a field is named differently. */
export interface ApiPropertyReview {
  id?: number | string;
  author?: string;
  avatar?: string | null;
  rating?: number;
  created_at?: string;
  comment?: string;
}

/** `GET /tenant/properties/:id?booking_mode=&record_view=` — full property details. */
export interface ApiPropertyDetails {
  id: number;
  name: string;
  code: string;
  description: string | null;
  gender: PropertyGender;
  property_type: string;
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
  rating: number | null;
  reviews: ApiPropertyReview[];
  can_rate: boolean;
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

export interface ApiPropertyRoom {
  id: number;
  room_number: string;
  layout: string;
  is_ac: boolean;
  sharing_count: number;
  filled: number;
  available: number;
  price: number;
  /** 0–100 roommate compatibility score, computed server-side. */
  match_score: number;
  roommate_preferences: unknown | null;
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

export interface ApiBookingProperty {
  id: number;
  name: string;
  media: PropertyMediaSection[];
  locality: string;
  city: string;
  property_type: string;
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
  check_in_date: string;
  check_out_date: string | null;
  actual_check_in: string | null;
  actual_check_out: string | null;
  hourly_start_slot: number | null;
  hourly_end_slot: number | null;
  base_rent: number;
  security_deposit: number;
  total_paid: number | null;
  next_rent_due: string | null;
  check_in_otp: string | null;
  check_in_qr: string | null;
  has_check_in_pass: boolean;
  /** Undocumented shape — always `null` in observed responses. */
  lease: Record<string, unknown> | null;
}

/** `GET /tenant/booking/:id` — the list item shape plus the full check-in pass. */
export interface ApiBookingDetail extends ApiBooking {
  check_in_pass: Record<string, unknown> | null;
}

export interface CreateBookingInput {
  property_id: number;
  room_id: number;
  bed_id: number;
  floor_id?: number;
  booking_mode: ApiBookingMode;
  is_ac?: boolean;
  has_food?: boolean;
  room_layout: string;
  check_in_date: string;
  /** Daily bookings only — the response already echoes this back per `ApiBookingCreateResponse`. */
  check_out_date?: string | null;
  /** Hourly bookings only — the response already echoes this back per `ApiBookingCreateResponse`. */
  duration_hours?: number | null;
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
  check_in_otp: string | null;
  /** A real, pre-rendered QR image when the backend has generated one — prefer this over
   * building one client-side (see `buildCheckInPassPayload`) whenever it's present. */
  check_in_qr: ProfileAsset | null;
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

/** `GET /tenant/my-stay?bed_id=` — full stay detail for one bed. `announcements`/
 * `maintenance` shapes aren't documented (always empty in observed responses), so they're
 * left as opaque arrays rather than guessed at. */
export interface ApiMyStayResponse {
  booking: ApiMyStayBooking;
  billing: ApiMyStayBilling;
  announcements: unknown[];
  maintenance: unknown[];
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

export interface MaintenanceSummary {
  open: number;
  in_progress: number;
  resolved: number;
}

/** `GET /maintenance-management/maintenance` wraps the paginated list in a `listing` key
 * alongside a tenant-wide `summary` (counts aren't scoped to the current page). */
export interface ApiMaintenanceListResponse {
  summary: MaintenanceSummary;
  listing: Paginated<ApiMaintenanceTicket>;
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
