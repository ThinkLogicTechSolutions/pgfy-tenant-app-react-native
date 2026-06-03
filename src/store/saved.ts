/** Tiny global "saved / shortlist" store with cross-screen sync. */
import { useEffect, useReducer } from 'react';

const saved = new Set<string>(['l3', 'l7']);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function useSaved() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);
  return {
    isSaved: (id: string) => saved.has(id),
    toggle: (id: string) => {
      if (saved.has(id)) saved.delete(id);
      else saved.add(id);
      emit();
    },
    ids: () => Array.from(saved),
    count: saved.size,
  };
}
