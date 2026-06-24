/** Tracks bookings the tenant cancelled this session, keyed by booking ref.
 *  Tiny cross-screen store (mirrors groupBookings.ts). In a real build the cancel action
 *  POSTs to the API; here it persists for the session and drives the booking detail + list. */
import { useEffect, useReducer } from 'react';
import type { BookingCancellation } from '@/data/cancellation';

const cancellations: Record<string, BookingCancellation> = {};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function useBookingCancellations() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => { listeners.delete(force); };
  }, []);
  return {
    get: (ref: string): BookingCancellation | undefined => cancellations[ref],
    isCancelled: (ref: string): boolean => !!cancellations[ref],
    cancel: (ref: string, info: BookingCancellation) => {
      cancellations[ref] = info;
      emit();
    },
  };
}
