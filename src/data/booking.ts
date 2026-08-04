/** The tenant's active booking + post-booking records. */
import type {
  ActiveBooking, Lease, Invoice, Visitor, Ticket, RoomSwapRequest, MoveOutRequest, PastBooking,
} from './types';
import { getListing } from './listings';
import { daysFromNow } from '@/lib/format';

const listing = getListing('l1')!;

export const ACTIVE_BOOKING: ActiveBooking = {
  ref: 'PGF-8821',
  listingId: 'l1',
  propertyName: listing.name,
  propertyImage: listing.coverImage,
  locality: listing.locality,
  roomNumber: '101',
  bedLabel: 'B1',
  sharingType: 'Double',
  checkInDate: '2026-03-05',
  status: 'Active',
  stayStatus: 'Active',
  monthlyRent: 13000,
  deposit: 26000,
  nextRentDue: '2026-06-05',
  nextRentAmount: 13000,
  rentOverdue: false,
  qrToken: 'PGFY-CHKN-8821-Z7K9',
  bookingMode: 'monthly',
  // Onboarded offline by the owner — a pending invoice is surfaced on the My Stay page.
  ownerOnboarded: true,
  pendingInvoice: { id: 'INV-OWN-0625', label: 'June rent · owner-raised', amount: 13000, dueDate: '2026-06-05' },
};

const hourlyListing = getListing('l4')!;
/** Checked-in hourly stay — eligible for extension within the property's window. */
export const ACTIVE_HOURLY_BOOKING: ActiveBooking = {
  ref: 'PGF-9001',
  listingId: hourlyListing.id,
  propertyName: hourlyListing.name,
  propertyImage: hourlyListing.coverImage,
  locality: hourlyListing.locality,
  roomNumber: 'G2',
  bedLabel: 'A',
  sharingType: 'Double',
  checkInDate: '2026-05-29',
  status: 'Active',
  stayStatus: 'Active',
  monthlyRent: 0,
  deposit: 0,
  nextRentDue: '2026-05-29',
  nextRentAmount: 0,
  rentOverdue: false,
  qrToken: 'PGFY-CHKN-9001-H3R2',
  bookingMode: 'hourly',
  startTime: '14:00',
  endTime: '18:00',
  ratePerHour: 120,
};

const dailyListing = getListing('l2')!;
/** Checked-in daily stay — eligible for extension up to the owner's day cap. */
export const ACTIVE_DAILY_BOOKING: ActiveBooking = {
  ref: 'PGF-9002',
  listingId: dailyListing.id,
  propertyName: dailyListing.name,
  propertyImage: dailyListing.coverImage,
  locality: dailyListing.locality,
  roomNumber: 'G1',
  bedLabel: 'B',
  sharingType: 'Single',
  checkInDate: '2026-05-27',
  status: 'Active',
  stayStatus: 'Active',
  monthlyRent: 0,
  deposit: 0,
  nextRentDue: '2026-05-30',
  nextRentAmount: 0,
  rentOverdue: false,
  qrToken: 'PGFY-CHKN-9002-D8L5',
  bookingMode: 'daily',
  checkOutDate: '2026-05-30',
  ratePerDay: 560,
};

const upcomingListing = getListing('l3')!;
/** Paid & confirmed, but the tenant hasn't checked in yet — eligible for cancellation. */
export const UPCOMING_BOOKING: ActiveBooking = {
  ref: 'PGF-9300',
  listingId: upcomingListing.id,
  propertyName: upcomingListing.name,
  propertyImage: upcomingListing.coverImage,
  locality: upcomingListing.locality,
  roomNumber: '305',
  bedLabel: 'A',
  sharingType: 'Double',
  checkInDate: '2026-07-05',
  status: 'Confirmed',
  stayStatus: 'Active',
  monthlyRent: 14000,
  deposit: 28000,
  nextRentDue: '2026-08-05',
  nextRentAmount: 14000,
  rentOverdue: false,
  qrToken: 'PGFY-CHKN-9300-U1P0',
  bookingMode: 'monthly',
};

/** All current bookings — checked-in stays plus the upcoming (pre-check-in) one. */
export const ACTIVE_BOOKINGS: ActiveBooking[] = [
  UPCOMING_BOOKING,
  ACTIVE_BOOKING,
  ACTIVE_HOURLY_BOOKING,
  ACTIVE_DAILY_BOOKING,
];

export const LEASE: Lease = {
  id: 'LSE-8821',
  status: 'Pending Tenant Signature',
  startDate: '2026-03-05',
  endDate: '2027-03-05',
  lockInMonths: 6,
  noticeDays: 30,
  earlyExitPenalty: 13000,
  daysToExpiry: daysFromNow('2027-03-05'),
};

