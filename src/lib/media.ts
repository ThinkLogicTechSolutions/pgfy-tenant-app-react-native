import type { Listing, MediaSection } from '@/data/types';

/** Shared width:height for listing tiles & detail hero (4:3). */
export const PROPERTY_IMAGE_ASPECT = 4 / 3;

export function propertyImageHeight(width: number, aspectRatio = PROPERTY_IMAGE_ASPECT): number {
  return Math.round(width / aspectRatio);
}

/** Flat list of all property images (deduped, cover first). */
export function listingCarouselImages(listing: Pick<Listing, 'coverImage' | 'gallery'>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const uri of [listing.coverImage, ...listing.gallery]) {
    if (!seen.has(uri)) {
      seen.add(uri);
      out.push(uri);
    }
  }
  return out;
}

export function listingPhotoCount(listing: Pick<Listing, 'gallery' | 'mediaSections'>): number {
  if (listing.mediaSections?.length) {
    return listing.mediaSections.reduce((n, s) => n + s.images.length, 0);
  }
  return listing.gallery.length;
}

export function listingMediaSections(listing: Pick<Listing, 'mediaSections' | 'gallery'>): MediaSection[] {
  if (listing.mediaSections?.length) return listing.mediaSections;
  return [{ id: 'all', name: 'All', images: listing.gallery }];
}
