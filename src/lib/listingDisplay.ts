import type { Listing, BookingMode } from '@/data/types';

/** Card title: "PG near Forum Mall" using the closest landmark, else locality. */
export function listingNearLandmarkTitle(listing: Listing): string {
  const place = listing.nearby[0]?.label ?? listing.locality;
  return `PG near ${place}`;
}

export function listingSupportsBookingMode(listing: Listing, mode: BookingMode): boolean {
  if (mode === 'hourly') return listing.bookingConfig.hourlyEnabled && listing.hourlyPricing.length > 0;
  if (mode === 'daily') return listing.bookingConfig.dailyEnabled && listing.dailyPricing.length > 0;
  return listing.bookingConfig.monthlyEnabled;
}

/** Highest-rated PG — used for the single promoted slot. */
export function getPromotedPgListingId(listings: Listing[]): string | null {
  const top = [...listings].filter((l) => l.type === 'PG').sort((a, b) => b.rating - a.rating)[0];
  return top?.id ?? null;
}

export function isPromotedListing(id: string, listings: Listing[]): boolean {
  return id === getPromotedPgListingId(listings);
}
