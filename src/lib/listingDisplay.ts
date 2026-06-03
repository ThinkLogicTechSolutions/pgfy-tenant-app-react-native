import type { Listing } from '@/data/types';

/** Card title: "PG near Forum Mall" using the closest landmark, else locality. */
export function listingNearLandmarkTitle(listing: Listing): string {
  const place = listing.nearby[0]?.label ?? listing.locality;
  return `PG near ${place}`;
}
