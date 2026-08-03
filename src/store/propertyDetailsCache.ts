/** Hands the already-fetched property details from the listing-detail screen to the
 * review-booking screen so it doesn't re-fetch the same property over the network. */
import type { Listing } from '@/data/types';

const cache = new Map<number, Listing>();

export function cachePropertyDetails(propertyId: number, listing: Listing) {
  cache.set(propertyId, listing);
}

export function getCachedPropertyDetails(propertyId: number): Listing | undefined {
  return cache.get(propertyId);
}
