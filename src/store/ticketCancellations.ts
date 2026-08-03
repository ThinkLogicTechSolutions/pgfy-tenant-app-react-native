/** Tracks maintenance/property tickets the tenant cancelled this session, keyed by ticket id.
 *  Tiny cross-screen store (mirrors bookingCancellations.ts). In a real build the cancel action
 *  POSTs to the API; here it persists for the session and drives the ticket list + detail sheet. */
import { useEffect, useReducer } from 'react';

const cancellations: Record<string, string> = {};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function useTicketCancellations() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => { listeners.delete(force); };
  }, []);
  return {
    isCancelled: (id: string): boolean => !!cancellations[id],
    cancel: (id: string) => {
      cancellations[id] = new Date().toISOString();
      emit();
    },
  };
}