function inv(id: string, month: string, label: string, amount: number, status: Invoice['status'], dueDate: string, paidDate?: string): Invoice {
  return {
    id, month, label, amount,
    paidAmount: status === 'Paid' ? amount : status === 'Partial' ? Math.round(amount / 2) : 0,
    dueDate, paidDate, status,
    breakdown: [
      { label: 'Monthly rent', amount: 13000 },
      { label: 'Food charges', amount: 3000 },
      { label: 'GST (18%)', amount: Math.round((amount - 0) * 0) },
    ].filter((b) => b.amount > 0),
  };
}

export const INVOICES: Invoice[] = [
  inv('INV-8826', '2026-06', 'June 2026 rent', 13000, 'Unpaid', '2026-06-05'),
  {
    id: 'INV-8825A',
    month: '2026-05',
    label: 'May 2026 food & services',
    amount: 3000,
    paidAmount: 1500,
    dueDate: '2026-05-28',
    status: 'Partial',
    breakdown: [
      { label: 'Food charges', amount: 2200 },
      { label: 'Laundry & housekeeping', amount: 800 },
    ],
  },
  inv('INV-8825', '2026-05', 'May 2026 rent', 13000, 'Paid', '2026-05-05', '2026-05-03'),
  inv('INV-8824', '2026-04', 'April 2026 rent', 13000, 'Paid', '2026-04-05', '2026-04-04'),
  inv('INV-8823', '2026-03', 'March 2026 rent', 13000, 'Paid', '2026-03-05', '2026-03-05'),
  inv('INV-8822', '2026-03', 'Registration + deposit', 27500, 'Paid', '2026-03-05', '2026-03-05'),
];

export const VISITORS: Visitor[] = [
  { id: 'v1', name: 'Rajesh Sharma', phone: '+91 98450 11223', visitDate: '2026-05-30', visitTime: '4:00 PM', otp: '482913', status: 'Pending' },
  { id: 'v2', name: 'Ishita Verma', phone: '+91 99001 22334', visitDate: '2026-05-24', visitTime: '11:30 AM', otp: '113908', status: 'Visited', inTime: '11:34 AM', outTime: '1:10 PM' },
  { id: 'v3', name: 'Mohit Rao', phone: '+91 98220 55667', visitDate: '2026-05-18', visitTime: '6:00 PM', otp: '770421', status: 'Visited', inTime: '6:05 PM', outTime: '8:20 PM' },
];

export const TICKETS: Ticket[] = [
  {
    supportKind: 'property',
    id: 'TKT-5012', category: 'Wi-Fi', description: 'Wi-Fi keeps dropping in the evening, hard to attend calls from room 101.',
    status: 'In Progress', createdAt: '2026-05-28T19:05:00+05:30', images: [],
    timeline: [
      { status: 'Open', at: '2026-05-28T19:05:00+05:30' },
      { status: 'Assigned', at: '2026-05-28T20:30:00+05:30', note: 'Assigned to Suresh (Maintenance)' },
      { status: 'In Progress', at: '2026-05-29T09:10:00+05:30', note: 'Technician checking the router' },
    ],
    response: 'Our technician is upgrading the router today. Thanks for your patience!',
  },
  {
    supportKind: 'property',
    id: 'TKT-4998', category: 'Plumbing', description: 'Bathroom tap was leaking.',
    status: 'Resolved', createdAt: '2026-05-20T08:00:00+05:30', images: [],
    timeline: [
      { status: 'Open', at: '2026-05-20T08:00:00+05:30' },
      { status: 'Resolved', at: '2026-05-20T15:00:00+05:30', note: 'Washer replaced' },
    ],
  },
  {
    supportKind: 'platform',
    id: 'SUP-2104', category: 'KYC verification issue', description: 'My Aadhaar was submitted, but the verification status is still pending in the app.',
    status: 'Assigned', createdAt: '2026-05-27T11:20:00+05:30', images: [],
    timeline: [
      { status: 'Open', at: '2026-05-27T11:20:00+05:30' },
      { status: 'Assigned', at: '2026-05-27T12:15:00+05:30', note: 'Assigned to the KYC review team' },
    ],
    response: 'We are validating your submitted identity details and will update the verification status shortly.',
  },
  {
    supportKind: 'platform',
    id: 'SUP-2089', category: 'Invoice issue', description: 'I need a corrected invoice for April because the paid amount is not reflected properly.',
    status: 'Resolved', createdAt: '2026-05-18T09:05:00+05:30', images: [],
    timeline: [
      { status: 'Open', at: '2026-05-18T09:05:00+05:30' },
      { status: 'In Progress', at: '2026-05-18T11:00:00+05:30', note: 'Billing team reviewing invoice history' },
      { status: 'Resolved', at: '2026-05-18T16:40:00+05:30', note: 'Corrected invoice shared on email and app' },
    ],
    response: 'The invoice has been corrected and is now available in Billing & invoices.',
  },
];

