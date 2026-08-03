/** Discovery home content — curated rails, promos, locations, filter options. */
import type { CuratedRail, PromoBanner } from './types';

export type { PopularDestination } from './popularDestinations';
export { POPULAR_DESTINATIONS } from './popularDestinations';

export const CURATED_RAILS: CuratedRail[] = [
  { key: 'recommended', title: 'Recommended for you', subtitle: 'Based on your search', listingIds: ['l1', 'l7', 'l3', 'l2'] },
  { key: 'nearby', title: 'Near you', subtitle: 'Within 5 km', listingIds: ['l1', 'l9', 'l3', 'l8'] },
  { key: 'trending', title: 'Trending this week', listingIds: ['l2', 'l5', 'l1', 'l4'] },
  { key: 'colleges', title: 'Near colleges', listingIds: ['l10', 'l3', 'l5'] },
  { key: 'new', title: 'New on PGfy', listingIds: ['l4', 'l10', 'l9'] },
];

export const PROMO_BANNERS: PromoBanner[] = [
  { id: 'promo1', title: 'Move in this month', subtitle: 'Flat ₹500 off your first booking', cta: 'Use WELCOME500', tone: 'coral', icon: 'pricetag' },
  { id: 'promo2', title: 'Rewards', subtitle: 'Scratch cards from Swiggy, Amazon & more', cta: 'View rewards', tone: 'success', icon: 'gift' },
  { id: 'promo3', title: 'Zero brokerage', subtitle: 'Every PGfy booking, always', cta: 'Learn more', tone: 'info', icon: 'shield-checkmark' },
];

export const LOCATIONS = [
  { city: 'Bengaluru', areas: ['Koramangala', 'HSR Layout', 'Indiranagar', 'Whitefield', 'BTM Layout', 'Marathahalli', 'Electronic City', 'Jayanagar', 'MG Road', 'Yelahanka'] },
];

/** Top cities shown on the location picker (no GPS required). */
export const TOP_CITIES: { name: string; state: string }[] = [
  { name: 'Bengaluru', state: 'Karnataka' },
  { name: 'Hyderabad', state: 'Telangana' },
  { name: 'Pune', state: 'Maharashtra' },
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Delhi NCR', state: 'Delhi' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Kolkata', state: 'West Bengal' },
  { name: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Jaipur', state: 'Rajasthan' },
  { name: 'Kochi', state: 'Kerala' },
];

export const RECENT_SEARCHES = ['Koramangala', 'PG near Christ University', 'Co-living HSR', 'Girls PG Indiranagar'];

export const FILTER_OPTIONS = {
  budget: { min: 2000, max: 25000, step: 500 },
  stay: ['Any', 'Short Stay', 'Long Stay'] as const,
  sharing: ['Single', 'Double', 'Triple', '4-sharing', 'Dormitory'] as const,
  gender: ['Any', 'Male', 'Female', 'Co-ed'] as const,
  food: ['Veg', 'Non-Veg', 'Breakfast', 'Lunch', 'Dinner'],
  amenities: ['Wi-Fi', 'AC', 'Power Backup', 'Gym', 'Parking', 'Laundry', 'CCTV Surveillance', 'Attached Bathroom', 'Hot Water', 'Lift Facility', 'Dedicated Security', 'Pet Friendly'],
  sort: ['Relevance', 'Price: Low to High', 'Price: High to Low', 'Rating', 'Distance'],
};

export const SORT_OPTIONS = FILTER_OPTIONS.sort;
