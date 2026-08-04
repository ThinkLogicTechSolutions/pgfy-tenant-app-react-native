/**
 * Matches a geocoded state/city/locality name against master data to decide whether PGfy
 * is operational there (auth_api.md — "check with master data if that is present").
 */
import type { CityMaster, LocalityMaster, StateMaster } from '@/lib/api';

export interface OperationalMatch {
  stateId: number;
  cityId: number;
  localityId: number | null;
  cityName: string;
  localityName: string | null;
}

const norm = (s: string) => s.trim().toLowerCase();

export function matchOperationalLocation(
  address: { state?: string; city?: string; locality?: string },
  masterData: { states: StateMaster[]; cities: CityMaster[]; localities: LocalityMaster[] },
): OperationalMatch | null {
  if (!address.city) return null;

  // When a state is given (reverse/forward geocode results), scope the city match to it.
  // Without one (matching a plain city-name string, e.g. a recent search), match by name alone.
  let stateId: number | undefined;
  if (address.state) {
    const state = masterData.states.find((s) => s.status === 'ACTIVE' && norm(s.name) === norm(address.state!));
    if (!state) return null;
    stateId = state.id;
  }

  const city = masterData.cities.find(
    (c) => c.status === 'ACTIVE' && (stateId == null || c.state_id === stateId) && norm(c.name) === norm(address.city!),
  );
  if (!city) return null;
  const state = masterData.states.find((s) => s.id === city.state_id);
  if (!state) return null;

  const locality = address.locality
    ? masterData.localities.find(
        (l) => l.status === 'ACTIVE' && l.city_id === city.id && norm(l.name) === norm(address.locality!),
      )
    : undefined;

  return {
    stateId: state.id,
    cityId: city.id,
    localityId: locality?.id ?? null,
    cityName: city.name,
    localityName: locality?.name ?? null,
  };
}
