/** PGfy Tenant — mock data barrel. */
export * from './types';
export { coverImages, interiorImages, galleryFor, mediaSectionsFor, avatarFor } from './images';
export { LISTINGS, getListing } from './listings';
export * from './discovery';
export { POPULAR_DESTINATIONS, type PopularDestination } from './popularDestinations';
export { USER } from './user';
export {
  ACTIVE_BOOKING, ACTIVE_BOOKINGS, ACTIVE_HOURLY_BOOKING, ACTIVE_DAILY_BOOKING, UPCOMING_BOOKING,
  LEASE, INVOICES, VISITORS, TICKETS,
  ROOM_SWAP_REQUESTS, AVAILABLE_SWAP_ROOMS, MOVE_OUT_REQUESTS, PAST_BOOKINGS,
  getBookingByRef, getAllTenantBookings, bookingListStatus, bookingCheckInDate,
  getMonthlyServiceCharges, type BookingRecord, type TenantBookingItem,
} from './booking';
export {
  EXTENSION_LIMITS, maxExtensionUnits, extensionUnitLabel, extensionRate,
  checkExtensionAvailability, priceExtension,
  type AvailabilityResult, type ExtensionPrice,
} from './extension';
export { NOTIFICATIONS, unreadCount } from './notifications';
export { PLATFORM_FEE, computePlatformFee, type PlatformFeeConfig, type FeeType } from './platform';
export {
  CANCELLATION_POLICY, REFUND_ETA, computeCancellationCharge,
  type CancellationPolicy, type CancellationModePolicy, type CancellationChargeType,
  type CancellationCharge, type BookingCancellation,
} from './cancellation';
export {
  BRAND_VENDORS,
  BRAND_OFFERS,
  activeOffers,
  getVendor,
  getOffer,
  pickRandomOffer,
  isRewardExpired,
  isRewardOpened,
  DEMO_SCRATCH_CARDS,
  VENDOR_CATEGORY_ICON,
  type BrandVendor,
  type BrandOffer,
  type TenantReward,
  type VendorCategory,
  type ScratchCardStatus,
} from './brandRewards';
export {
  REFERRAL_PROGRAM, REFERRAL, APP_STORE_URL, formatBenefit,
  type ReferralBenefit, type ReferralProgram, type RewardKind,
} from './referral';

import { LISTINGS } from './listings';
export function listingsByIds(ids: string[]) {
  return ids.map((id) => LISTINGS.find((l) => l.id === id)).filter(Boolean) as typeof LISTINGS;
}
