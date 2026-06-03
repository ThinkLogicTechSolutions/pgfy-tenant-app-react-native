/** PGfy Tenant — mock data barrel. */
export * from './types';
export { coverImages, interiorImages, galleryFor, avatarFor } from './images';
export { LISTINGS, getListing } from './listings';
export * from './discovery';
export { POPULAR_DESTINATIONS, type PopularDestination } from './popularDestinations';
export { USER } from './user';
export {
  ACTIVE_BOOKING, LEASE, INVOICES, VISITORS, TICKETS,
  ROOM_SWAP_REQUESTS, AVAILABLE_SWAP_ROOMS, MOVE_OUT_REQUESTS, PAST_BOOKINGS,
  getBookingByRef, type BookingRecord,
} from './booking';
export { NOTIFICATIONS, unreadCount } from './notifications';
export { COUPONS, resolveCoupon, type Coupon } from './coupons';

import { LISTINGS } from './listings';
export function listingsByIds(ids: string[]) {
  return ids.map((id) => LISTINGS.find((l) => l.id === id)).filter(Boolean) as typeof LISTINGS;
}
