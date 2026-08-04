/**
 * PGfy Tenant — domain model.
 * Mirrors the T-S (tenant app) screens in the PRD: discovery, booking flow,
 * and the post-booking tenant dashboard.
 */
import type { BedStatusKey } from '@/theme/colors';

export type PropertyType = 'PG' | 'Hostel' | 'Co-living' | 'Flat' | 'Home stay';
export type Gender = 'Male' | 'Female' | 'Co-ed';
export type SharingType = 'Single' | 'Double' | 'Triple' | '4-sharing' | 'Dormitory';
export type KycStatus = 'Verified' | 'Pending' | 'Not Submitted';

/* ── Booking type ────────────────────────────── */
export type BookingMode = 'hourly' | 'daily' | 'monthly';

export interface HourlyConfig {
  windowStart: string;
  windowEnd: string;
}

export interface DailyConfig {
  checkInTime: string;
  checkOutTime: string;
}

export interface ListingBookingConfig {
  hourlyEnabled: boolean;
  dailyEnabled: boolean;
  monthlyEnabled: boolean;
  hourly?: HourlyConfig;
  daily?: DailyConfig;
}

export interface HourlyPricingTier {
  sharingType: SharingType;
  rentPerHour: number;
  available: number;
}

export interface DailyPricingTier {
  sharingType: SharingType;
  rentPerDay: number;
  available: number;
}

export interface Certificate {
  label: string;
  status: 'Verified' | 'Pending' | 'Expired' | 'Missing';
  expiry?: string;
}

export interface PricingTier {
  sharingType: SharingType;
  rent: number;
  available: number;
}

/**
 * Real per-combination pricing for a room layout, as returned by the property-details API.
 * Only populated for API-backed listings — mock listings synthesize these combos instead
 * (see `monthlyPlansForTier` in the listing-detail screen).
 */
export interface PricingVariant {
  sharingType: SharingType;
  /** Raw API layout code (e.g. `SINGLE`, `DUO`) — required to query room/bed availability. */
  layout: string;
  available: number;
  acWithFood?: number;
  acNoFood?: number;
  nonAcWithFood?: number;
  nonAcNoFood?: number;
  /** Flat/Home stay only — the single monthly/daily rent (no AC/food split). */
  rent?: number;
}

export interface FoodMenuSlot {
  enabled: boolean;
  items: string;
}

/** A single calendar day's meal schedule, as returned by the property-details API. */
export interface WeeklyMenuDay {
  /** 0 = Sunday .. 6 = Saturday (matches `Date#getDay()`). */
  dayOfWeek: number;
  morningTea?: FoodMenuSlot;
  breakfast?: FoodMenuSlot;
  lunch?: FoodMenuSlot;
  eveningTea?: FoodMenuSlot;
  dinner?: FoodMenuSlot;
}

export interface Bed {
  id: string;
  label: string;
  status: BedStatusKey;
  gender: Gender;
  rent: number;
}

/** Aggregate lifestyle profile of a room's current occupants — drives the
 *  compatibility score shown during room selection. */
export interface RoommateProfile {
  professionals: number;
  students: number;
  smoking: boolean;
  alcohol: boolean;
  sleep: 'early' | 'late';
  diet: 'veg' | 'vegan' | 'nonveg';
}

export interface Room {
  id: string;
  number: string;
  sharingType: SharingType;
  capacity: number;
  rent: number;
  deposit: number;
  amenities: string[];
  photo?: string;
  beds: Bed[];
  occupied: number;
  roommateProfile?: RoommateProfile;
}

export interface Floor {
  id: string;
  name: string;
  rooms: Room[];
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
}

export interface FoodDay {
  meal: 'Breakfast' | 'Lunch' | 'Dinner';
  items: string;
}

export type ListingTag = 'New' | 'Last Bed' | 'Fast Filling';

/** Section-wise property media (mirrors owner add-property flow). */
export interface MediaSection {
  id: string;
  name: string;
  images: string[];
}