/** Earlier stays the tenant completed before the current one. */
const l3 = getListing('l3')!;
const l5 = getListing('l5')!;

export const PAST_BOOKINGS: PastBooking[] = [
  {
    ref: 'PGF-6042',
    listingId: l5.id,
    propertyName: l5.name,
    propertyImage: l5.coverImage,
    locality: l5.locality,
    type: l5.type,
    roomNumber: '202',
    bedLabel: 'C',
    sharingType: 'Triple',
    checkInDate: '2024-07-10',
    checkOutDate: '2025-06-28',
    durationMonths: 11,
    monthlyRent: 8500,
    totalPaid: 102000,
    refundedDeposit: 17000,
    rating: 4,
    status: 'Moved Out',
  },
  {
    ref: 'PGF-4188',
    listingId: l3.id,
    propertyName: l3.name,
    propertyImage: l3.coverImage,
    locality: l3.locality,
    type: l3.type,
    roomNumber: 'G2',
    bedLabel: 'A',
    sharingType: 'Double',
    checkInDate: '2023-08-01',
    checkOutDate: '2024-06-30',
    durationMonths: 10,
    monthlyRent: 12000,
    totalPaid: 120000,
    refundedDeposit: 24000,
    rating: 5,
    status: 'Completed',
  },
  {
    ref: 'PGF-3920',
    listingId: 'l2',
    propertyName: getListing('l2')!.name,
    propertyImage: getListing('l2')!.coverImage,
    locality: getListing('l2')!.locality,
    type: getListing('l2')!.type,
    roomNumber: '—',
    bedLabel: '—',
    sharingType: 'Single',
    checkInDate: '2023-05-15',
    checkOutDate: '2023-05-15',
    durationMonths: 0,
    monthlyRent: 16500,
    totalPaid: 0,
    refundedDeposit: 0,
    status: 'Cancelled',
  },
];

export const ROOM_SWAP_REQUESTS: RoomSwapRequest[] = [];

export const AVAILABLE_SWAP_ROOMS = [
  { room: '104', sharing: 'Single' as const, rent: 18000, available: 1 },
  { room: '201', sharing: 'Triple' as const, rent: 9500, available: 2 },
  { room: 'G3', sharing: 'Double' as const, rent: 13000, available: 1 },
];

export const MOVE_OUT_REQUESTS: MoveOutRequest[] = [];

/** Recurring monthly service charges from current billing (food, laundry, etc.). */
export function getMonthlyServiceCharges() {
  const serviceInvoice = INVOICES
    .filter((i) => !/rent|deposit|registration/i.test(i.label))
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))[0];

  if (!serviceInvoice) return { total: 0, items: [] as { label: string; amount: number }[] };

  const items = serviceInvoice.breakdown.filter((b) => !/rent|deposit/i.test(b.label));
  const total = items.reduce((s, b) => s + b.amount, 0);
  return {
    total: total || serviceInvoice.amount,
    items: items.length ? items : [{ label: serviceInvoice.label, amount: serviceInvoice.amount }],
  };
}

export type BookingRecord =
  | { kind: 'active'; booking: ActiveBooking }
  | { kind: 'past'; booking: PastBooking };

export type TenantBookingItem = BookingRecord;

export function getAllTenantBookings(): TenantBookingItem[] {
  return [
    ...ACTIVE_BOOKINGS.map((booking) => ({ kind: 'active' as const, booking })),
    ...PAST_BOOKINGS.map((booking) => ({ kind: 'past' as const, booking })),
  ];
}

export function bookingListStatus(item: TenantBookingItem): string {
  return item.kind === 'active' ? item.booking.status : item.booking.status;
}

export function bookingCheckInDate(item: TenantBookingItem): string {
  return item.booking.checkInDate;
}

export function getBookingByRef(ref: string): BookingRecord | null {
  const active = ACTIVE_BOOKINGS.find((b) => b.ref === ref);
  if (active) return { kind: 'active', booking: active };
  const past = PAST_BOOKINGS.find((b) => b.ref === ref);
  if (past) return { kind: 'past', booking: past };
  return null;
}
