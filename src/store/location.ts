/**
 * Tenant location — GPS auto-detect or manual pick, shared across screens.
 * The home screen prompts for the device location on first load. If granted we
 * resolve the nearest city; otherwise the header falls back to "Choose location"
 * and the user picks a city / area via the `/location` screen.
 */
import { useEffect, useReducer } from 'react';
import { LISTINGS } from '@/data';
import { resolveNearMeLocation } from '@/lib/nearMe';

export type LocationSource = 'gps' | 'manual';

export interface TenantLocation {
  label: string;
  source: LocationSource;
}

let current: TenantLocation | null = null;
let resolving = false;
let attempted = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Mock catalog is Bengaluru-only — map a resolved locality back to its city. */
function cityForLocality(locality: string): string | undefined {
  return LISTINGS.find((l) => l.locality.toLowerCase() === locality.toLowerCase())?.city;
}

export function setTenantLocation(label: string, source: LocationSource = 'manual') {
  const trimmed = label.trim();
  if (!trimmed) return;
  current = { label: trimmed, source };
  emit();
}

/** Clear the resolved location — simulates a denied permission (demo). */
export function clearTenantLocation() {
  current = null;
  attempted = true;
  emit();
}

/** Request device location once; resolves to nearest city on success. */
export async function detectTenantLocation(): Promise<boolean> {
  if (resolving) return false;
  resolving = true;
  attempted = true;
  emit();
  const res = await resolveNearMeLocation();
  resolving = false;
  if (res.ok) {
    current = { label: cityForLocality(res.label) ?? res.label, source: 'gps' };
    emit();
    return true;
  }
  emit();
  return false;
}

export function useTenantLocation() {
  const [, force] = useReducer((x) => x + 1, 0);
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
    detect: detectTenantLocation,
    set: setTenantLocation,
  };
}
