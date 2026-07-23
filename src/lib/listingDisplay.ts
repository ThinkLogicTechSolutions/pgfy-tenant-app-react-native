import type { Listing, BookingMode } from '@/data/types';

/** Card title: "PG near Forum Mall" using the closest landmark, else locality. */
export function listingNearLandmarkTitle(listing: Listing): string {
  const place = listing.name; //.nearby[0]?.label ?? listing.locality;
  return place;//`PG near ${place}`;
}

export function listingSupportsBookingMode(listing: Listing, mode: BookingMode): boolean {
  if (mode === 'hourly') return listing.bookingConfig.hourlyEnabled && listing.hourlyPricing.length > 0;
  if (mode === 'daily') return listing.bookingConfig.dailyEnabled && listing.dailyPricing.length > 0;
  return listing.bookingConfig.monthlyEnabled;
}

/** Price-range filter bounds per booking mode (₹). Hourly/daily rates are far
 *  lower than monthly rent, so the slider rescales when the stay type changes. */
export const PRICE_BOUNDS: Record<BookingMode, { min: number; max: number; step: number }> = {
  monthly: { min: 2000, max: 25000, step: 500 },
  daily: { min: 100, max: 1500, step: 50 },
  hourly: { min: 20, max: 300, step: 10 },
};

/** Lowest "from" price for a listing in the given booking mode. */
export function listingPriceFrom(listing: Listing, mode: BookingMode): number {
  if (mode === 'hourly' && listing.hourlyPricing.length > 0) {
    return Math.min(...listing.hourlyPricing.map((t) => t.rentPerHour));
  }
  if (mode === 'daily' && listing.dailyPricing.length > 0) {
    return Math.min(...listing.dailyPricing.map((t) => t.rentPerDay));
  }
  return listing.priceFrom;
}

/** Highest-rated PG — used for the single promoted slot. */
export function getPromotedPgListingId(listings: Listing[]): string | null {
  const top = [...listings].filter((l) => l.type === 'PG').sort((a, b) => b.rating - a.rating)[0];
  return top?.id ?? null;
}

export function isPromotedListing(id: string, listings: Listing[]): boolean {
  return id === getPromotedPgListingId(listings);
}
