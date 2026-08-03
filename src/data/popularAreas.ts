/**
 * Popular neighbourhoods within a city — home "Popular areas" rail + view-all.
 * Areas render as illustrated tiles (a neighbourhood cluster tinted by `accent`).
 * Admins can override a tile with uploaded artwork via `image`.
 */
export interface PopularArea {
  id: string;
  name: string;
  city: string;
  stays: number;
  /** Tile illustration accent. */
  accent: string;
  /** Admin-uploaded artwork (overrides the built-in illustration). */
  image?: string;
}

export const POPULAR_AREAS: PopularArea[] = [
  { id: 'koramangala', name: 'Koramangala', city: 'Bengaluru', stays: 120, accent: '#3B82F6' },
  { id: 'hsr', name: 'HSR Layout', city: 'Bengaluru', stays: 95, accent: '#1FB573' },
  { id: 'ecity', name: 'Electronic City', city: 'Bengaluru', stays: 150, accent: '#7C5CFC' },
  { id: 'whitefield', name: 'Whitefield', city: 'Bengaluru', stays: 100, accent: '#F5A623' },
  { id: 'bellandur', name: 'Bellandur', city: 'Bengaluru', stays: 80, accent: '#FF4B3E' },
  { id: 'indiranagar', name: 'Indiranagar', city: 'Bengaluru', stays: 88, accent: '#01264E' },
  { id: 'btm', name: 'BTM Layout', city: 'Bengaluru', stays: 76, accent: '#3B82F6' },
  { id: 'marathahalli', name: 'Marathahalli', city: 'Bengaluru', stays: 64, accent: '#1FB573' },
];
