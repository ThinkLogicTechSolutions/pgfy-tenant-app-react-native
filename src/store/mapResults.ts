/** Hands the current search/browse result list to the map screen without a re-fetch or a huge query string. */
import { useEffect, useReducer } from 'react';
import type { Listing } from '@/data/types';

let current: Listing[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setMapResults(listings: Listing[]) {
  current = listings;
  emit();
}

export function useMapResults(): Listing[] {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);
  return current;
}
