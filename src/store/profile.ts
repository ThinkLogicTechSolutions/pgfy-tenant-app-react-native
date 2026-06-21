/**
 * Tenant profile store — occupation (captured in KYC step 2) and the optional
 * roommate-compatibility preferences (captured after booking, or later from My Stay).
 * Mirrors the lightweight subscribe/useReducer pattern in store/kyc.ts.
 */
import { useEffect, useReducer } from 'react';

export type Occupation = 'student' | 'professional';
export type SleepSchedule = 'early' | 'late';
export type Diet = 'veg' | 'vegan' | 'nonveg';

/** Tenant lifestyle preferences. `null` = not answered yet. */
export interface LifestylePrefs {
  smoking: boolean | null;
  alcohol: boolean | null;
  sleep: SleepSchedule | null;
  diet: Diet | null;
}

export interface OccupationDetails {
  enrollmentNo?: string;
  companyEmail?: string;
  companyEmailVerified?: boolean;
  /** labels of uploaded documents (mock) */
  docs: string[];
}

interface ProfileState {
  occupation: Occupation | null;
  occupationDetails: OccupationDetails;
  prefs: LifestylePrefs;
  consentToShare: boolean;
  /** true once the tenant has saved (or explicitly completed) their preferences */
  preferencesFilled: boolean;
}

const EMPTY_PREFS: LifestylePrefs = { smoking: null, alcohol: null, sleep: null, diet: null };

let state: ProfileState = {
  occupation: null,
  occupationDetails: { docs: [] },
  prefs: { ...EMPTY_PREFS },
  consentToShare: false,
  preferencesFilled: false,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getProfile(): ProfileState {
  return state;
}

export function setOccupation(occupation: Occupation, details: OccupationDetails) {
  state = { ...state, occupation, occupationDetails: details };
  emit();
}

export function setPreferences(prefs: LifestylePrefs, consentToShare: boolean) {
  state = { ...state, prefs, consentToShare, preferencesFilled: true };
  emit();
}

export function resetProfile() {
  state = {
    occupation: null,
    occupationDetails: { docs: [] },
    prefs: { ...EMPTY_PREFS },
    consentToShare: false,
    preferencesFilled: false,
  };
  emit();
}

export function useProfile() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);
  return {
    ...state,
    setOccupation,
    setPreferences,
    reset: resetProfile,
  };
}