export interface Listing {
  id: string;
  name: string;
  type: PropertyType;
  /** Finer subcategory label for `type: 'Flat'` (e.g. "2 BHK") — absent for Hostel/Home stay. */
  subType?: string;
  /** `type === 'Flat' | 'Home stay'` only — books the whole property (see `maxOccupancy`, no
   *  room/bed selection). */
  isUnitProperty?: boolean;
  /** `Flat`/`Home stay` only — max named guests per booking. */
  maxOccupancy?: number;
  gender: Gender;
  locality: string;
  city: string;
  /** hidden for guests in the PRD; included here as mock */
  addressLine: string;
  pincode: string;
  lat: number;
  lng: number;
  coverImage: string;
  gallery: string[];
  mediaSections: MediaSection[];
  hasVideoTour: boolean;
  description: string;
  priceFrom: number; // lowest sharing rent
  securityDeposit: number;
  rating: number;
  reviewCount: number;
  pgfyScore: number; // 0–5
  verified: boolean;
  verificationDate?: string;
  verificationExpiry?: string;
  certificates: Certificate[];
  distanceKm: number;
  amenities: string[];
  houseRules: string[];
  foodIncluded: boolean;
  foodRating?: number;
  foodMenu: FoodDay[];
  pricing: PricingTier[];
  /** Real per-combination pricing (API-backed listings only) — see `PricingVariant`. */
  pricingVariants?: PricingVariant[];
  floors: Floor[];
  vacantBeds: number;
  occupancyPct: number;
  tags: ListingTag[];
  nearby: { label: string; distance: string; icon: string }[];
  reviews: Review[];
  ratingBreakdown: { label: string; value: number }[];
  noticePeriodDays: number;
  lockInMonths: number;
  addedOn: string;
  bookingConfig: ListingBookingConfig;
  hourlyPricing: HourlyPricingTier[];
  dailyPricing: DailyPricingTier[];
  /** Property-level roommate makeup used for compatibility filtering on search. */
  roommateSummary?: {
    mostlyProfessionals: boolean;
    smoking: boolean;
    alcohol: boolean;
    sleep: 'early' | 'late';
    diet: 'veg' | 'vegan' | 'nonveg';
  };
  /** Appointed on-site property manager the tenant can reach. */
  manager: { name: string; phone: string };
  /** Real per-day-of-week meal schedule (API-backed listings only) — see `WeeklyMenuDay`. */
  weeklyFoodMenu?: WeeklyMenuDay[];
  /** Whether the signed-in tenant may rate this property (API-backed listings only). */
  canRate?: boolean;
  /** The signed-in tenant's own rating of this property, or `null` if they haven't rated it
   * (API-backed listings only) — carries the full category breakdown so the edit sheet can
   * prefill from it. */
  myRating?: TenantRating | null;
  /** Discount applied to *this* tenant's own booking checkout for having been referred
   * (API-backed listings only) — `null` type/value when `applicable` is false. */
  referralDiscount?: {
    applicable: boolean;
    value: number | null;
    type: 'FLAT' | 'PERCENTAGE' | null;
  };
  isFavorite?: boolean;
  favoriteId?: number | null;
}

/** A tenant's own rating/review of a property — the shape shared by `Listing.myRating` and
 * the property's `reviews` list (API-backed listings only). */
export interface TenantRating {
  id: number;
  tenantName: string;
  tenantAvatar: string | null;
  ratings: {
    cleanliness: number;
    food: number;
    safety: number;
    staff: number;
    price: number;
    overall: number;
  };
  review: string | null;
  createdAt: string;
}

export interface CuratedRail {
  key: string;
  title: string;
  subtitle?: string;
  listingIds: string[];
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  tone: 'coral' | 'success' | 'info';
  icon: string;
}

/* ---------------- Booking & post-booking ---------------- */

export type BookingStatus = 'Awaiting Approval' | 'Confirmed' | 'Active' | 'Notice Period';
export type StayStatus = 'Active' | 'Notice Period' | 'Suspended';

export interface ActiveBooking {
  ref: string;
  listingId: string;
  propertyName: string;
  propertyImage: string;
  locality: string;
  roomNumber: string;
  bedLabel: string;
  sharingType: SharingType;
  checkInDate: string;
  status: BookingStatus;
  stayStatus: StayStatus;
  monthlyRent: number;
  deposit: number;
  nextRentDue: string;
  nextRentAmount: number;
  rentOverdue: boolean;
  qrToken: string;
  /** Stay cadence. Only hourly/daily stays can be extended (T-S new). */
  bookingMode: BookingMode;
  /** Hourly/daily stays: when the current stay ends, and the per-unit rate. */
  checkOutDate?: string;
  startTime?: string;
  endTime?: string;
  ratePerHour?: number;
  ratePerDay?: number;
  /** Set when the tenant was onboarded offline by the owner. */
  ownerOnboarded?: boolean;
  /** A pending invoice raised by the owner that the tenant can clear from My Stay. */
  pendingInvoice?: { id: string; label: string; amount: number; dueDate: string };
}

