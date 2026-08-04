import { LOCATIONS, RECENT_SEARCHES } from './discovery';
import { LISTINGS } from './listings';

export const LOCATION_SEARCH_PLACEHOLDER = 'Search any location';

/** All searchable location strings for home autocomplete. */
export const LOCATION_SUGGESTIONS: string[] = [
  ...new Set([
    LOCATIONS[0].city,
    ...LOCATIONS[0].areas.map((a) => `${a}, ${LOCATIONS[0].city}`),
    ...LOCATIONS[0].areas,
    ...RECENT_SEARCHES,
    ...LISTINGS.map((l) => l.locality),
    ...LISTINGS.map((l) => `${l.locality}, Bengaluru`),
  ]),
];

export function filterLocations(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return LOCATION_SUGGESTIONS.slice(0, limit);
  return LOCATION_SUGGESTIONS.filter((s) => s.toLowerCase().includes(q)).slice(0, limit);
}
