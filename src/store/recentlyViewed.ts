/** Recently-viewed listings — drives the home "Continue browsing" rail. */
import { useEffect, useReducer } from 'react';

const MAX = 12;
let ids: string[] = ['l1', 'l7', 'l3'];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function recordView(id: string) {
  ids = [id, ...ids.filter((x) => x !== id)].slice(0, MAX);
  emit();
}

export function useRecentlyViewed() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);
  return { ids };
}
