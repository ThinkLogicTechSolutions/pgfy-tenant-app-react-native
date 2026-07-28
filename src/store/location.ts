/**
 * Tenant location — GPS auto-detect or manual pick, shared across screens.
 * The home screen prompts for the device location on first load. If granted, we reverse-
 * geocode it and match it against master data (state → city → locality). A location outside
 * PGfy's operational areas is still selected (so the header reflects what the tenant chose)
 * but flagged `operational: false` — the home screen swaps its normal sections for a
 * "not operational here" prompt instead of blocking the pick with an alert.
 * With no location known at all, the header falls back to "Choose location" and the user
 * picks a city / area via the `/location` screen.
 */
import { useEffect, useReducer } from 'react';
import { resolveNearMeLocation } from '@/lib/nearMe';
import { useMasterData } from '@/context/MasterDataContext';
import type { CityMaster, LocalityMaster, StateMaster } from '@/lib/api';

export type LocationSource = 'gps' | 'manual';

export interface TenantLocation {
  label: string;
  source: LocationSource;
  operational: boolean;
  stateId?: number;
  cityId?: number;
  localityId?: number | null;
  /** Device coordinates — only set for a GPS-resolved location. */
  lat?: number;
  lng?: number;
}

let current: TenantLocation | null = null;
let resolving = false;
let attempted = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setTenantLocation(
  label: string,
  source: LocationSource = 'manual',
  ids?: { stateId?: number; cityId?: number; localityId?: number | null },
  operational = true,
) {
  const trimmed = label.trim();
  if (!trimmed) return;
  current = { label: trimmed, source, operational, ...ids };
  emit();
}

/** Clear the resolved location (denied permission, or user backed out of the picker). */
export function clearTenantLocation() {
  current = null;
  attempted = true;
  emit();
}

interface MasterDataLists {
  states: StateMaster[];
  cities: CityMaster[];
  localities: LocalityMaster[];
}

/** Request device location once; resolves to the matched operational city/locality on success. */
export async function detectTenantLocation(masterData: MasterDataLists): Promise<boolean> {
  if (resolving) return false;
  resolving = true;
  attempted = true;
  emit();
  const res = await resolveNearMeLocation(masterData);
  resolving = false;
  if (res.ok) {
    current = {
      label: res.label,
      source: 'gps',
      operational: true,
      stateId: res.stateId,
      cityId: res.cityId,
      localityId: res.localityId,
      lat: res.lat,
      lng: res.lng,
    };
    emit();
    return true;
  }
  if (res.reason === 'not-operational') {
    current = { label: res.label, source: 'gps', operational: false };
    emit();
    return false;
  }
  emit();
  return false;
}

export function useTenantLocation() {
  const [, force] = useReducer((x) => x + 1, 0);
  const { states, cities, localities } = useMasterData();
  useEffect(() => {
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);
  return {
    location: current,
    resolving,
    attempted,
    detect: () => detectTenantLocation({ states, cities, localities }),
    set: setTenantLocation,
  };
}
