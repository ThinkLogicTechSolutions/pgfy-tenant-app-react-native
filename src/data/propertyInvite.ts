/**
 * Master data for the "Invite a PG" form (Home → Quick actions → Invite a PG).
 * Mirrors the admin-web Property Types + location (state → city → locality) masters,
 * so a submitted invite resolves cleanly to the same geography on the admin side.
 */

export const PG_TYPES = ['PG', 'Hostel', 'Co-living'] as const;
export type PgType = (typeof PG_TYPES)[number];

export interface InviteCity {
  name: string;
  localities: string[];
}
export interface InviteState {
  name: string;
  cities: InviteCity[];
}

/** State → City → Locality hierarchy (subset of the admin location master). */
export const INVITE_GEOGRAPHY: InviteState[] = [
  {
    name: 'Karnataka',
    cities: [
      { name: 'Bengaluru', localities: ['Koramangala', 'HSR Layout', 'Indiranagar', 'Whitefield', 'Electronic City', 'Marathahalli'] },
    ],
  },
  {
    name: 'Maharashtra',
    cities: [
      { name: 'Mumbai', localities: ['Andheri', 'Powai', 'Thane'] },
      { name: 'Pune', localities: ['Baner', 'Hinjewadi'] },
    ],
  },
  {
    name: 'Telangana',
    cities: [
      { name: 'Hyderabad', localities: ['Gachibowli', 'Hitech City'] },
    ],
  },
  {
    name: 'Delhi',
    cities: [
      { name: 'Delhi', localities: ['Mukherjee Nagar', 'Karol Bagh', 'Laxmi Nagar'] },
    ],
  },
  {
    name: 'Tamil Nadu',
    cities: [
      { name: 'Chennai', localities: ['Velachery', 'Adyar', 'OMR'] },
    ],
  },
  {
    name: 'Haryana',
    cities: [
      { name: 'Gurugram', localities: ['DLF Cyber City', 'Sector 14', 'Sohna Road'] },
    ],
  },
];

export const INVITE_STATES: string[] = INVITE_GEOGRAPHY.map((s) => s.name);

export function citiesForState(state: string | null): string[] {
  if (!state) return [];
  return INVITE_GEOGRAPHY.find((s) => s.name === state)?.cities.map((c) => c.name) ?? [];
}

export function localitiesForCity(state: string | null, city: string | null): string[] {
  if (!state || !city) return [];
  const found = INVITE_GEOGRAPHY.find((s) => s.name === state)?.cities.find((c) => c.name === city);
  return found?.localities ?? [];
}
