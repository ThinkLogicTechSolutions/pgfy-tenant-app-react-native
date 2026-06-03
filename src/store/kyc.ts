/** Global KYC status store. Starts unverified so the verification flow is reachable. */
import { useEffect, useReducer } from 'react';
import type { KycStatus } from '@/data/types';

let status: KycStatus = 'Not Submitted';
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getKyc(): KycStatus {
  return status;
}
export function setKyc(next: KycStatus) {
  status = next;
  emit();
}

export function useKyc() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);
  return {
    status,
    verified: status === 'Verified',
    setVerified: () => setKyc('Verified'),
    reset: () => setKyc('Not Submitted'),
  };
}