export type LeaseStatus = 'Pending Tenant Signature' | 'Signed' | 'Expired';

export type PastBookingStatus = 'Completed' | 'Moved Out' | 'Cancelled';

export interface PastBooking {
  ref: string;
  listingId: string;
  propertyName: string;
  propertyImage: string;
  locality: string;
  type: PropertyType;
  roomNumber: string;
  bedLabel: string;
  sharingType: SharingType;
  checkInDate: string;
  checkOutDate: string;
  durationMonths: number;
  monthlyRent: number;
  totalPaid: number;
  refundedDeposit: number;
  rating?: number; // rating the tenant left, if any
  status: PastBookingStatus;
}

export interface Lease {
  id: string;
  status: LeaseStatus;
  startDate: string;
  endDate: string;
  lockInMonths: number;
  noticeDays: number;
  earlyExitPenalty: number;
  daysToExpiry: number;
}

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Partial';

export interface Invoice {
  id: string;
  month: string;
  label: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  paidDate?: string;
  status: InvoiceStatus;
  breakdown: { label: string; amount: number }[];
}

export interface Visitor {
  id: string;
  name: string;
  phone: string;
  visitDate: string;
  visitTime: string;
  otp: string;
  status: 'Pending' | 'Visited' | 'Expired';
  inTime?: string;
  outTime?: string;
}

export type SupportKind = 'platform' | 'property';
export type TicketCategory =
  | 'Electrical'
  | 'Plumbing'
  | 'Housekeeping'
  | 'Wi-Fi'
  | 'Food'
  | 'Water supply'
  | 'AC / cooling'
  | 'Security'
  | 'Noise complaint'
  | 'Room maintenance'
  | 'Other'
  | 'KYC verification issue'
  | 'Invoice issue'
  | 'Login or account issue'
  | 'Delete account request';
export type TicketStatus = 'Open' | 'Assigned' | 'In Progress' | 'Resolved';

export interface TicketEvent {
  status: TicketStatus;
  at: string;
  note?: string;
}

/** Link to a complaint auto-created in the HouseWise maintenance partner (M-INT1). */
export interface HouseWiseTicketLink {
  complaintId: string;
  url: string;
  syncedAt: string;
  status: 'synced' | 'failed';
}

export interface Ticket {
  id: string;
  supportKind: SupportKind;
  category: TicketCategory;
  description: string;
  status: TicketStatus;
  createdAt: string;
  images: string[];
  timeline: TicketEvent[];
  response?: string;
  housewise?: HouseWiseTicketLink;
}

export type RequestStatus = 'Pending' | 'Under Review' | 'Approved' | 'Denied' | 'Refund Initiated';

export interface RoomSwapRequest {
  id: string;
  currentRoom: string;
  currentSharing: SharingType;
  targetSharing: SharingType;
  reason: string;
  status: RequestStatus;
  requestedOn: string;
}

export interface MoveOutRequest {
  id: string;
  expectedDate: string;
  noticeDays: number;
  requiredNotice: number;
  depositHeld: number;
  pendingRent: number;
  damageEstimate: number;
  shortNoticePenalty: number;
  estimatedRefund: number;
  status: RequestStatus;
}

export type NotificationType =
  | 'Rent Reminder'
  | 'Booking Update'
  | 'Announcement'
  | 'Lease Expiry'
  | 'Ticket Update'
  | 'Visitor Alert';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export interface TenantUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  kycStatus: KycStatus;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  emergencyContact: string;
  documents: { label: string; status: 'Uploaded' | 'Verified' | 'Missing' }[];
}

/* ---------------- Filters ---------------- */

export interface FilterState {
  budgetMin: number;
  budgetMax: number;
  stay: 'Any' | 'Short Stay' | 'Long Stay';
  sharing: SharingType[];
  gender: Gender | 'Any';
  food: string[];
  amenities: string[];
  verifiedOnly: boolean;
  bookingType: BookingMode;
}
