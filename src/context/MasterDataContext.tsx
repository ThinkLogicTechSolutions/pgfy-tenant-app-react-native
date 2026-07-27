/**
 * Loads the app's read-only master data (auth_api.md — Master data) once the tenant is
 * authenticated and keeps it in memory for the session.
 *
 * State → city → locality drive the home location-gate and the location-search
 * autocomplete (a tenant can only browse an operational locality). Maintenance / support
 * categories, popular destinations and the master config are fetched here too so they're
 * ready when those features need them.
 *
 * Each list is loaded independently (`Promise.allSettled`), so one slow/failing endpoint
 * never blocks the rest — screens just see empty lists until `reload` succeeds.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { masterDataApi } from '@/lib/api';
import type {
  CityMaster,
  LocalityMaster,
  MaintenanceCategoryMaster,
  MasterConfig,
  PlatformSupportCategoryMaster,
  PopularDestinationMaster,
  StateMaster,
} from '@/lib/api';
import { useAuth } from './AuthContext';

interface MasterDataValue {
  loading: boolean;
  /** Set only when nothing could be loaded at all; partial loads leave this null. */
  error: string | null;

  states: StateMaster[];
  cities: CityMaster[];
  localities: LocalityMaster[];
  maintenanceCategories: MaintenanceCategoryMaster[];
  supportCategories: PlatformSupportCategoryMaster[];
  popularDestinations: PopularDestinationMaster[];
  config: MasterConfig | null;

  /** Re-fetch everything (e.g. after a transient failure). */
  reload: () => Promise<void>;

  // Derived, display-ready selectors (ACTIVE only, sorted by priority) ------
  activeStates: StateMaster[];
  /** ACTIVE cities within a state. */
  citiesForState: (stateId: number | null | undefined) => CityMaster[];
  /** ACTIVE localities within a city. */
  localitiesForCity: (cityId: number | null | undefined) => LocalityMaster[];
}

const MasterDataContext = createContext<MasterDataValue | null>(null);

const isActive = <T extends { status: string }>(row: T) => row.status === 'ACTIVE';
const byPriority = <T extends { priority: number }>(a: T, b: T) => a.priority - b.priority;

export function MasterDataProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [states, setStates] = useState<StateMaster[]>([]);
  const [cities, setCities] = useState<CityMaster[]>([]);
  const [localities, setLocalities] = useState<LocalityMaster[]>([]);
  const [maintenanceCategories, setMaintenanceCategories] = useState<MaintenanceCategoryMaster[]>([]);
  const [supportCategories, setSupportCategories] = useState<PlatformSupportCategoryMaster[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<PopularDestinationMaster[]>([]);
  const [config, setConfig] = useState<MasterConfig | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [statesR, citiesR, localitiesR, maintenanceR, supportR, destinationsR, configR] = await Promise.allSettled([
      masterDataApi.listStates(),
      masterDataApi.listCities(),
      masterDataApi.listLocalities(),
      masterDataApi.listMaintenanceCategories(),
      masterDataApi.listPlatformSupportCategories(),
      masterDataApi.listPopularDestinations(),
      masterDataApi.getMasterConfig(),
    ]);

    if (statesR.status === 'fulfilled') setStates(statesR.value);
    if (citiesR.status === 'fulfilled') setCities(citiesR.value);
    if (localitiesR.status === 'fulfilled') setLocalities(localitiesR.value);
    if (maintenanceR.status === 'fulfilled') setMaintenanceCategories(maintenanceR.value);
    if (supportR.status === 'fulfilled') setSupportCategories(supportR.value);
    if (destinationsR.status === 'fulfilled') setPopularDestinations(destinationsR.value);
    if (configR.status === 'fulfilled') setConfig(configR.value);

    const allFailed = [statesR, citiesR, localitiesR, maintenanceR, supportR, destinationsR, configR].every(
      (r) => r.status === 'rejected',
    );
    if (allFailed) setError('Could not load reference data. Pull to retry.');
    setLoading(false);
  }, []);

  // Load once the session is live; master data is authenticated. Clear on sign-out so a
  // different account never sees stale reference data.
  useEffect(() => {
    if (status === 'authenticated') {
      void load();
    } else if (status === 'unauthenticated') {
      setStates([]);
      setCities([]);
      setLocalities([]);
      setMaintenanceCategories([]);
      setSupportCategories([]);
      setPopularDestinations([]);
      setConfig(null);
      setError(null);
    }
  }, [status, load]);

  const activeStates = useMemo(() => states.filter(isActive).sort(byPriority), [states]);

  const citiesForState = useCallback(
    (stateId: number | null | undefined) =>
      stateId == null ? [] : cities.filter((c) => c.state_id === stateId && isActive(c)).sort(byPriority),
    [cities],
  );

  const localitiesForCity = useCallback(
    (cityId: number | null | undefined) =>
      cityId == null ? [] : localities.filter((l) => l.city_id === cityId && isActive(l)).sort(byPriority),
    [localities],
  );

  const value = useMemo<MasterDataValue>(
    () => ({
      loading,
      error,
      states,
      cities,
      localities,
      maintenanceCategories,
      supportCategories,
      popularDestinations,
      config,
      reload: load,
      activeStates,
      citiesForState,
      localitiesForCity,
    }),
    [
      loading,
      error,
      states,
      cities,
      localities,
      maintenanceCategories,
      supportCategories,
      popularDestinations,
      config,
      load,
      activeStates,
      citiesForState,
      localitiesForCity,
    ],
  );

  return <MasterDataContext.Provider value={value}>{children}</MasterDataContext.Provider>;
}

export function useMasterData() {
  const ctx = useContext(MasterDataContext);
  if (!ctx) throw new Error('useMasterData requires MasterDataProvider');
  return ctx;
}
