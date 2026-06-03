/**
 * PGfy Tenant — domain model.
 * Mirrors the T-S (tenant app) screens in the PRD: discovery, booking flow,
 * and the post-booking tenant dashboard.
 */
import type { BedStatusKey } from '@/theme/colors';

export type PropertyType = 'PG' | 'Hostel' | 'Co-living';
export type Gender = 'Male' | 'Female' | 'Co-ed';
export type SharingType = 'Single' | 'Double' | 'Triple' | '4-sharing' | 'Dormitory';
export type KycStatus = 'Verified' | 'Pending' | 'Not Submitted';

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

export interface Bed {
  id: string;
  label: string;
  status: BedStatusKey;
  gender: Gender;
  rent: number;
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

export interface Listing {
  id: string;
  name: string;
  type: PropertyType;
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
}
