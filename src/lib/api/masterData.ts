/**
 * Master-data lookups (auth_api.md — Master data).
 *
 * Read-only reference data shared across the app. State → city → locality drive the
 * home location-gate and the location-search autocomplete (a tenant can only search an
 * operational locality). Maintenance / support categories and the master config are
 * loaded ahead of time for the tickets/support flows.
 *
 * Every endpoint is fetched with Feathers' `$limit=-1` so the full, unpaginated list
 * comes back as a bare array.
 */
import { request } from './client';
import { unwrapList } from './types';
import type {
  AmenityMaster,
  CityMaster,
  ListResponse,
  LocalityMaster,
  MaintenanceCategoryMaster,
  MasterConfig,
  PlatformSupportCategoryMaster,
  PopularDestinationMaster,
  StateMaster,
} from './types';

/** Feathers: `$limit=-1` disables pagination and returns every row. */
const ALL = { $limit: -1 } as const;

/** Operational states — the top of the state → city → locality operational check. */
export async function listStates(): Promise<StateMaster[]> {
  return unwrapList(await request<ListResponse<StateMaster>>('/master-data/state-master', { query: ALL }));
}

/** All cities; filter by `state_id` client-side. */
export async function listCities(): Promise<CityMaster[]> {
  return unwrapList(await request<ListResponse<CityMaster>>('/master-data/city-master', { query: ALL }));
}

/** All localities; filter by `city_id` client-side. */
export async function listLocalities(): Promise<LocalityMaster[]> {
  return unwrapList(await request<ListResponse<LocalityMaster>>('/master-data/locality-master', { query: ALL }));
}

/** The amenity catalogue (WiFi, AC, Power Backup, …) — drives the search filter sheet's
 * "Amenities" section (previously a hardcoded mock list). */
export async function listAmenities(): Promise<AmenityMaster[]> {
  return unwrapList(await request<ListResponse<AmenityMaster>>('/master-data/amenity-master', { query: ALL }));
}

/** Maintenance/complaint categories (loaded ahead of time; used by the tickets flow). */
export async function listMaintenanceCategories(): Promise<MaintenanceCategoryMaster[]> {
  return unwrapList(
    await request<ListResponse<MaintenanceCategoryMaster>>('/master-data/maintenance-category-master', { query: ALL }),
  );
}

/** Platform support categories, scoped by `panel` (loaded ahead of time). */
export async function listPlatformSupportCategories(): Promise<PlatformSupportCategoryMaster[]> {
  return unwrapList(
    await request<ListResponse<PlatformSupportCategoryMaster>>('/master-data/platform-support-category-master', {
      query: ALL,
    }),
  );
}

/** Curated home-page destination cities, eager-loaded with their city/state rows. */
export async function listPopularDestinations(): Promise<PopularDestinationMaster[]> {
  return unwrapList(
    await request<ListResponse<PopularDestinationMaster>>('/master-data/popular-destination-master', {
      query: { ...ALL, '$eager[0]': 'city', '$eager[1]': 'state' },
    }),
  );
}

/**
 * Platform-wide business config. The service returns a single-row list; we surface the
 * first (and only) row, or `null` if none is configured.
 */
export async function getMasterConfig(): Promise<MasterConfig | null> {
  const rows = unwrapList(await request<ListResponse<MasterConfig>>('/master-data/master-config', { query: ALL }));
  return rows[0] ?? null;
}
